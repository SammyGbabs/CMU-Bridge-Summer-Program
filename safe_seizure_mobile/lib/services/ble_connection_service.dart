import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';

enum SeizureState { normal, alarm, suspected }

/// BLE contract (see docs from firmware team):
/// - Service:            19B10000-...
/// - Alarm (state):      19B10001-...  uint8, read/notify/write
/// - Motion Intensity:   19B10002-...  float32 LE, read/notify, ~2s
/// - Rotation Activity:  19B10003-...  float32 LE, read/notify, ~2s
class BleConnectionService {
  final serviceUuid = Guid("19B10000-E8F2-537E-4F6C-D104768A1214");
  final stateCharUuid = Guid("19B10001-E8F2-537E-4F6C-D104768A1214");
  final motionCharUuid = Guid("19B10002-E8F2-537E-4F6C-D104768A1214");
  final rotationCharUuid = Guid("19B10003-E8F2-537E-4F6C-D104768A1214");

  BluetoothDevice? _device;
  BluetoothCharacteristic? _stateCharacteristic;

  String? get connectedDeviceName => _device?.platformName;

  final _stateController = StreamController<SeizureState>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();
  final _motionController = StreamController<double>.broadcast();
  final _rotationController = StreamController<double>.broadcast();

  /// Broadcasts every seizure-state update from the wearable. Multiple
  /// listeners can subscribe at once (e.g. the event recorder and the UI).
  Stream<SeizureState> get stateStream => _stateController.stream;

  /// Broadcasts connect/disconnect changes. Multiple listeners can
  /// subscribe at once.
  Stream<bool> get connectionStream => _connectionController.stream;

  /// Motion intensity in m/s² (acceleration magnitude, gravity subtracted,
  /// clamped >= 0), updated roughly every 2s while connected.
  Stream<double> get motionIntensityStream => _motionController.stream;

  /// Rotation activity in degrees/second (gyroscope magnitude), updated
  /// roughly every 2s while connected.
  Stream<double> get rotationActivityStream => _rotationController.stream;

  final _scanResultsController = StreamController<List<ScanResult>>.broadcast();
  StreamSubscription<List<ScanResult>>? _scanResultsSubscription;

  /// Devices found so far in the current scan, advertising the SafeSeizure
  /// service UUID. Does not auto-connect — the UI shows these and the user
  /// picks which one to connect to.
  Stream<List<ScanResult>> get scanResultsStream => _scanResultsController.stream;

  SeizureState _lastState = SeizureState.normal;
  SeizureState get lastState => _lastState;

  bool _isConnected = false;
  bool get isConnected => _isConnected;

  Future<void> _requestPermissions() async {
    await Permission.bluetoothScan.request();
    await Permission.bluetoothConnect.request();
    await Permission.locationWhenInUse.request();
  }

  /// Scans for nearby devices advertising the SafeSeizure service UUID and
  /// reports them via [scanResultsStream] as they're found. Does not
  /// connect to anything — call [connectToDevice] once the user picks one.
  Future<void> startScan() async {
    final adapterState = await FlutterBluePlus.adapterState.first;
    if (adapterState != BluetoothAdapterState.on) {
      // No real Bluetooth radio available (e.g. running on a simulator,
      // or the device's Bluetooth is off/unauthorized). Fail quietly
      // instead of throwing, so the rest of the app keeps working.
      debugPrint('Bluetooth unavailable ($adapterState) — skipping scan.');
      return;
    }

    try {
      await _requestPermissions();

      // Filter by the SafeSeizure service UUID directly (per BLE contract)
      // rather than only matching on advertised name.
      await FlutterBluePlus.startScan(
        withServices: [serviceUuid],
        timeout: const Duration(seconds: 10),
      );

      _scanResultsSubscription?.cancel();
      _scanResultsSubscription = FlutterBluePlus.scanResults.listen((
        results,
      ) {
        debugPrint(
          'Scan results: ${results.map((r) => r.device.platformName).toList()}',
        );
        _scanResultsController.add(results);
      });
    } catch (e) {
      debugPrint('BLE scan failed: $e');
    }
  }

