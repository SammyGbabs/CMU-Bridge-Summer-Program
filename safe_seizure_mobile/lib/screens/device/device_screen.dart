import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

class DeviceScreen extends StatelessWidget {
  const DeviceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
      child: const SafeArea(
        child: Center(
          child: Text(
            'Device',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.textHeading,
            ),
          ),
        ),
      ),
    );
  }
}
