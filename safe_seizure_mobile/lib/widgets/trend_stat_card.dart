import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class TrendStatCard extends StatelessWidget {
  const TrendStatCard({
    super.key,
    required this.title,
    required this.description,
    required this.data,
    required this.peakIndex,
    required this.peakValue,
    this.color = AppColors.accentPrimary,
  });

  final String title;
  final String description;
  final List<double> data;
  final int peakIndex;
  final String peakValue;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final minY = data.reduce((a, b) => a < b ? a : b);
    final maxY = data.reduce((a, b) => a > b ? a : b);
    final span = (maxY - minY).clamp(1, double.infinity);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textHeading,
                ),
              ),
              const _DailyChip(),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: AppColors.borderSubtle, height: 1),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 110,
            child: LineChart(
              LineChartData(
                minY: minY - span * 0.2,
                maxY: maxY + span * 0.2,
                gridData: const FlGridData(show: false),
                titlesData: const FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineTouchData: const LineTouchData(enabled: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      for (var i = 0; i < data.length; i++)
                        FlSpot(i.toDouble(), data[i]),
                    ],
                    isCurved: true,
                    curveSmoothness: 0.35,
                    color: color,
                    barWidth: 2,
                    dotData: FlDotData(
                      show: true,
                      checkToShowDot: (spot, _) =>
                          spot.x.toInt() == peakIndex,
                      getDotPainter: (spot, percent, bar, index) =>
                          FlDotCirclePainter(
                            radius: 5,
                            color: color,
                            strokeWidth: 3,
                            strokeColor: Colors.white,
                          ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          color.withValues(alpha: 0.18),
                          color.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Daily Peak',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    peakValue,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textHeading,
                    ),
                  ),
                ],
              ),
              _MiniBars(color: color),
            ],
          ),
        ],
      ),
    );
  }
}

class _DailyChip extends StatelessWidget {
  const _DailyChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Daily',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          SizedBox(width: 4),
          Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 16,
            color: AppColors.textSecondary,
          ),
        ],
      ),
    );
  }
}

class _MiniBars extends StatelessWidget {
  const _MiniBars({required this.color});

  final Color color;

  static const _heights = [8.0, 14.0, 10.0, 20.0, 16.0];

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        for (var i = 0; i < _heights.length; i++)
          Container(
            width: 3,
            height: _heights[i],
            margin: const EdgeInsets.only(left: 3),
            decoration: BoxDecoration(
              color: i >= _heights.length - 2
                  ? color
                  : AppColors.borderSubtle,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
      ],
    );
  }
}
