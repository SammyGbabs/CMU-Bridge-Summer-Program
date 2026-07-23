import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

class AlarmAlertScreen extends StatelessWidget {
  const AlarmAlertScreen({
    super.key,
    required this.detectedAt,
    required this.onAcknowledge,
    required this.onCallEmergencyContact,
  });

  final DateTime detectedAt;
  final VoidCallback onAcknowledge;
  final VoidCallback onCallEmergencyContact;

  @override
  Widget build(BuildContext context) {
    final hour = detectedAt.hour % 12 == 0 ? 12 : detectedAt.hour % 12;
    final minute = detectedAt.minute.toString().padLeft(2, '0');
    final period = detectedAt.hour >= 12 ? 'PM' : 'AM';
    final timeLabel = '$hour:$minute $period';

    return Material(
      child: Container(
        width: double.infinity,
        height: double.infinity,
        color: AppColors.statusRed,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 40, 24, 32),
            child: Column(
              children: [
                const SizedBox(height: 24),
                Container(
                  width: 96,
                  height: 96,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.warning_rounded,
                    color: AppColors.statusRed,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'SEIZURE ALERT',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'The wearer has not cancelled — check on them now.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 14,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Detected at $timeLabel',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
                const Expanded(child: SizedBox()),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onAcknowledge,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.statusRed,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      elevation: 0,
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_rounded, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Acknowledge',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: onCallEmergencyContact,
                  child: const Text(
                    'Call emergency contact',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      decoration: TextDecoration.underline,
                      decorationColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
