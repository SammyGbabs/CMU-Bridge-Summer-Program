import 'dart:async';

import '../models/seizure_event.dart';
import 'ble_connection_service.dart';
import 'seizure_events_repository.dart';

/// Listens to a [BleConnectionService]'s state stream and turns each
/// suspected/alarm episode into a real row in `seizure_events` once it
/// resolves back to normal — confirmed if it ever reached alarm, cancelled
/// if it was dismissed while still only suspected.
class SeizureEventRecorder {
  SeizureEventRecorder(this._bleService, {SeizureEventsRepository? repository})
      : _repository = repository ?? SeizureEventsRepository() {
    _subscription = _bleService.stateStream.listen(_handleStateChange);
  }

  final BleConnectionService _bleService;
  final SeizureEventsRepository _repository;
  late final StreamSubscription<SeizureState> _subscription;

  DateTime? _episodeStart;
  bool _episodeReachedAlarm = false;

  void _handleStateChange(SeizureState state) {
    switch (state) {
      case SeizureState.suspected:
        _episodeStart ??= DateTime.now();
      case SeizureState.alarm:
        _episodeStart ??= DateTime.now();
        _episodeReachedAlarm = true;
      case SeizureState.normal:
        _resolveEpisodeIfAny();
    }
  }

  void _resolveEpisodeIfAny() {
    final start = _episodeStart;
    if (start == null) return;

    final now = DateTime.now();
    final status = _episodeReachedAlarm
        ? SeizureEventStatus.confirmed
        : SeizureEventStatus.cancelled;

    _repository.insertEvent(
      occurredAt: start,
      resolvedAt: now,
      durationSeconds: now.difference(start).inSeconds,
      status: status,
    );

    _episodeStart = null;
    _episodeReachedAlarm = false;
  }

  void dispose() {
    _subscription.cancel();
  }
}
