import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vibration/vibration.dart';
import 'package:vibration/vibration_presets.dart';

import '../../models/device_status.dart';
import '../../services/ble_connection_service.dart';
import '../../services/caregiver_links_repository.dart';
import '../../services/device_status_repository.dart';
import '../../services/seizure_event_recorder.dart';
import '../../services/sensor_reading_recorder.dart';
import '../../theme/app_colors.dart';
import '../../widgets/app_bottom_nav.dart';
import '../alerts/alarm_alert_screen.dart';
import '../alerts/alerts_screen.dart';
import '../alerts/suspected_alert_screen.dart';
import '../device/device_screen.dart';
import '../diary/diary_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';

const _navIconsWearer = [
  Icons.home_rounded,
  Icons.calendar_today_outlined,
  Icons.notifications_none_rounded,
  Icons.monitor_heart_outlined,
  Icons.person_outline_rounded,
];

const _navIconsCaregiver = [
  Icons.home_rounded,
  Icons.calendar_today_outlined,
  Icons.notifications_none_rounded,
  Icons.person_outline_rounded,
];

// The device resolves suspected -> normal/alarm on its own within ~6s of
// double-tap detection; the phone doesn't run an authoritative timer, this
// is only an approximate visual countdown for the wearer.
const _suspectedWindowSeconds = 6;

class RootScreen extends StatefulWidget {
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  int _navIndex = 0;

  late final BleConnectionService _bleService;
  late final SeizureEventRecorder _eventRecorder;
  late final SensorReadingRecorder _sensorRecorder;
  final _deviceStatusRepository = DeviceStatusRepository();
  final _caregiverLinksRepository = CaregiverLinksRepository();
  final _audioPlayer = AudioPlayer();

  StreamSubscription<SeizureState>? _localStateSubscription;
  StreamSubscription<DeviceStatus?>? _remoteStatusSubscription;
  Timer? _countdownTimer;
  Timer? _alarmAlertTimer;

  bool _resolvingRole = true;
  bool _isCaregiver = false;
  String? _effectiveUserId;
  String? _patientFirstName;

  SeizureState _seizureState = SeizureState.normal;
  int _secondsRemaining = _suspectedWindowSeconds;
  DateTime? _detectedAt;

  @override
  void initState() {
    super.initState();
    _bleService = BleConnectionService();
    _eventRecorder = SeizureEventRecorder(_bleService);
    _sensorRecorder = SensorReadingRecorder(_bleService);
    _initRoleAndStatusSource();
  }

  Future<void> _initRoleAndStatusSource() async {
    final auth = Supabase.instance.client.auth;
    final role = auth.currentUser?.userMetadata?['role'] as String?;
    final ownId = auth.currentUser?.id;
    _isCaregiver = role == 'caregiver';

    if (_isCaregiver) {
      final patientId = await _caregiverLinksRepository
          .resolveLinkedPatientId();
      _effectiveUserId = patientId;
      debugPrint('RootScreen: caregiver linked to patient=$patientId');
      if (patientId != null) {
        _patientFirstName = await _caregiverLinksRepository
            .fetchPatientFirstName(patientId);
        _remoteStatusSubscription = _deviceStatusRepository
            .watchStatus(patientId)
            .listen(
              (status) {
                if (status == null) return;
                _handleStateChange(status.state);
              },
              onError: (e) =>
                  debugPrint('RootScreen: patient status stream error: $e'),
            );
      }
    } else {
      _effectiveUserId = ownId;
      _localStateSubscription = _bleService.stateStream.listen((state) {
        _handleStateChange(state);
        if (ownId != null) {
          _deviceStatusRepository.publishStatus(ownId, state);
        }
      });
      if (ownId != null) {
        // Watch our own live-status row so a linked caregiver can remotely
        // request a dismiss — only this phone has the real BLE link needed
        // to actually clear the alarm on the device.
        _remoteStatusSubscription = _deviceStatusRepository
            .watchStatus(ownId)
            .listen(
              (status) {
                if (status == null || !status.dismissRequested) return;
                debugPrint(
                  'RootScreen: relaying remote dismiss request to BLE',
                );
                _bleService.dismissAlarm();
                _deviceStatusRepository.clearDismissRequest(ownId);
              },
              onError: (e) =>
                  debugPrint('RootScreen: own status stream error: $e'),
            );
      }
    }

    if (!mounted) return;
    setState(() => _resolvingRole = false);
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _alarmAlertTimer?.cancel();
    _localStateSubscription?.cancel();
    _remoteStatusSubscription?.cancel();
    _eventRecorder.dispose();
    _sensorRecorder.dispose();
    _audioPlayer.dispose();
    _bleService.disconnect();
    _bleService.dispose();
    super.dispose();
  }

