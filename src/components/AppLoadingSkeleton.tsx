import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SkeletonLoader } from './SkeletonLoader';

type SkeletonColors = {
  surface: string;
  border: string;
};

export const AppLoadingSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTitleRow}>
          <View style={styles.logoRow}>
            <SkeletonLoader variant="text" style={styles.logoIcon} />
            <SkeletonLoader variant="text" style={styles.logoText} />
          </View>
        </View>

        <View style={styles.heroWrapper}>
          <View>
            <SkeletonLoader variant="text" style={styles.heroTitle} />
            <SkeletonLoader variant="text" style={styles.heroSubtitle} />
          </View>
          <SkeletonLoader variant="text" style={styles.dateBadge} />
        </View>

        <View style={styles.circlesCol}>
          <UsageCircleSkeleton colors={colors} />
          <UsageCircleSkeleton colors={colors} />
        </View>

        <View style={[styles.forecastCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.forecastHeader}>
            <View>
              <SkeletonLoader variant="text" style={styles.forecastTitle} />
              <SkeletonLoader variant="text" style={styles.forecastSubtitle} />
            </View>
            <SkeletonLoader variant="text" style={styles.forecastIcon} />
          </View>
          <SkeletonLoader variant="text" style={styles.forecastTotal} />
          <SkeletonLoader variant="text" style={styles.progressBar} />
          <SkeletonLoader variant="text" style={styles.forecastFooter} />
        </View>

        <SkeletonLoader variant="text" style={styles.sectionTitle} />
        <View style={styles.appCardsRow}>
          <AppCardSkeleton colors={colors} />
          <AppCardSkeleton colors={colors} />
          <AppCardSkeleton colors={colors} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const UsageCircleSkeleton: React.FC<{ colors: SkeletonColors }> = ({ colors }) => (
  <View style={[styles.circleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <SkeletonLoader variant="text" style={styles.circleTitle} />
    <SkeletonLoader variant="card" style={styles.circle} />
    <View style={styles.statsRow}>
      <View style={styles.statBox}>
        <SkeletonLoader variant="text" style={styles.statLabel} />
        <SkeletonLoader variant="text" style={styles.statValue} />
      </View>
      <View style={styles.statBoxRight}>
        <SkeletonLoader variant="text" style={styles.statLabelRight} />
        <SkeletonLoader variant="text" style={styles.statValueRight} />
      </View>
    </View>
  </View>
);

const AppCardSkeleton: React.FC<{ colors: SkeletonColors }> = ({ colors }) => (
  <View style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <SkeletonLoader variant="card" style={styles.appIcon} />
    <SkeletonLoader variant="text" style={styles.appName} />
    <SkeletonLoader variant="text" style={styles.appBytes} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 8,
  },
  logoText: {
    width: 150,
    height: 22,
    borderRadius: 8,
  },
  heroWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    width: 92,
    height: 30,
    borderRadius: 10,
  },
  heroSubtitle: {
    width: 235,
    height: 13,
    borderRadius: 7,
    marginTop: 8,
  },
  dateBadge: {
    width: 60,
    height: 28,
    borderRadius: 16,
  },
  circlesCol: {
    marginBottom: 24,
  },
  circleCard: {
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  circleTitle: {
    width: 132,
    height: 20,
    borderRadius: 8,
    marginBottom: 32,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 32,
    marginVertical: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  statBox: {
    flex: 1,
  },
  statBoxRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statLabel: {
    width: 48,
    height: 11,
    borderRadius: 6,
    marginBottom: 8,
  },
  statValue: {
    width: 82,
    height: 16,
    borderRadius: 7,
  },
  statLabelRight: {
    width: 70,
    height: 11,
    borderRadius: 6,
    marginBottom: 8,
  },
  statValueRight: {
    width: 88,
    height: 16,
    borderRadius: 7,
  },
  forecastCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    padding: 24,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  forecastTitle: {
    width: 92,
    height: 22,
    borderRadius: 8,
  },
  forecastSubtitle: {
    width: 150,
    height: 13,
    borderRadius: 7,
    marginTop: 8,
  },
  forecastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  forecastTotal: {
    width: 172,
    height: 36,
    borderRadius: 10,
    marginBottom: 14,
  },
  progressBar: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  forecastFooter: {
    width: '88%',
    height: 12,
    borderRadius: 6,
  },
  sectionTitle: {
    width: 140,
    height: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  appCardsRow: {
    flexDirection: 'row',
  },
  appCard: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 16,
    padding: 16,
    width: 120,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginBottom: 12,
    marginVertical: 0,
  },
  appName: {
    width: 76,
    height: 14,
    borderRadius: 7,
    marginBottom: 8,
  },
  appBytes: {
    width: 62,
    height: 13,
    borderRadius: 7,
  },
});
