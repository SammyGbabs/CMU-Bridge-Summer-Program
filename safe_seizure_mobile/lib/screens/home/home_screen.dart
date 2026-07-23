import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../models/sensor_reading.dart';
import '../../services/ble_connection_service.dart';
import '../../services/sensor_readings_repository.dart';
import '../../theme/app_colors.dart';
import '../../widgets/trend_stat_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.bleService});

  final BleConnectionService bleService;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _maxLivePoints = 30;

  final _sensorReadingsRepository = SensorReadingsRepository();
  late final StreamSubscription<SeizureState> _stateSubscription;
  late final StreamSubscription<bool> _connectionSubscription;
  late final StreamSubscription<double> _motionSubscription;
  late final StreamSubscription<double> _rotationSubscription;

  SeizureState _seizureState = SeizureState.normal;
  bool _isConnected = false;
  List<SensorReading> _motionReadings = const [];
  List<SensorReading> _rotationReadings = const [];
  bool _loadingReadings = true;

  String get _roleLabel {
    final role =
        Supabase.instance.client.auth.currentUser?.userMetadata?['role']
            as String?;
    if (role == null || role.isEmpty) return 'Caregiver';
    return role[0].toUpperCase() + role.substring(1);
  }

  @override
  void initState() {
    super.initState();
    _seizureState = widget.bleService.lastState;
    _isConnected = widget.bleService.isConnected;
    _stateSubscription = widget.bleService.stateStream.listen((state) {
      if (!mounted) return;
      setState(() => _seizureState = state);
    });
    _connectionSubscription = widget.bleService.connectionStream.listen((
      connected,
    ) {
      if (!mounted) return;
      setState(() => _isConnected = connected);
    });
    _motionSubscription = widget.bleService.motionIntensityStream.listen((
      value,
    ) {
      if (!mounted) return;
      setState(() {
        _loadingReadings = false;
        _motionReadings = _appendCapped(
          _motionReadings,
          SensorReading(recordedAt: DateTime.now(), motionIntensity: value),
        );
      });
    });
    _rotationSubscription = widget.bleService.rotationActivityStream.listen((
      value,
    ) {
      if (!mounted) return;
      setState(() {
        _loadingReadings = false;
        _rotationReadings = _appendCapped(
          _rotationReadings,
          SensorReading(recordedAt: DateTime.now(), rotationActivity: value),
        );
      });
    });
    _loadReadings();
  }

  List<SensorReading> _appendCapped(
    List<SensorReading> readings,
    SensorReading newReading,
  ) {
    final updated = [...readings, newReading];
    if (updated.length <= _maxLivePoints) return updated;
    return updated.sublist(updated.length - _maxLivePoints);
  }

  @override
  void dispose() {
    _stateSubscription.cancel();
    _connectionSubscription.cancel();
    _motionSubscription.cancel();
    _rotationSubscription.cancel();
    super.dispose();
  }

  Future<void> _loadReadings() async {
    final readings = await _sensorReadingsRepository.fetchToday();
    if (!mounted) return;
    setState(() {
      _motionReadings = readings
          .where((r) => r.motionIntensity != null)
          .toList();
      _rotationReadings = readings
          .where((r) => r.rotationActivity != null)
          .toList();
      _loadingReadings = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      color: AppColors.surfaceCard,
                      shape: BoxShape.circle,
                      border: Border.fromBorderSide(
                        BorderSide(color: AppColors.borderSubtle),
                      ),
                    ),
                    child: const Icon(
                      Icons.person_outline_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Text(
                              'Welcome',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textHeading,
                              ),
                            ),
                            SizedBox(width: 6),
                            Text('👋', style: TextStyle(fontSize: 20)),
                          ],
                        ),
                        Text(
                          _roleLabel,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _IconCircleButton(icon: Icons.search_rounded, onTap: () {}),
                  const SizedBox(width: 10),
                  _IconCircleButton(
                    icon: Icons.notifications_none_rounded,
                    onTap: () {},
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
                child: Column(
                  children: [
                    _StatusBanner(
                      state: _seizureState,
                      isConnected: _isConnected,
                    ),
                    const SizedBox(height: 20),
                    _buildTrendCard(
                      title: 'Motion Intensity',
                      description:
                          'Tracks the wearable\'s accelerometer signal '
                          'throughout the day to flag unusual movement.',
                      emptyMessage:
                          'No motion data yet — connect your device '
                          'to start monitoring.',
                      values: _motionReadings
                          .map((r) => r.motionIntensity!)
                          .toList(),
                    ),
                    const SizedBox(height: 20),
                    _buildTrendCard(
                      title: 'Rotation Activity',
                      description:
                          'Measures gyroscope rotation patterns that may '
                          'indicate abnormal motor activity.',
                      emptyMessage:
                          'No rotation data yet — connect your device '
                          'to start monitoring.',
                      values: _rotationReadings
                          .map((r) => r.rotationActivity!)
                          .toList(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrendCard({
    required String title,
    required String description,
    required String emptyMessage,
    required List<double> values,
  }) {
    if (_loadingReadings) return const SizedBox.shrink();
    if (values.length < 2) {
      return _EmptyTrendCard(title: title, message: emptyMessage);
    }

    var peakIndex = 0;
    for (var i = 1; i < values.length; i++) {
      if (values[i] > values[peakIndex]) peakIndex = i;
    }

    return TrendStatCard(
      title: title,
      description: description,
      data: values,
      peakIndex: peakIndex,
      peakValue: values[peakIndex].round().toString(),
      color: AppColors.accentPrimary,
    );
  }
}

class _IconCircleButton extends StatelessWidget {
  const _IconCircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(
          color: AppColors.surfaceCard,
          shape: BoxShape.circle,
          border: Border.fromBorderSide(
            BorderSide(color: AppColors.borderSubtle),
          ),
        ),
        child: Icon(icon, color: AppColors.textHeading, size: 20),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({required this.state, required this.isConnected});

  final SeizureState state;
  final bool isConnected;

  @override
  Widget build(BuildContext context) {
    final Color color;
    final IconData icon;
    final String title;
    final String message;
    final bool isNeutral;

    if (!isConnected) {
      color = AppColors.textSecondary;
      icon = Icons.bluetooth_disabled_rounded;
      title = 'No Data Yet';
      message = 'Connect your device on the Device tab to start monitoring.';
      isNeutral = true;
    } else {
      isNeutral = false;
      switch (state) {
        case SeizureState.normal:
          color = AppColors.statusGreen;
          icon = Icons.fact_check_outlined;
          title = 'Stable';
          message =
              'Your motion intensity and rotation activity levels are normal.';
        case SeizureState.suspected:
          color = AppColors.statusAmber;
          icon = Icons.warning_amber_rounded;
          title = 'Possible Seizure';
          message =
              'A possible seizure was detected — checking for a cancel.';
        case SeizureState.alarm:
          color = AppColors.statusRed;
          icon = Icons.error_outline_rounded;
          title = 'Seizure Alert';
          message = 'A seizure has been detected and not cancelled.';
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isNeutral ? AppColors.borderSubtle : color,
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isNeutral ? AppColors.textSecondary : Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textHeading,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyTrendCard extends StatelessWidget {
  const _EmptyTrendCard({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.textHeading,
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: AppColors.borderSubtle,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.show_chart_rounded,
                    color: AppColors.textSecondary,
                    size: 20,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
