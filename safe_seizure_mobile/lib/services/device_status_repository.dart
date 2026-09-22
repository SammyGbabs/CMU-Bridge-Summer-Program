import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/device_status.dart';
import 'ble_connection_service.dart';

/// Publishes/watches a patient's live seizure state in Supabase, so a linked
/// caregiver's phone — which has no direct Bluetooth link to the wearable —
/// can see it and request a dismiss in real time while the app is open.
class DeviceStatusRepository {
  SupabaseClient get _client => Supabase.instance.client;

  /// Called by the wearer's own phone whenever its BLE state changes.
  Future<void> publishStatus(String userId, SeizureState state) async {
    try {
      await _client.from('device_status').upsert({
        'user_id': userId,
        'state': seizureStateToDbValue(state),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      });
      debugPrint('DeviceStatus: published $state for $userId');
    } catch (e) {
      debugPrint('DeviceStatus: failed to publish $state for $userId: $e');
    }
  }

  /// Live status for [patientUserId] — used by a linked caregiver (or the
  /// wearer's own phone, to watch for dismiss requests) to react in real
  /// time while connected, without needing a manual refresh.
  Stream<DeviceStatus?> watchStatus(String patientUserId) {
    return _client
        .from('device_status')
        .stream(primaryKey: ['user_id'])
        .eq('user_id', patientUserId)
        .map((rows) {
          if (rows.isEmpty) {
            debugPrint('DeviceStatus: watch($patientUserId) — no row yet');
            return null;
          }
          final status = DeviceStatus.fromJson(rows.first);
          debugPrint(
            'DeviceStatus: watch($patientUserId) -> state=${status.state} '
            'dismissRequested=${status.dismissRequested}',
          );
          return status;
        });
  }

  /// A linked caregiver asks the wearer's phone to send the actual BLE
  /// dismiss on their behalf, since only the phone with the live Bluetooth
  /// connection can do that.
  Future<void> requestDismiss(String patientUserId) async {
    try {
      await _client
          .from('device_status')
          .update({
            'dismiss_requested': true,
            'dismiss_requested_at': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('user_id', patientUserId);
      debugPrint('DeviceStatus: requested dismiss for $patientUserId');
    } catch (e) {
      debugPrint(
        'DeviceStatus: failed to request dismiss for $patientUserId: $e',
      );
    }
  }

  /// The wearer's phone calls this after it's honored a remote dismiss
  /// request, to reset the flag.
  Future<void> clearDismissRequest(String userId) async {
    try {
      await _client
          .from('device_status')
          .update({'dismiss_requested': false})
          .eq('user_id', userId);
      debugPrint('DeviceStatus: cleared dismiss request for $userId');
    } catch (e) {
      debugPrint(
        'DeviceStatus: failed to clear dismiss request for $userId: $e',
      );
    }
  }
}
