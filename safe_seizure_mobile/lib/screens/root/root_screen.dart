import 'package:flutter/material.dart';

import '../../widgets/app_bottom_nav.dart';
import '../alerts/alerts_screen.dart';
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

const _tabs = [
  HomeScreen(),
  DiaryScreen(),
  AlertsScreen(),
  DeviceScreen(),
  ProfileScreen(),
];

class RootScreen extends StatefulWidget {
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  int _navIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _navIndex, children: _tabs),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _navIndex,
        icons: _navIcons,
        onTap: (index) => setState(() => _navIndex = index),
      ),
    );
  }
}
