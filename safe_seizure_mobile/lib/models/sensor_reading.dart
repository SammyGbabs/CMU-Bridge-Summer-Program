class SensorReading {
  const SensorReading({
    required this.recordedAt,
    this.motionIntensity,
    this.rotationActivity,
  });

  final DateTime recordedAt;
  final double? motionIntensity;
  final double? rotationActivity;

  factory SensorReading.fromJson(Map<String, dynamic> json) {
    return SensorReading(
      recordedAt: DateTime.parse(json['recorded_at'] as String).toLocal(),
      motionIntensity: (json['motion_intensity'] as num?)?.toDouble(),
      rotationActivity: (json['rotation_activity'] as num?)?.toDouble(),
    );
  }
}
