import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { nativeNetworkStats } from '../services/nativeNetworkStats';
import { queries } from '../database/queries';
import { haptics } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: () => void;
}

// Slide data
const SLIDES = [
  {
    key: 'track',
    title: 'Track Every Byte',
    subtitle: 'Know exactly how much data each app consumes — WiFi, Mobile, and Hotspot.',
    iconType: 'chart',
  },
  {
    key: 'permission',
    title: 'Grant Access',
    subtitle: 'We need Usage Statistics permission to read network data. Your data stays on-device — nothing is uploaded.',
    iconType: 'shield',
  },
  {
    key: 'budget',
    title: 'Set Your Budget',
    subtitle: 'Configure your monthly data limit and get alerts before you exceed it.',
    iconType: 'budget',
  },
];

// Icon components for each slide
const SlideIcon: React.FC<{ type: string; color: string; accent: string }> = ({ type, color, accent }) => {
  const size = 120;
  return (
    <View style={styles.iconContainer}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {type === 'chart' && (
          <>
            <Rect x="2" y="2" width="20" height="20" rx="3" stroke={accent} strokeWidth="1.5" />
            <Rect x="5" y="12" width="3" height="7" rx="1" fill={accent} opacity={0.7} />
            <Rect x="10.5" y="8" width="3" height="11" rx="1" fill={accent} />
            <Rect x="16" y="5" width="3" height="14" rx="1" fill={accent} opacity={0.5} />
          </>
        )}
        {type === 'shield' && (
          <>
            <Path
              d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
              stroke={accent}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <Path d="M9 12L11 14L15 10" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {type === 'budget' && (
          <>
            <Circle cx="12" cy="12" r="10" stroke={accent} strokeWidth="1.5" />
            <Path d="M12 6V12L16 14" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7 17L5 19" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M17 17L19 19" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </Svg>
    </View>
  );
};

export const OnboardingScreen: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [monthlyCapGb, setMonthlyCapGb] = useState('10');
  const [cycleStartDay, setCycleStartDay] = useState('1');
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    haptics.light();
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleGrantPermission = async () => {
    haptics.medium();
    await nativeNetworkStats.requestUsagePermission();
    // User will return to app after granting — we check in AppContent
  };

  const handleCheckPermission = async () => {
    const granted = await nativeNetworkStats.checkUsagePermission();
    setPermissionGranted(granted);
    if (granted) {
      haptics.success();
      handleNext();
    } else {
      Alert.alert(
        'Permission Not Granted',
        'Please grant Usage Statistics permission to continue. Tap "Grant Access" to open settings.',
      );
    }
  };

  const handleFinish = () => {
    const gb = parseFloat(monthlyCapGb);
    const day = parseInt(cycleStartDay, 10);

    if (isNaN(gb) || gb < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid monthly data limit in GB.');
      return;
    }
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Invalid Input', 'Billing cycle start day must be between 1 and 31.');
      return;
    }

    // Save budget settings
    const bytes = Math.round(gb * 1024 * 1024 * 1024);
    queries.setSetting('monthly_cap_bytes', bytes.toString());
    queries.setSetting('billing_cycle_start_day', day.toString());
    queries.setSetting('onboarding_completed', 'true');

    haptics.success();
    onComplete();
  };

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <SlideIcon type={item.iconType} color={colors.text} accent={colors.accent} />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
      </Animated.View>

      {/* Slide-specific content */}
      {item.key === 'permission' && (
        <Animated.View style={styles.slideActions} entering={FadeInUp.delay(400).springify()}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleGrantPermission}
          >
            <Text style={[styles.primaryBtnText, { color: colors.background }]}>Grant Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.accent }]}
            onPress={handleCheckPermission}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>I've Granted It →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {item.key === 'budget' && (
        <Animated.View style={styles.slideActions} entering={FadeInUp.delay(400).springify()}>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Limit (GB)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                keyboardType="numeric"
                value={monthlyCapGb}
                onChangeText={setMonthlyCapGb}
                placeholder="e.g. 15"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Billing Day (1-31)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                keyboardType="numeric"
                value={cycleStartDay}
                onChangeText={setCycleStartDay}
                placeholder="e.g. 1"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isPermissionSlide = currentIndex === 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(idx);
        }}
      />

      {/* Bottom section: dots + button */}
      <View style={styles.bottomSection}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentIndex ? colors.accent : colors.border,
                  width: idx === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action button */}
        {!isPermissionSlide && (
          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: colors.accent }]}
            onPress={isLastSlide ? handleFinish : handleNext}
          >
            <Text style={[styles.bottomBtnText, { color: colors.background }]}>
              {isLastSlide ? 'Get Started 🚀' : 'Next'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  slideActions: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomBtn: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnText: {
    fontSize: 17,
    fontWeight: '800',
  },
});

export default OnboardingScreen;
