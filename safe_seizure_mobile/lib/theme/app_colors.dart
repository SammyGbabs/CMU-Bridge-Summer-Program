import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const accentPrimary = Color(0xFFF2A742);
  static const accentPrimaryDark = Color(0xFFD98C2B);
  static const textHeading = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF8A8A8A);
  static const surfaceCard = Color(0xFFFFFFFF);
  static const borderSubtle = Color(0xFFECECEC);
  static const statusGreen = Color(0xFF3FB56A);
  static const statusAmber = accentPrimary;
  static const statusRed = Color(0xFFE5484D);

  static const backgroundGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFFFFFF), Color(0xFFFDEEE0)],
  );
}
