import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../widgets/app_button.dart';

const _deviceName = 'SafeSeizure Band · A21F';

enum _PairStage { idle, scanning, discovered, connecting, connected }

class DeviceScreen extends StatefulWidget {
  const DeviceScreen({super.key});

  @override
  State<DeviceScreen> createState() => _DeviceScreenState();
}

class _DeviceScreenState extends State<DeviceScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  _PairStage _stage = _PairStage.idle;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _startScan() async {
    setState(() => _stage = _PairStage.scanning);
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    setState(() => _stage = _PairStage.discovered);
  }

  Future<void> _connect() async {
    setState(() => _stage = _PairStage.connecting);
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;
    setState(() => _stage = _PairStage.connected);
  }

  void _unpair() {
    setState(() => _stage = _PairStage.idle);
  }

  @override
  Widget build(BuildContext context) {
    final isConnected = _stage == _PairStage.connected;

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
      child: SafeArea(
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pair your SafeSeizure device',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textHeading,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Scan for your wearable to start monitoring.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Center(
                child: isConnected
                    ? const _ConnectedBadge()
                    : _PulsingRings(
                        controller: _pulseController,
                        child: Image.asset('assets/device.png', width: 180),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
              child: _BottomAction(
                stage: _stage,
                onScan: _startScan,
                onConnect: _connect,
                onUnpair: _unpair,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({
    required this.stage,
    required this.onScan,
    required this.onConnect,
    required this.onUnpair,
  });

  final _PairStage stage;
  final VoidCallback onScan;
  final VoidCallback onConnect;
  final VoidCallback onUnpair;

  @override
  Widget build(BuildContext context) {
    switch (stage) {
      case _PairStage.idle:
        return AppButton(label: 'Scan for Devices', onPressed: onScan);
      case _PairStage.scanning:
        return const _BusyButton(label: 'Scanning…');
      case _PairStage.discovered:
        return _DeviceRow(
          subtitle: 'Nearby · Tap to connect',
          trailing: const Icon(
            Icons.chevron_right_rounded,
            color: AppColors.textSecondary,
          ),
          onTap: onConnect,
        );
      case _PairStage.connecting:
        return const _DeviceRow(
          subtitle: 'Connecting…',
          trailing: SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.accentPrimary,
            ),
          ),
        );
      case _PairStage.connected:
        return Column(
          children: [
            Container(
              width: double.infinity,
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
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: AppColors.statusGreen,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.watch_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _deviceName,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textHeading,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Connected',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.statusGreen,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppButton(
              label: 'Unpair Device',
              onPressed: onUnpair,
              variant: AppButtonVariant.secondary,
            ),
          ],
        );
    }
  }
}

class _DeviceRow extends StatelessWidget {
  const _DeviceRow({
    required this.subtitle,
    required this.trailing,
    this.onTap,
  });

  final String subtitle;
  final Widget trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
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
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: AppColors.accentPrimary,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.bluetooth_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    _deviceName,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textHeading,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            trailing,
          ],
        ),
      ),
    );
  }
}

class _BusyButton extends StatelessWidget {
  const _BusyButton({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.accentPrimary.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class _ConnectedBadge extends StatelessWidget {
  const _ConnectedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 96,
      height: 96,
      decoration: const BoxDecoration(
        color: AppColors.statusGreen,
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.check_rounded, color: Colors.white, size: 48),
    );
  }
}

class _PulsingRings extends StatelessWidget {
  const _PulsingRings({required this.controller, required this.child});

  final AnimationController controller;
  final Widget child;

  static const _ringSize = 220.0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _ringSize,
      height: _ringSize,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _ring(0),
          _ring(0.5),
          child,
        ],
      ),
    );
  }

  Widget _ring(double phase) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final t = (controller.value + phase) % 1.0;
        final scale = 0.55 + t * 0.75;
        final opacity = (1.0 - t) * 0.35;
        return Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: scale,
            child: Container(
              width: _ringSize,
              height: _ringSize,
              decoration: const BoxDecoration(
                color: AppColors.accentPrimary,
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      },
    );
  }
}
