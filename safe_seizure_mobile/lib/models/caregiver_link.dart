class CaregiverLink {
  const CaregiverLink({
    required this.id,
    required this.patientUserId,
    required this.caregiverEmail,
    required this.createdAt,
  });

  final String id;
  final String patientUserId;
  final String caregiverEmail;
  final DateTime createdAt;

  factory CaregiverLink.fromJson(Map<String, dynamic> json) {
    return CaregiverLink(
      id: json['id'] as String,
      patientUserId: json['patient_user_id'] as String,
      caregiverEmail: json['caregiver_email'] as String,
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
    );
  }
}
