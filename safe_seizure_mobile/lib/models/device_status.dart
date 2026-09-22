import '../services/ble_connection_service.dart';

class DeviceStatus {
  const DeviceStatus({
    required this.state,
    required this.updatedAt,
    required this.dismissRequested,
  });

  final SeizureState state;
  final DateTime updatedAt;
  final bool dismissRequested;

  factory DeviceStatus.fromJson(Map<String, dynamic> json) {
    return DeviceStatus(
      state: _stateFromString(json['state'] as String?),
      updatedAt: DateTime.parse(json['updated_at'] as String).toLocal(),
      dismissRequested: json['dismiss_requested'] as bool? ?? false,
    );
  }

  static SeizureState _stateFromString(String? value) {
    switch (value) {
      case 'suspected':
        return SeizureState.suspected;
      case 'alarm':
        return SeizureState.alarm;
      default:
        return SeizureState.normal;
    }
  }
}

String seizureStateToDbValue(SeizureState state) {
  switch (state) {
    case SeizureState.normal:
      return 'normal';
    case SeizureState.suspected:
      return 'suspected';
    case SeizureState.alarm:
      return 'alarm';
  }
}
