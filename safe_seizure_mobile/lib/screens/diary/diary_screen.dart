import 'package:flutter/material.dart';

import '../../models/seizure_event.dart';
import '../../services/seizure_events_repository.dart';
import '../../theme/app_colors.dart';
import '../../widgets/pill_filter.dart';

const _filterOptions = ['All', 'Confirmed', 'Cancelled'];

class DiaryScreen extends StatefulWidget {
  const DiaryScreen({super.key});

  @override
  State<DiaryScreen> createState() => _DiaryScreenState();
}

class _DiaryScreenState extends State<DiaryScreen> {
  final _repository = SeizureEventsRepository();

  bool _isLoading = true;
  List<SeizureEvent> _events = const [];
  int _filterIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() => _isLoading = true);
    final events = await _repository.fetchRecent();
    if (!mounted) return;
    setState(() {
      _events = events;
      _isLoading = false;
    });
  }

  List<SeizureEvent> get _filteredEvents {
    switch (_filterIndex) {
      case 1:
        return _events
            .where((e) => e.status == SeizureEventStatus.confirmed)
            .toList();
      case 2:
        return _events
            .where((e) => e.status == SeizureEventStatus.cancelled)
            .toList();
      default:
        return _events;
    }
  }

  int get _eventsThisWeek {
    final weekAgo = DateTime.now().subtract(const Duration(days: 7));
    return _events.where((e) => e.occurredAt.isAfter(weekAgo)).length;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
      child: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadEvents,
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Seizure Diary',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textHeading,
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text(
                              '$_eventsThisWeek events this week',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      PillFilter(
                        options: _filterOptions,
                        selectedIndex: _filterIndex,
                        onChanged: (index) =>
                            setState(() => _filterIndex = index),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
              if (_isLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_filteredEvents.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyDiary(hasAnyEvents: _events.isNotEmpty),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                  sliver: SliverList.separated(
                    itemCount: _filteredEvents.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 16),
                    itemBuilder: (context, index) =>
                        _EventCard(event: _filteredEvents[index]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyDiary extends StatelessWidget {
  const _EmptyDiary({required this.hasAnyEvents});

  final bool hasAnyEvents;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: AppColors.borderSubtle,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.event_note_rounded,
                color: AppColors.textSecondary,
                size: 26,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              hasAnyEvents
                  ? 'No events match this filter'
                  : 'No seizure events recorded yet',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              hasAnyEvents
                  ? 'Try a different filter above.'
                  : 'Events will appear here once your device detects and logs one.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event});

  final SeizureEvent event;

  @override
  Widget build(BuildContext context) {
    final isConfirmed = event.status == SeizureEventStatus.confirmed;
    final accentColor = isConfirmed
        ? AppColors.statusRed
        : AppColors.textSecondary;
    final iconColor = isConfirmed
        ? AppColors.accentPrimary
        : AppColors.borderSubtle;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(
                  color: accentColor,
                  shape: BoxShape.circle,
                ),
              ),
              Expanded(
                child: Text(
                  _formatDateTime(event.occurredAt),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textHeading,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  isConfirmed ? 'Confirmed' : 'Cancelled',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: accentColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.timelapse_rounded,
                  color: isConfirmed
                      ? Colors.white
                      : AppColors.textSecondary,
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Duration',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Text(
                      event.durationSeconds != null
                          ? '${event.durationSeconds}s'
                          : '—',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textHeading,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final minute = dt.minute.toString().padLeft(2, '0');
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year} — $hour:$minute $period';
  }
}
