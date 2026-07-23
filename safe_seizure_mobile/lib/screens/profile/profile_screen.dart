import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _notificationsEnabled = true;

  String get _firstName {
    final metadata = Supabase.instance.client.auth.currentUser?.userMetadata;
    final firstName = metadata?['first_name'] as String?;
    return (firstName == null || firstName.isEmpty) ? 'there' : firstName;
  }

  String get _roleLabel {
    final metadata = Supabase.instance.client.auth.currentUser?.userMetadata;
    final role = metadata?['role'] as String?;
    if (role == null || role.isEmpty) return 'Caregiver';
    return role[0].toUpperCase() + role.substring(1);
  }

  Future<void> _logout() async {
    await Supabase.instance.client.auth.signOut();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 110),
          child: Column(
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: const BoxDecoration(
                  color: AppColors.surfaceCard,
                  shape: BoxShape.circle,
                  border: Border.fromBorderSide(
                    BorderSide(color: AppColors.borderSubtle, width: 2),
                  ),
                ),
                child: const Icon(
                  Icons.person_outline_rounded,
                  color: AppColors.textSecondary,
                  size: 44,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.accentPrimary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _roleLabel.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _firstName,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textHeading,
                ),
              ),
              const SizedBox(height: 24),
              _SettingsGroup(
                children: [
                  _SettingsRow(label: 'Personal information', onTap: () {}),
                  _SettingsRow(label: 'Medical information', onTap: () {}),
                  _SettingsRow(label: 'Emergency contact', onTap: () {}),
                  _SettingsRow(
                    label: 'Notifications',
                    trailing: Switch(
                      value: _notificationsEnabled,
                      activeTrackColor: AppColors.accentPrimary,
                      onChanged: (value) =>
                          setState(() => _notificationsEnabled = value),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _SettingsGroup(
                children: [
                  _SettingsRow(label: 'About SafeSeizure', onTap: () {}),
                  _SettingsRow(label: 'Privacy Policy', onTap: () {}),
                  _SettingsRow(label: 'Terms & Conditions', onTap: () {}),
                  const _SettingsRow(
                    label: 'App version',
                    trailing: Text(
                      'v1.0',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _SettingsGroup(
                children: [
                  _SettingsRow(
                    label: 'Logout',
                    centered: true,
                    leadingIcon: Icons.logout_rounded,
                    onTap: _logout,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1)
              const Divider(color: AppColors.borderSubtle, height: 1),
          ],
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.label,
    this.trailing,
    this.leadingIcon,
    this.centered = false,
    this.onTap,
  });

  final String label;
  final Widget? trailing;
  final IconData? leadingIcon;
  final bool centered;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          mainAxisAlignment: centered
              ? MainAxisAlignment.center
              : MainAxisAlignment.spaceBetween,
          children: [
            if (leadingIcon != null) ...[
              Icon(leadingIcon, size: 18, color: AppColors.textHeading),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textHeading,
              ),
            ),
            if (!centered)
              trailing ??
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.textSecondary,
                  ),
          ],
        ),
      ),
    );
  }
}
