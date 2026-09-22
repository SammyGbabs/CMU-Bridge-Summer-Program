import 'package:flutter/material.dart';

import '../../models/caregiver_link.dart';
import '../../services/caregiver_links_repository.dart';
import '../../theme/app_colors.dart';
import '../../widgets/app_back_button.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class EmergencyContactScreen extends StatefulWidget {
  const EmergencyContactScreen({super.key});

  @override
  State<EmergencyContactScreen> createState() =>
      _EmergencyContactScreenState();
}

class _EmergencyContactScreenState extends State<EmergencyContactScreen> {
  final _repository = CaregiverLinksRepository();
  final _emailController = TextEditingController();

  bool _isLoading = true;
  bool _isSubmitting = false;
  List<CaregiverLink> _links = const [];

  @override
  void initState() {
    super.initState();
    _loadLinks();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _loadLinks() async {
    setState(() => _isLoading = true);
    List<CaregiverLink> links = const [];
    try {
      links = await _repository.fetchMyLinks();
    } catch (e) {
      debugPrint('Failed to load caregiver links: $e');
    }
    if (!mounted) return;
    setState(() {
      _links = links;
      _isLoading = false;
    });
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _addCaregiver() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      _showMessage('Enter a valid email address.');
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _repository.addCaregiver(email);
      _emailController.clear();
      await _loadLinks();
    } catch (e) {
      _showMessage('Could not add caregiver — they may already be added.');
      debugPrint('Failed to add caregiver: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _removeCaregiver(CaregiverLink link) async {
    try {
      await _repository.removeCaregiver(link.id);
      await _loadLinks();
    } catch (e) {
      _showMessage('Could not remove caregiver.');
      debugPrint('Failed to remove caregiver: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                AppBackButton(onTap: () => Navigator.of(context).maybePop()),
                const SizedBox(height: 24),
                const Text(
                  'Emergency Contact',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textHeading,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  "Add a caregiver's email so they can see your monitoring "
                  'data and get alerted if a seizure is detected.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                AppTextField(
                  label: 'Caregiver Email',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                AppButton(
                  label: 'Add Caregiver',
                  onPressed: _addCaregiver,
                  isLoading: _isSubmitting,
                ),
                const SizedBox(height: 28),
                const Text(
                  'Linked Caregivers',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textHeading,
                  ),
                ),
                const SizedBox(height: 12),
                if (_isLoading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (_links.isEmpty)
                  const Text(
                    'No caregivers added yet.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  )
                else
                  Container(
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
                        for (var i = 0; i < _links.length; i++) ...[
                          _CaregiverRow(
                            link: _links[i],
                            onRemove: () => _removeCaregiver(_links[i]),
                          ),
                          if (i != _links.length - 1)
                            const Divider(
                              color: AppColors.borderSubtle,
                              height: 1,
                            ),
                        ],
                      ],
                    ),
                  ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CaregiverRow extends StatelessWidget {
  const _CaregiverRow({required this.link, required this.onRemove});

  final CaregiverLink link;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: AppColors.accentPrimary,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              link.caregiverEmail,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textHeading,
              ),
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(
              Icons.close_rounded,
              color: AppColors.textSecondary,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}
