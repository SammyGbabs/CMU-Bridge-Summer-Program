import 'dart:async';

import 'ble_connection_service.dart';
import 'sensor_readings_repository.dart';

/// Listens to a [BleConnectionService]'s motion/rotation streams and saves
/// every real reading to `sensor_readings`. Motion and rotation notify
/// independently (per the BLE contract), so each arrival is written as its
/// own row rather than waiting to pair them up.
class SensorReadingRecorder {
  SensorReadingRecorder(
    BleConnectionService bleService, {
    SensorReadingsRepository? repository,
  }) : _repository = repository ?? SensorReadingsRepository() {
    _motionSubscription = bleService.motionIntensityStream.listen((value) {
      _repository.insertReading(motionIntensity: value);
    });
    _rotationSubscription = bleService.rotationActivityStream.listen((value) {
      _repository.insertReading(rotationActivity: value);
    });
  }

  final SensorReadingsRepository _repository;
  late final StreamSubscription<double> _motionSubscription;
  late final StreamSubscription<double> _rotationSubscription;

  void dispose() {
    _motionSubscription.cancel();
    _rotationSubscription.cancel();
  }
}