  Future<void> stopScan() async {
    await FlutterBluePlus.stopScan();
    await _scanResultsSubscription?.cancel();
    _scanResultsSubscription = null;
  }

  /// Connects to a device the user picked from [scanResultsStream].
  Future<void> connectToDevice(BluetoothDevice device) async {
    await stopScan();
    await _connectToDevice(device);
  }

  Future<void> _connectToDevice(BluetoothDevice device) async {
    _device = device;

    // Auto-reconnect if it drops
    device.connectionState.listen((state) {
      if (state == BluetoothConnectionState.disconnected) {
        _setConnected(false);
        Future.delayed(const Duration(seconds: 2), () => _connectToDevice(device));
      } else if (state == BluetoothConnectionState.connected) {
        _setConnected(true);
      }
    });

    try {
      // autoConnect:true is Android's lazy/background mode meant for
      // reconnecting to a previously-known device later — it can resolve
      // before the device is actually GATT-connected, which is why
      // discoverServices() kept failing with "device is not connected"
      // right after "Connected to ..." printed. We're connecting to a
      // device we just found via a live scan, so a direct connection
      // (autoConnect:false) is what actually applies here; our own
      // connectionState listener below already handles reconnecting if it
      // drops later. mtu stays null — our payloads are tiny (1-4 bytes),
      // so there's no need to negotiate a larger one.
      await device.connect(
        license: License.nonprofit,
        autoConnect: false,
        mtu: null,
      );
      debugPrint('Connected to ${device.platformName}');

      List<BluetoothService> services = await device.discoverServices();

      for (var service in services) {
        debugPrint('Found service: ${service.uuid}');
        if (service.uuid != serviceUuid) continue;

        for (var c in service.characteristics) {
          debugPrint('  Characteristic: ${c.uuid}');
          if (c.uuid == stateCharUuid) {
            _stateCharacteristic = c;
            await c.setNotifyValue(true);
            c.lastValueStream.listen(_handleStateUpdate);
          } else if (c.uuid == motionCharUuid) {
            await c.setNotifyValue(true);
            c.lastValueStream.listen((value) {
              final parsed = _parseFloat32LE(value);
              if (parsed != null) _motionController.add(parsed);
            });
          } else if (c.uuid == rotationCharUuid) {
            await c.setNotifyValue(true);
            c.lastValueStream.listen((value) {
              final parsed = _parseFloat32LE(value);
              if (parsed != null) _rotationController.add(parsed);
            });
          }
        }
      }
    } catch (e) {
      debugPrint('BLE connect/discoverServices failed: $e');
      _setConnected(false);
    }
  }

  double? _parseFloat32LE(List<int> bytes) {
    if (bytes.length < 4) return null;
    final byteData = ByteData.sublistView(Uint8List.fromList(bytes));
    return byteData.getFloat32(0, Endian.little);
  }

  void _setConnected(bool connected) {
    _isConnected = connected;
    _connectionController.add(connected);
  }

  void _handleStateUpdate(List<int> value) {
    if (value.isEmpty) return;
    int raw = value[0];
    debugPrint('Received value: $raw');

    switch (raw) {
      case 0:
        _lastState = SeizureState.normal;
        _stateController.add(SeizureState.normal);
        break;
      case 2:
        _lastState = SeizureState.suspected;
        _stateController.add(SeizureState.suspected);
        break;
      case 1:
        _lastState = SeizureState.alarm;
        _stateController.add(SeizureState.alarm);
        break;
    }
  }

  /// Write 0 to acknowledge/dismiss a confirmed (1) alarm. Per the BLE
  /// contract this is only meaningful during the alarm state — writing
  /// during suspected/normal is harmless but has no effect on the device,
  /// since only the physical device (double-tap) resolves the suspected
  /// state.
  Future<void> dismissAlarm() async {
    if (_stateCharacteristic != null) {
      await _stateCharacteristic!.write([0]);
      debugPrint('dismissAlarm: wrote 0');
    }
  }

  void disconnect() {
    _device?.disconnect();
  }

  void dispose() {
    _scanResultsSubscription?.cancel();
    _stateController.close();
    _connectionController.close();
    _motionController.close();
    _rotationController.close();
    _scanResultsController.close();
  }
}
