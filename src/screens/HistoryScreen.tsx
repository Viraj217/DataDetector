import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from '../components/AppText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HistoryStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { dateUtils } from '../utils/dateUtils';
import { syncService } from '../services/syncService';
import { CalendarHeatmap } from '../components/CalendarHeatmap';
import { StackedBarChart } from '../components/StackedBarChart';
import { WeekComparisonChart } from '../components/WeekComparisonChart';
import { PeakUsageChart } from '../components/PeakUsageChart';
import { SkeletonLoader } from '../components/SkeletonLoader';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

type HistoryScreenNavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'HistoryHome'>;

export const HistoryScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<HistoryScreenNavigationProp>();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [stackedData, setStackedData] = useState<any[]>([]);
  const [hourlyHeatmapData, setHourlyHeatmapData] = useState<any[]>([]);
  const [weekComparison, setWeekComparison] = useState<{ thisWeek: any[]; lastWeek: any[] }>({
    thisWeek: [],
    lastWeek: [],
  });
  const [historyDays, setHistoryDays] = useState<number>(30); // 7 or 30 days toggle

  const loadData = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const todayStr = dateUtils.getLocalDateString();

      // 1. Fetch Heatmap data (90 days)
      const heatmap = queries.getHeatmapData(90, todayStr);
      setHeatmapData(heatmap);

      // 2. Fetch Stacked Bar data (toggle 7 vs 30 days)
      const stacked = queries.getDailyTotals(historyDays, todayStr);
      setStackedData(stacked);

      // 2b. Fetch today's hourly data for the Peak Usage Hours chart
      const hourlyHeatmap = queries.getHourlyBreakdown(todayStr);
      setHourlyHeatmapData(hourlyHeatmap);

      // 3. Fetch Week Comparison data
      const thisWeekRange = dateUtils.getThisWeekRange();
      const lastWeekRange = dateUtils.getLastWeekRange();
      const weekData = queries.getWeekComparison(
        thisWeekRange.start,
        thisWeekRange.end,
        lastWeekRange.start,
        lastWeekRange.end
      );
      setWeekComparison({
        thisWeek: weekData.week1,
        lastWeek: weekData.week2,
      });
    } catch (e) {
      console.error('[HistoryScreen] Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.sync();
      await loadData(true);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [historyDays])
  );

  const handlePressDay = (date: string) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    navigation.navigate('DayDetail', { date });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <SkeletonLoader variant="card" style={{ height: 160, marginBottom: 24 }} />
          <SkeletonLoader variant="card" style={{ height: 180, marginBottom: 24 }} />
          <SkeletonLoader variant="card" style={{ height: 160 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Heatmap Section */}
        <Animated.View 
          style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(100).springify()}
        >
          <CalendarHeatmap
            data={heatmapData}
            currentDateStr={dateUtils.getLocalDateString()}
            onPressDay={handlePressDay}
          />
        </Animated.View>

        {/* Peak Usage Section */}
        <Animated.View
          style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(150).springify()}
        >
          <PeakUsageChart data={hourlyHeatmapData} />
        </Animated.View>

        {/* Usage Trend Section */}
        <Animated.View 
          style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(200).springify()}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Usage Trend</Text>
            <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceContainer }]}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  historyDays === 7 && { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EDE9FE' },
                ]}
                onPress={() => {
                  ReactNativeHapticFeedback.trigger('selection');
                  setHistoryDays(7);
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: historyDays === 7 ? colors.accent : colors.textSecondary },
                  ]}
                >
                  7 Days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  historyDays === 30 && { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EDE9FE' },
                ]}
                onPress={() => {
                  ReactNativeHapticFeedback.trigger('selection');
                  setHistoryDays(30);
                }}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: historyDays === 30 ? colors.accent : colors.textSecondary },
                  ]}
                >
                  30 Days
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <StackedBarChart data={stackedData} />
        </Animated.View>

        {/* Week Comparison Section */}
        <Animated.View 
          style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInDown.delay(300).springify()}
        >
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 16 }]}>Week Comparison</Text>
          <WeekComparisonChart
            thisWeek={weekComparison.thisWeek}
            lastWeek={weekComparison.lastWeek}
          />
        </Animated.View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    backgroundColor: '#F1F5F9',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
