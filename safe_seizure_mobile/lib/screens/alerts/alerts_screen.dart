import 'package:flutter/material.dart';

import '../../models/seizure_event.dart';
import '../../services/ble_connection_service.dart';
import '../../services/seizure_events_repository.dart';
import '../../theme/app_colors.dart';
import '../../widgets/app_button.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({
    super.key,
    required this.isCaregiver,
    required this.effectiveUserId,
    required this.seizureState,
    required this.onAcknowledge,
  });

  final bool isCaregiver;
  final String? effectiveUserId;
  final SeizureState seizureState;
  final VoidCallback onAcknowledge;

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  final _repository = SeizureEventsRepository();

  bool _isLoading = true;
  List<SeizureEvent> _confirmedEvents = const [];

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    final userId = widget.effectiveUserId;
    if (userId == null) {
      setState(() => _isLoading = false);
      return;
    }
    List<SeizureEvent> events = const [];
    try {
      events = await _repository.fetchRecent(userId: userId);
    } catch (e) {
      debugPrint('Failed to load seizure events: $e');
    }
    if (!mounted) return;
    setState(() {
      _confirmedEvents = events
          .where((e) => e.status == SeizureEventStatus.confirmed)
          .toList();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isLinked = !widget.isCaregiver || widget.effectiveUserId != null;
    final isLive = widget.seizureState != SeizureState.normal;

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
                      const Text(
                        'Alerts',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textHeading,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Notifications sent to caregivers.',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (isLinked && isLive) ...[
                        _LiveStatusBanner(
                          state: widget.seizureState,
                          showAcknowledge:
                              widget.isCaregiver &&
                              widget.seizureState == SeizureState.alarm,
                          onAcknowledge: widget.onAcknowledge,
                        ),
                        const SizedBox(height: 20),
                      ],
                    ],
                  ),
                ),
              ),
              if (!isLinked)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: _NotLinkedMessage(),
                )
              else if (_isLoading)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_confirmedEvents.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: const _EmptyAlerts(),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                  sliver: SliverList.separated(
                    itemCount: _confirmedEvents.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 16),
                    itemBuilder: (context, index) =>
                        _AlertCard(event: _confirmedEvents[index]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotLinkedMessage extends StatelessWidget {
  const _NotLinkedMessage();

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
                Icons.link_off_rounded,
                color: AppColors.textSecondary,
                size: 26,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              "You're not linked to anyone yet",
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Ask the person you care for to add your email under '
              'Emergency Contact in their Profile.',
              textAlign: TextAlign.center,
              style: TextStyle(
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

class _LiveStatusBanner extends StatelessWidget {
  const _LiveStatusBanner({
    required this.state,
    required this.showAcknowledge,
    required this.onAcknowledge,
  });

  final SeizureState state;
  final bool showAcknowledge;
  final VoidCallback onAcknowledge;

  @override
  Widget build(BuildContext context) {
    final isAlarm = state == SeizureState.alarm;
    final color = isAlarm ? AppColors.statusRed : AppColors.statusAmber;
    final title = isAlarm ? 'Seizure Alert' : 'Possible Seizure';
    final message = isAlarm
        ? 'A seizure has been detected and not cancelled.'
        : 'Checking for a cancel gesture from the wearer.';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_active_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (showAcknowledge) ...[
            const SizedBox(height: 16),
            AppButton(label: 'Acknowledge', onPressed: onAcknowledge),
          ],
        ],
      ),
    );
  }
}

class _EmptyAlerts extends StatelessWidget {
  const _EmptyAlerts();

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
                Icons.notifications_none_rounded,
                color: AppColors.textSecondary,
                size: 26,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'No alerts yet',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              "You'll see something here if a seizure is confirmed "
              'and a caregiver is notified.',
              textAlign: TextAlign.center,
              style: TextStyle(
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

class _AlertCard extends StatelessWidget {
  const _AlertCard({required this.event});

  final SeizureEvent event;

  @override
  Widget build(BuildContext context) {
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
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.statusRed,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.warning_rounded,
              color: Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Seizure Alert',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textHeading,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatDateTime(event.occurredAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (event.durationSeconds != null)
            Text(
              '${event.durationSeconds}s',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textHeading,
              ),
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
