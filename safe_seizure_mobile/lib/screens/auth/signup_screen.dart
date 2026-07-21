import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../widgets/app_back_button.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../root/root_screen.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _createAccount() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const RootScreen()),
      (route) => false,
    );
  }

  void _goToLogin() {
    Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),
                      AppBackButton(
                        onTap: () => Navigator.of(context).maybePop(),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Create Account',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textHeading,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Set up your profile to unlock real-time monitoring, '
                        'personalized alerts, and around-the-clock support.',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 32),
                      AppTextField(
                        label: 'First Name',
                        controller: _firstNameController,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Last Name',
                        controller: _lastNameController,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Email',
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Create Password',
                        controller: _passwordController,
                        obscureText: true,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Confirm Password',
                        controller: _confirmPasswordController,
                        obscureText: true,
                      ),
                      const SizedBox(height: 24),
                      AppButton(
                        label: 'Create Account',
                        onPressed: _createAccount,
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: const [
                          Expanded(
                            child: Divider(color: AppColors.borderSubtle),
                          ),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              'OR',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          Expanded(
                            child: Divider(color: AppColors.borderSubtle),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      AppButton(
                        label: 'Have an account? Login',
                        onPressed: _goToLogin,
                        variant: AppButtonVariant.secondary,
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 0, 28, 24),
                child: Column(
                  children: const [
                    Divider(color: AppColors.borderSubtle, height: 1),
                    SizedBox(height: 16),
                    Text(
                      'Read our Privacy Policy and Terms & Conditions',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