  void _handleStateChange(SeizureState state) {
    if (!mounted) return;
    setState(() => _seizureState = state);

    switch (state) {
      case SeizureState.suspected:
        _detectedAt ??= DateTime.now();
        _startCountdown();
        _alarmAlertTimer?.cancel();
        _playSuspectedSound();
        Vibration.vibrate(preset: VibrationPreset.doubleBuzz);
      case SeizureState.alarm:
        _detectedAt ??= DateTime.now();
        _countdownTimer?.cancel();
        _startAlarmAlert();
      case SeizureState.normal:
        _countdownTimer?.cancel();
        _alarmAlertTimer?.cancel();
        Vibration.cancel();
        _audioPlayer.stop();
        _detectedAt = null;
        _secondsRemaining = _suspectedWindowSeconds;
    }
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _secondsRemaining = _suspectedWindowSeconds;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        if (_secondsRemaining > 0) _secondsRemaining--;
      });
      if (_secondsRemaining <= 0) {
        timer.cancel();
      }
    });
  }

  void _startAlarmAlert() {
    _alarmAlertTimer?.cancel();
    _playAlarmSound();
    Vibration.vibrate(preset: VibrationPreset.emergencyAlert);
    _alarmAlertTimer = Timer.periodic(const Duration(milliseconds: 1800), (_) {
      Vibration.vibrate(preset: VibrationPreset.emergencyAlert);
    });
  }

  Future<void> _playSuspectedSound() async {
    try {
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('alert.mp3'));
    } catch (e) {
      debugPrint('Suspected sound unavailable: $e');
    }
  }

  Future<void> _playAlarmSound() async {
    try {
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.play(AssetSource('emergency.mp3'));
    } catch (e) {
      debugPrint('Alarm sound unavailable: $e');
    }
  }

  void _markFalseAlarm() {
    // Send the real BLE dismiss (only actually honored by firmware during
    // ALARM today, not yet during SUSPECTED). Regardless of whether the
    // wearable itself listens, stop the alert on this phone right away and
    // tell any linked caregiver immediately — don't wait on a BLE round
    // trip that the firmware doesn't yet guarantee will happen.
    _bleService.dismissAlarm();
    _handleStateChange(SeizureState.normal);
    final ownId = Supabase.instance.client.auth.currentUser?.id;
    if (ownId != null) {
      _deviceStatusRepository.publishStatus(ownId, SeizureState.normal);
    }
  }

  void _acknowledgeAlarm() {
    if (_isCaregiver) {
      // Stop the alert on this phone immediately rather than waiting for
      // the wearer's phone to relay a confirmed BLE dismiss back through
      // Realtime — that round trip can lag or fail if the wearer's phone
      // is briefly disconnected.
      _handleStateChange(SeizureState.normal);
      if (_effectiveUserId != null) {
        _deviceStatusRepository.requestDismiss(_effectiveUserId!);
      }
    } else {
      _bleService.dismissAlarm();
    }
  }

  void _callEmergencyContact() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'No emergency contact set up yet — add one in Profile.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_resolvingRole) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.accentPrimary),
        ),
      );
    }

    Widget? overlay;
    if (_seizureState == SeizureState.suspected && !_isCaregiver) {
      overlay = SuspectedAlertScreen(
        secondsRemaining: _secondsRemaining.clamp(0, _suspectedWindowSeconds),
        totalSeconds: _suspectedWindowSeconds,
        onMarkFalseAlarm: _markFalseAlarm,
      );
    } else if (_seizureState == SeizureState.alarm && _isCaregiver) {
      overlay = AlarmAlertScreen(
        detectedAt: _detectedAt ?? DateTime.now(),
        onAcknowledge: _acknowledgeAlarm,
        onCallEmergencyContact: _callEmergencyContact,
      );
    }

    final tabs = [
      HomeScreen(
        bleService: _bleService,
        isCaregiver: _isCaregiver,
        effectiveUserId: _effectiveUserId,
        seizureState: _seizureState,
        patientFirstName: _patientFirstName,
      ),
      DiaryScreen(effectiveUserId: _effectiveUserId),
      AlertsScreen(
        isCaregiver: _isCaregiver,
        effectiveUserId: _effectiveUserId,
        seizureState: _seizureState,
        onAcknowledge: _acknowledgeAlarm,
      ),
      if (!_isCaregiver) DeviceScreen(bleService: _bleService),
      const ProfileScreen(),
    ];

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          IndexedStack(index: _navIndex, children: tabs),
          if (overlay != null) Positioned.fill(child: overlay),
        ],
      ),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _navIndex,
        icons: _isCaregiver ? _navIconsCaregiver : _navIconsWearer,
        onTap: (index) => setState(() => _navIndex = index),
      ),
    );
  }
}
