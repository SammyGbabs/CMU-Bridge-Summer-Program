import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/sensor_reading.dart';

class SensorReadingsRepository {
  SupabaseClient get _client => Supabase.instance.client;

  /// Readings from the start of today onward, for the Home screen trend
  /// charts. Returns an empty list until the wearable firmware exposes
  /// motion/rotation telemetry and the app starts writing to this table —
  /// there is no mock/demo data here.
  Future<List<SensorReading>> fetchToday() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final startOfDay = DateTime.now().toUtc();
    final since = DateTime.utc(
      startOfDay.year,
      startOfDay.month,
      startOfDay.day,
    );

    final rows = await _client
        .from('sensor_readings')
        .select()
        .eq('user_id', userId)
        .gte('recorded_at', since.toIso8601String())
        .order('recorded_at');

    return (rows as List)
        .map((row) => SensorReading.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  /// Records one telemetry sample from the wearable. Pass whichever value
  /// just arrived — the other stays null on that row, since motion and
  /// rotation notify independently per the BLE contract.
  Future<void> insertReading({
    double? motionIntensity,
    double? rotationActivity,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    await _client.from('sensor_readings').insert({
      'user_id': userId,
      'motion_intensity': motionIntensity,
      'rotation_activity': rotationActivity,
    });
  }
}
