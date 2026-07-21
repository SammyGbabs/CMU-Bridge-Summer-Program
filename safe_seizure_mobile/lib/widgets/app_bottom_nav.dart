import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.icons,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<IconData> icons;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(icons.length, (index) {
          final isActive = index == currentIndex;
          return GestureDetector(
            onTap: () => onTap(index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: isActive
                  ? const EdgeInsets.symmetric(horizontal: 20, vertical: 12)
                  : const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isActive ? AppColors.textHeading : Colors.transparent,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(
                icons[index],
                size: 22,
                color: isActive ? Colors.white : AppColors.textSecondary,
              ),
            ),
          );
        }),
      ),
    );
  }
}
