import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import '../../services/ble_connection_service.dart';
import '../../theme/app_colors.dart';
import '../../widgets/app_button.dart';

class DeviceScreen extends StatefulWidget {
  const DeviceScreen({super.key, required this.bleService});

  final BleConnectionService bleService;

  @override
  State<DeviceScreen> createState() => _DeviceScreenState();
}

class _DeviceScreenState extends State<DeviceScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final StreamSubscription<bool> _connectionSubscription;
  late final StreamSubscription<List<ScanResult>> _scanResultsSubscription;

  bool _isScanning = false;
  bool _isConnected = false;
  List<ScanResult> _foundDevices = const [];
  String? _connectingRemoteId;
  Timer? _scanTimeoutTimer;

  BleConnectionService get _bleService => widget.bleService;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    _isConnected = _bleService.isConnected;
    _connectionSubscription = _bleService.connectionStream.listen((
      connected,
    ) {
      if (!mounted) return;
      setState(() {
        _isConnected = connected;
        if (connected) {
          _isScanning = false;
          _connectingRemoteId = null;
        }
      });
    });
    _scanResultsSubscription = _bleService.scanResultsStream.listen((
      results,
    ) {
      if (!mounted) return;
      setState(() => _foundDevices = results);
    });
  }

  @override
  void dispose() {
    _scanTimeoutTimer?.cancel();
    _connectionSubscription.cancel();
    _scanResultsSubscription.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startScan() {
    setState(() {
      _isScanning = true;
      _foundDevices = const [];
    });
    _bleService.startScan();

    // The BLE scan itself times out after 10s; give it a little more room,
    // then fall back to idle if nothing was tapped.
    _scanTimeoutTimer?.cancel();
    _scanTimeoutTimer = Timer(const Duration(seconds: 11), () {
      if (!mounted || _isConnected) return;
      setState(() => _isScanning = false);
    });
  }

  Future<void> _connect(BluetoothDevice device) async {
    setState(() => _connectingRemoteId = device.remoteId.str);
    await _bleService.connectToDevice(device);
  }

  void _unpair() {
    _bleService.disconnect();
    setState(() {
      _isConnected = false;
      _isScanning = false;
      _foundDevices = const [];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
      child: SafeArea(
        child: Column(
          children: [
            const _Header(),
            if (_isConnected) ...[
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _ConnectedSection(
                  deviceName:
                      _bleService.connectedDeviceName ?? 'SafeSeizure device',
                  onUnpair: _unpair,
                ),
              ),
              const Expanded(child: SizedBox()),
            ] else ...[
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      const SizedBox(height: 12),
                      _PulsingRings(
                        controller: _pulseController,
                        child: Image.asset('assets/device.png', width: 150),
                      ),
                      const SizedBox(height: 24),
                      if (_foundDevices.isEmpty)
                        Text(
                          _isScanning
                              ? 'Searching for nearby devices…'
                              : 'Tap "Scan for Devices" to find your wearable.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        )
                      else
                        Column(
                          children: [
                            for (final result in _foundDevices) ...[
                              _DeviceRow(
                                name: result.device.platformName.isNotEmpty
                                    ? result.device.platformName
                                    : 'SafeSeizure device',
                                isConnecting:
                                    _connectingRemoteId ==
                                    result.device.remoteId.str,
                                onTap: _connectingRemoteId == null
                                    ? () => _connect(result.device)
                                    : null,
                              ),
                              const SizedBox(height: 12),
                            ],
                          ],
                        ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                child: _isScanning
                    ? const _BusyButton(label: 'Scanning…')
                    : AppButton(
                        label: 'Scan for Devices',
                        onPressed: _startScan,
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pair your SafeSeizure device',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: AppColors.textHeading,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Scan for your wearable to start monitoring.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _DeviceRow extends StatelessWidget {
  const _DeviceRow({
    required this.name,
    required this.isConnecting,
    required this.onTap,
  });

  final String name;
  final bool isConnecting;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceCard,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0F000000),
              blurRadius: 16,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: AppColors.accentPrimary,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.bluetooth_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textHeading,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    isConnecting ? 'Connecting…' : 'Tap to connect',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (isConnecting)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.accentPrimary,
                ),
              )
            else
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }
}

class _ConnectedSection extends StatelessWidget {
  const _ConnectedSection({required this.deviceName, required this.onUnpair});

  final String deviceName;
  final VoidCallback onUnpair;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F000000),
                blurRadius: 16,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: AppColors.statusGreen,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.watch_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      deviceName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textHeading,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Connected',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.statusGreen,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppButton(
          label: 'Unpair Device',
          onPressed: onUnpair,
          variant: AppButtonVariant.secondary,
        ),
      ],
    );
  }
}

class _BusyButton extends StatelessWidget {
  const _BusyButton({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.accentPrimary.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class _PulsingRings extends StatelessWidget {
  const _PulsingRings({required this.controller, required this.child});

  final AnimationController controller;
  final Widget child;

  static const _ringSize = 190.0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _ringSize,
      height: _ringSize,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _ring(0),
          _ring(0.5),
          child,
        ],
      ),
    );
  }

  Widget _ring(double phase) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final t = (controller.value + phase) % 1.0;
        final scale = 0.55 + t * 0.75;
        final opacity = (1.0 - t) * 0.35;
        return Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: scale,
            child: Container(
              width: _ringSize,
              height: _ringSize,
              decoration: const BoxDecoration(
                color: AppColors.accentPrimary,
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      },
    );
  }
}
