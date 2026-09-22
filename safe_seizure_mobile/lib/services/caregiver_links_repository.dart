import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/caregiver_link.dart';

class CaregiverLinksRepository {
  SupabaseClient get _client => Supabase.instance.client;

  /// Caregivers the current (patient) user has linked.
  Future<List<CaregiverLink>> fetchMyLinks() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final rows = await _client
        .from('caregiver_links')
        .select()
        .eq('patient_user_id', userId)
        .order('created_at');

    return (rows as List)
        .map((row) => CaregiverLink.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  Future<void> addCaregiver(String email) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    await _client.from('caregiver_links').insert({
      'patient_user_id': userId,
      'caregiver_email': email.trim().toLowerCase(),
    });
  }

  Future<void> removeCaregiver(String linkId) async {
    await _client.from('caregiver_links').delete().eq('id', linkId);
  }

  /// For a signed-in caregiver: which patient are they linked to? Returns
  /// null if their own email isn't linked to anyone yet.
  Future<String?> resolveLinkedPatientId() async {
    final email = _client.auth.currentUser?.email;
    if (email == null) return null;

    final rows = await _client
        .from('caregiver_links')
        .select()
        .eq('caregiver_email', email.toLowerCase())
        .limit(1);

    final list = rows as List;
    if (list.isEmpty) return null;
    return (list.first as Map<String, dynamic>)['patient_user_id'] as String;
  }

  /// First name of the linked patient, for personalizing a caregiver's UI.
  Future<String?> fetchPatientFirstName(String patientUserId) async {
    final rows = await _client
        .from('profiles')
        .select('first_name')
        .eq('id', patientUserId)
        .limit(1);

    final list = rows as List;
    if (list.isEmpty) return null;
    return (list.first as Map<String, dynamic>)['first_name'] as String?;
  }
}
