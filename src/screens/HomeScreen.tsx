import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { syncService } from '../services/syncService';
import { dateUtils } from '../utils/dateUtils';
import { formatBytes } from '../utils/formatBytes';
import { AnimatedCounter } from '../components/AnimatedCounter';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { NetworkSplitRing } from '../components/NetworkSplitRing';
import { ComparisonCard } from '../components/ComparisonCard';
import { AppUsageRow } from '../components/AppUsageRow';
import { SkeletonLoader } from '../components/SkeletonLoader';

type HomeScreenNavigationProp = NativeStackNavigationProp<TodayStackParamList, 'TodayHome'>;

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [networkSplit, setNetworkSplit] = useState({ wifi: 0, mobile: 0, hotspot: 0 });
  const [comparisons, setComparisons] = useState({
    yesterdayChange: 0,
    yesterdayVal: '0 B',
    avgChange: 0,
    avgVal: '0 B',
    weekChange: 0,
    weekVal: '0 B',
  });
  const [topApps, setTopApps] = useState<any[]>([]);

  const loadData = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const todayStr = dateUtils.getLocalDateString();
      const yesterdayStr = dateUtils.getLocalDateDaysAgo(1);

      // 1. Fetch Today's totals and split
      const splitRows = queries.getTodayTotalByNetworkType(todayStr);
      let wifi = 0;
      let mobile = 0;
      let hotspot = 0;
      for (const row of splitRows) {
        if (row.network_type === 'wifi') wifi = row.total_bytes;
        else if (row.network_type === 'mobile') mobile = row.total_bytes;
        else if (row.network_type === 'hotspot') hotspot = row.total_bytes;
      }
      setNetworkSplit({ wifi, mobile, hotspot });
      const todaySum = wifi + mobile + hotspot;
      setTodayTotal(todaySum);

      // 2. Fetch comparisons
      // Today vs Yesterday
      const yesterdayRows = queries.getTodayTotalByNetworkType(yesterdayStr);
      const yesterdaySum = yesterdayRows.reduce((acc, curr) => acc + curr.total_bytes, 0);
      const yesterdayDiff = todaySum - yesterdaySum;
      const yesterdayPercent = yesterdaySum > 0 ? (yesterdayDiff / yesterdaySum) * 100 : 0;

      // Today vs 7-day average (prior 7 days)
      const priorTotals = queries.getDailyTotals(7, yesterdayStr);
      const priorSum = priorTotals.reduce((acc, curr) => acc + curr.mobile + curr.wifi + curr.hotspot, 0);
      const priorAvg = priorTotals.length > 0 ? priorSum / priorTotals.length : 0;
      const avgDiff = todaySum - priorAvg;
      const avgPercent = priorAvg > 0 ? (avgDiff / priorAvg) * 100 : 0;

      // Current week vs Last week
      const thisWeek = dateUtils.getThisWeekRange();
      const lastWeek = dateUtils.getLastWeekRange();
      const weekData = queries.getWeekComparison(
        thisWeek.start,
        thisWeek.end,
        lastWeek.start,
        lastWeek.end
      );
      const thisWeekSum = weekData.week1.reduce((acc, curr) => acc + curr.total, 0);
      const lastWeekSum = weekData.week2.reduce((acc, curr) => acc + curr.total, 0);
      const weekDiff = thisWeekSum - lastWeekSum;
      const weekPercent = lastWeekSum > 0 ? (weekDiff / lastWeekSum) * 100 : 0;

      setComparisons({
        yesterdayChange: yesterdayPercent,
        yesterdayVal: formatBytes(yesterdaySum).full,
        avgChange: avgPercent,
        avgVal: formatBytes(priorAvg).full,
        weekChange: weekPercent,
        weekVal: formatBytes(lastWeekSum).full,
      });

      // 3. Fetch Top apps and sparkline
      const apps = queries.getTopAppsTodayAggregated(todayStr, 15);
      
      // Batch fetch sparkline raw values for last 7 days
      const sparklineRaw = queries.getAppsSparklines(7, todayStr);
      // Map of packageName -> Map of date -> bytes
      const appDateBytesMap = new Map<string, Map<string, number>>();
      
      for (const row of sparklineRaw) {
        if (!appDateBytesMap.has(row.app_package_name)) {
          appDateBytesMap.set(row.app_package_name, new Map());
        }
        appDateBytesMap.get(row.app_package_name)!.set(row.date, row.daily_bytes);
      }

      // Generate the last 7 dates array in chronological order (oldest to newest)
      const last7Dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        last7Dates.push(dateUtils.getLocalDateDaysAgo(i));
      }

      const appsWithSparklines = apps.map((app) => {
        const dateMap = appDateBytesMap.get(app.package_name);
        const sparklineValues = last7Dates.map((date) => {
          return dateMap?.get(date) || 0;
        });
        
        return {
          ...app,
          sparkline: sparklineValues,
        };
      });

      setTopApps(appsWithSparklines);
    } catch (e) {
      console.error('[HomeScreen] Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.sync();
      await loadData(true);
    } catch (e) {
      console.error('[HomeScreen] Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Re-run whenever home screen is focused (returns from settings, app list etc.)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const formattedToday = formatBytes(todayTotal);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <SkeletonLoader variant="card" style={{ height: 180, marginBottom: 24 }} />
          <SkeletonLoader variant="card" style={{ height: 100, marginBottom: 24 }} />
          <SkeletonLoader variant="text" style={{ width: '40%', height: 20, marginBottom: 12 }} />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Header */}
      <Animated.View style={styles.heroWrapper} entering={FadeInDown.delay(100).springify().damping(12)}>
        <AnimatedCounter
          value={parseFloat(formattedToday.value)}
          formatter={(val) => val.toFixed(formattedToday.unit === 'B' ? 0 : 2)}
          style={[styles.heroValue, { color: colors.text }]}
        />
        <Text style={[styles.heroUnit, { color: colors.accent }]}>
          {formattedToday.unit}
        </Text>
      </Animated.View>
      <Text style={[styles.heroSubText, { color: colors.textSecondary }]}>
        Consumed Today
      </Text>

      {/* Donut Chart Ring */}
      <Animated.View 
        style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        entering={FadeInDown.delay(200).springify().damping(14)}
      >
        <NetworkSplitRing
          mobile={networkSplit.mobile}
          wifi={networkSplit.wifi}
          hotspot={networkSplit.hotspot}
        />
      </Animated.View>

      {/* Comparisons Row */}
      <Animated.View style={styles.comparisonsRow} entering={FadeInDown.delay(300).springify().damping(14)}>
        <ComparisonCard
          title="vs Yesterday"
          value={comparisons.yesterdayVal}
          changePercent={comparisons.yesterdayChange}
        />
        <ComparisonCard
          title="7-Day Avg"
          value={comparisons.avgVal}
          changePercent={comparisons.avgChange}
        />
        <ComparisonCard
          title="Last Week"
          value={comparisons.weekVal}
          changePercent={comparisons.weekChange}
        />
      </Animated.View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Top Apps Today
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={topApps}
        renderItem={({ item, index }) => (
          <AppUsageRow
            displayName={item.display_name}
            packageName={item.package_name}
            iconUri={item.icon_uri}
            totalBytes={item.total_bytes}
            mobileBytes={item.mobile_bytes}
            wifiBytes={item.wifi_bytes}
            hotspotBytes={item.hotspot_bytes}
            sparklineData={item.sparkline}
            index={index}
            onPress={() => navigation.navigate('AppDetail', { packageName: item.package_name })}
          />
        )}
        keyExtractor={(item) => item.package_name}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No network activity tracked today.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 8,
  },
  heroWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 16,
  },
  heroValue: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  heroSubText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: -4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  comparisonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    marginHorizontal: -4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
