import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class PillFilter extends StatelessWidget {
  const PillFilter({
    super.key,
    required this.options,
    required this.selectedIndex,
    required this.onChanged,
  });

  final List<String> options;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        for (var i = 0; i < options.length; i++)
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(i),
              child: Container(
                margin: EdgeInsets.only(right: i == options.length - 1 ? 0 : 10),
                padding: const EdgeInsets.symmetric(vertical: 12),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: i == selectedIndex
                      ? AppColors.accentPrimary
                      : Colors.white,
                  borderRadius: BorderRadius.circular(30),
                  border: i == selectedIndex
                      ? null
                      : Border.all(color: AppColors.borderSubtle),
                ),
                child: Text(
                  options[i],
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: i == selectedIndex
                        ? Colors.white
                        : AppColors.textHeading,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
