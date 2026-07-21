import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:video_player/video_player.dart';

import '../../theme/app_colors.dart';
import '../../widgets/app_back_button.dart';
import '../auth/login_screen.dart';

enum _MediaType { image, svg, video }

class _OnboardingPageData {
  const _OnboardingPageData({
    required this.title,
    required this.description,
    required this.image,
    this.mediaType = _MediaType.image,
  });

  final String title;
  final String description;
  final String image;
  final _MediaType mediaType;
}

const _pages = [
  _OnboardingPageData(
    title: 'Detect & Alert',
    description:
        'The wearable spots a seizure and instantly sounds the alarm on '
        'your phone — so help is never far away, even at night.',
    image: 'assets/detect_alert.mp4',
    mediaType: _MediaType.video,
  ),
  _OnboardingPageData(
    title: 'Emergency Response',
    description:
        'When a seizure strikes, your caregiver sees your live location '
        'and can reach you fast, wherever you are.',
    image: 'assets/emergency_response.png',
  ),
  _OnboardingPageData(
    title: 'Care Together',
    description:
        'Seizure history is logged automatically and shared with your '
        'doctor and loved ones — so no one faces epilepsy alone.',
    image: 'assets/onboarding1.png',
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _finishOnboarding() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _next() {
    if (_page == _pages.length - 1) {
      _finishOnboarding();
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  void _previous() {
    if (_page == 0) {
      Navigator.of(context).maybePop();
      return;
    }
    _controller.previousPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLastPage = _page == _pages.length - 1;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: AppColors.backgroundGradient),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Row(
                  children: [
                    AppBackButton(onTap: _previous),
                    const SizedBox(width: 16),
                    Row(
                      children: List.generate(_pages.length, (index) {
                        final isActive = index == _page;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          margin: EdgeInsets.only(
                            right: index == _pages.length - 1 ? 0 : 6,
                          ),
                          width: 24,
                          height: 6,
                          decoration: BoxDecoration(
                            color: isActive ? AppColors.accentPrimary : AppColors.borderSubtle,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        );
                      }),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap: _next,
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: const BoxDecoration(
                          color: AppColors.accentPrimary,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          isLastPage
                              ? Icons.check_rounded
                              : Icons.chevron_right_rounded,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  itemCount: _pages.length,
                  onPageChanged: (index) => setState(() => _page = index),
                  itemBuilder: (context, index) {
                    final page = _pages[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        children: [
                          const SizedBox(height: 12),
                          Expanded(
                            child: Center(
                              child: switch (page.mediaType) {
                                _MediaType.svg => SvgPicture.asset(
                                  page.image,
                                  fit: BoxFit.contain,
                                ),
                                _MediaType.video => _OnboardingVideo(
                                  asset: page.image,
                                ),
                                _MediaType.image => Image.asset(
                                  page.image,
                                  fit: BoxFit.contain,
                                ),
                              },
                            ),
                          ),
                          const SizedBox(height: 32),
                          Text(
                            page.title,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textHeading,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            page.description,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(28, 0, 28, 24),
                child: Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    onPressed: _next,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentPrimary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 28,
                        vertical: 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      isLastPage ? 'Get Started' : 'Next',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingVideo extends StatefulWidget {
  const _OnboardingVideo({required this.asset});

  final String asset;

  @override
  State<_OnboardingVideo> createState() => _OnboardingVideoState();
}

class _OnboardingVideoState extends State<_OnboardingVideo> {
  late final VideoPlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.asset(widget.asset)
      ..setLooping(true)
      ..setVolume(0)
      ..initialize().then((_) {
        if (!mounted) return;
        setState(() {});
        _controller.play();
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_controller.value.isInitialized) {
      return const SizedBox.shrink();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: AspectRatio(
        aspectRatio: _controller.value.aspectRatio,
        child: VideoPlayer(_controller),
      ),
    );
  }
}
