import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:vibration/vibration.dart';
import 'package:vibration/vibration_presets.dart';

import '../../services/ble_connection_service.dart';
import '../../services/seizure_event_recorder.dart';
import '../../services/sensor_reading_recorder.dart';
import '../../widgets/app_bottom_nav.dart';
import '../alerts/alarm_alert_screen.dart';
import '../alerts/alerts_screen.dart';
import '../alerts/suspected_alert_screen.dart';
import '../device/device_screen.dart';
import '../diary/diary_screen.dart';
import '../home/home_screen.dart';
import '../profile/profile_screen.dart';

const _navIcons = [
  Icons.home_rounded,
  Icons.calendar_today_outlined,
  Icons.notifications_none_rounded,
  Icons.monitor_heart_outlined,
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
  late final StreamSubscription<SeizureState> _stateSubscription;
  Timer? _countdownTimer;
  Timer? _alarmAlertTimer;

  SeizureState _seizureState = SeizureState.normal;
  int _secondsRemaining = _suspectedWindowSeconds;
  DateTime? _detectedAt;

  @override
  void initState() {
    super.initState();
    _bleService = BleConnectionService();
    _eventRecorder = SeizureEventRecorder(_bleService);
    _sensorRecorder = SensorReadingRecorder(_bleService);
    _stateSubscription = _bleService.stateStream.listen(_handleStateChange);
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _alarmAlertTimer?.cancel();
    _stateSubscription.cancel();
    _eventRecorder.dispose();
    _sensorRecorder.dispose();
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
        // Vibrate only — the contract explicitly says not to sound the
        // full alarm yet while still just "suspected".
        Vibration.vibrate(preset: VibrationPreset.doubleBuzz);
      case SeizureState.alarm:
        _detectedAt ??= DateTime.now();
        _countdownTimer?.cancel();
        _startAlarmAlert();
      case SeizureState.normal:
        _countdownTimer?.cancel();
        _alarmAlertTimer?.cancel();
        Vibration.cancel();
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
    _triggerAlarmAlert();
    _alarmAlertTimer = Timer.periodic(const Duration(milliseconds: 1500), (_) {
      _triggerAlarmAlert();
    });
  }

  void _triggerAlarmAlert() {
    Vibration.vibrate(preset: VibrationPreset.emergencyAlert);
    SystemSound.play(SystemSoundType.alert);
  }

  void _acknowledgeAlarm() {
    _bleService.dismissAlarm();
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
    final role =
        Supabase.instance.client.auth.currentUser?.userMetadata?['role']
            as String?;
    final isCaregiver = role == 'caregiver';

    Widget? overlay;
    if (_seizureState == SeizureState.suspected && !isCaregiver) {
      overlay = SuspectedAlertScreen(
        secondsRemaining: _secondsRemaining.clamp(0, _suspectedWindowSeconds),
        totalSeconds: _suspectedWindowSeconds,
      );
    } else if (_seizureState == SeizureState.alarm && isCaregiver) {
      overlay = AlarmAlertScreen(
        detectedAt: _detectedAt ?? DateTime.now(),
        onAcknowledge: _acknowledgeAlarm,
        onCallEmergencyContact: _callEmergencyContact,
      );
    }

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          IndexedStack(
            index: _navIndex,
            children: [
              HomeScreen(bleService: _bleService),
              const DiaryScreen(),
              AlertsScreen(bleService: _bleService),
              DeviceScreen(bleService: _bleService),
              const ProfileScreen(),
            ],
          ),
          if (overlay != null) Positioned.fill(child: overlay),
        ],
      ),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _navIndex,
        icons: _navIcons,
        onTap: (index) => setState(() => _navIndex = index),
      ),
    );
  }
}
