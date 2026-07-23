import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/seizure_event.dart';

class SeizureEventsRepository {
  SupabaseClient get _client => Supabase.instance.client;

  Future<List<SeizureEvent>> fetchRecent({int limit = 100}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final rows = await _client
        .from('seizure_events')
        .select()
        .eq('user_id', userId)
        .order('occurred_at', ascending: false)
        .limit(limit);

    return (rows as List)
        .map((row) => SeizureEvent.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  Future<void> insertEvent({
    required DateTime occurredAt,
    required DateTime resolvedAt,
    required int durationSeconds,
    required SeizureEventStatus status,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    await _client.from('seizure_events').insert({
      'user_id': userId,
      'occurred_at': occurredAt.toUtc().toIso8601String(),
      'resolved_at': resolvedAt.toUtc().toIso8601String(),
      'duration_seconds': durationSeconds,
      'status': status == SeizureEventStatus.confirmed
          ? 'confirmed'
          : 'cancelled',
    });
  }
}
