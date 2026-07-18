import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Svg, Path, Circle, Rect } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { haptics } from '../utils/haptics';

const APP_VERSION = '1.0.0';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.datadetector';
const PRIVACY_POLICY_URL = 'https://datadetector.app/privacy';

// Icon components
const AppIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="20" height="20" rx="4" stroke={color} strokeWidth="1.5" />
    <Path d="M7 14L12 9L17 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="6" r="1.5" fill={color} />
  </Svg>
);

const ChevronRight: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Changelog data
const CHANGELOG = [
  {
    version: '1.0.0',
    date: 'July 2026',
    changes: [
      'Initial release',
      'Real-time network usage tracking',
      'Per-app data breakdown (WiFi / Mobile / Hotspot)',
      'Usage history with calendar heatmap',
      'Monthly data budget with burn-rate projection',
      'Background sync every 30 minutes',
      'Dark / Light / System theme support',
    ],
  },
];

export const AboutScreen: React.FC = () => {
  const { colors } = useTheme();

  const handleRateApp = () => {
    haptics.medium();
    Linking.openURL(PLAY_STORE_URL).catch(() => {});
  };

  const handlePrivacyPolicy = () => {
    haptics.light();
    Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
  };

  const handleShareApp = async () => {
    haptics.medium();
    try {
      await Share.share({
        message: `Check out DataDetector — a beautiful app to track your mobile data usage! 📊\n\n${PLAY_STORE_URL}`,
      });
    } catch (e) {
      console.error('[AboutScreen] Share failed:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Identity Card */}
        <Animated.View
          style={[styles.identityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(100).springify().damping(14)}
        >
          <View style={[styles.appIconWrapper, { backgroundColor: colors.accentSemiTrans }]}>
            <AppIcon size={48} color={colors.accent} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>DataDetector</Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version {APP_VERSION}
          </Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Track every byte. Own your data.
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(200).springify().damping(14)}
        >
          <TouchableOpacity style={[styles.actionRow, { borderBottomColor: colors.divider }]} onPress={handleRateApp}>
            <View style={styles.actionLeft}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={colors.warning} strokeWidth="2" fill={colors.warning} />
              </Svg>
              <Text style={[styles.actionText, { color: colors.text }]}>Rate on Play Store</Text>
            </View>
            <ChevronRight color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomColor: colors.divider }]} onPress={handleShareApp}>
            <View style={styles.actionLeft}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="18" cy="5" r="3" stroke={colors.accent} strokeWidth="2" />
                <Circle cx="6" cy="12" r="3" stroke={colors.accent} strokeWidth="2" />
                <Circle cx="18" cy="19" r="3" stroke={colors.accent} strokeWidth="2" />
                <Path d="M8.59 13.51L15.42 17.49" stroke={colors.accent} strokeWidth="2" />
                <Path d="M15.41 6.51L8.59 10.49" stroke={colors.accent} strokeWidth="2" />
              </Svg>
              <Text style={[styles.actionText, { color: colors.text }]}>Share DataDetector</Text>
            </View>
            <ChevronRight color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handlePrivacyPolicy}>
            <View style={styles.actionLeft}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={colors.textSecondary} strokeWidth="2" strokeLinejoin="round" />
              </Svg>
              <Text style={[styles.actionText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <ChevronRight color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Changelog */}
        <Animated.View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(300).springify().damping(14)}
        >
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Changelog</Text>
          {CHANGELOG.map((release, idx) => (
            <View key={idx} style={styles.releaseBlock}>
              <View style={styles.releaseHeader}>
                <Text style={[styles.releaseVersion, { color: colors.accent }]}>v{release.version}</Text>
                <Text style={[styles.releaseDate, { color: colors.textMuted }]}>{release.date}</Text>
              </View>
              {release.changes.map((change, changeIdx) => (
                <View key={changeIdx} style={styles.changeRow}>
                  <View style={[styles.changeDot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.changeText, { color: colors.text }]}>{change}</Text>
                </View>
              ))}
            </View>
          ))}
        </Animated.View>

        {/* Credits */}
        <Animated.View
          style={[styles.creditsCard]}
          entering={FadeInDown.delay(400).springify().damping(14)}
        >
          <Text style={[styles.creditsText, { color: colors.textMuted }]}>
            Made with ❤️ by Viraj
          </Text>
          <Text style={[styles.techText, { color: colors.textMuted }]}>
            React Native • SQLite • Kotlin
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  identityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 14,
  },
  releaseBlock: {
    marginBottom: 12,
  },
  releaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  releaseVersion: {
    fontSize: 14,
    fontWeight: '800',
  },
  releaseDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 4,
  },
  changeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  creditsCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  techText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default AboutScreen;
