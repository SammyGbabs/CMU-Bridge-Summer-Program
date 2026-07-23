enum SeizureEventStatus { confirmed, cancelled }

class SeizureEvent {
  const SeizureEvent({
    required this.id,
    required this.occurredAt,
    required this.status,
    this.resolvedAt,
    this.durationSeconds,
  });

  final String id;
  final DateTime occurredAt;
  final DateTime? resolvedAt;
  final int? durationSeconds;
  final SeizureEventStatus status;

  factory SeizureEvent.fromJson(Map<String, dynamic> json) {
    return SeizureEvent(
      id: json['id'] as String,
      occurredAt: DateTime.parse(json['occurred_at'] as String).toLocal(),
      resolvedAt: json['resolved_at'] == null
          ? null
          : DateTime.parse(json['resolved_at'] as String).toLocal(),
      durationSeconds: json['duration_seconds'] as int?,
      status: (json['status'] as String) == 'confirmed'
          ? SeizureEventStatus.confirmed
          : SeizureEventStatus.cancelled,
    );
  }
}
