import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../widgets/trend_stat_card.dart';

const _motionIntensityData = [
  62.0,
  68.0,
  58.0,
  64.0,
  50.0,
  60.0,
  70.0,
  76.0,
  66.0,
  60.0,
];

const _rotationActivityData = [
  20.0,
  26.0,
  24.0,
  30.0,
  22.0,
  28.0,
  34.0,
  38.0,
  32.0,
  28.0,
];

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

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
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
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
                            'Caregiver',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _IconCircleButton(
                      icon: Icons.search_rounded,
                      onTap: () {},
                    ),
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
                      const _StableStatusBanner(),
                      const SizedBox(height: 20),
                      TrendStatCard(
                        title: 'Motion Intensity',
                        description:
                            'Tracks the wearable\'s accelerometer signal '
                            'throughout the day to flag unusual movement.',
                        data: _motionIntensityData,
                        peakIndex: 7,
                        peakValue: '76',
                        color: AppColors.accentPrimary,
                      ),
                      const SizedBox(height: 20),
                      TrendStatCard(
                        title: 'Rotation Activity',
                        description:
                            'Measures gyroscope rotation patterns that may '
                            'indicate abnormal motor activity.',
                        data: _rotationActivityData,
                        peakIndex: 7,
                        peakValue: '38',
                        color: AppColors.accentPrimary,
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

class _StableStatusBanner extends StatelessWidget {
  const _StableStatusBanner();

  @override
  Widget build(BuildContext context) {
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
            decoration: const BoxDecoration(
              color: AppColors.statusGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.fact_check_outlined,
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
                  'Stable',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textHeading,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Your motion intensity and rotation activity levels '
                  'are normal.',
                  style: TextStyle(
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
