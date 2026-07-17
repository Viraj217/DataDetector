import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { TodayStackParamList } from '../navigation/types';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { formatBytes } from '../utils/formatBytes';
import { dateUtils } from '../utils/dateUtils';
import { SkeletonLoader } from '../components/SkeletonLoader';

type AppDetailScreenRouteProp = RouteProp<TodayStackParamList, 'AppDetail'>;

export const AppDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<AppDetailScreenRouteProp>();
  const { packageName } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<any>(null);
  const [totals, setTotals] = useState({ today: 0, month: 0, allTime: 0 });
  const [history, setHistory] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    try {
      const todayStr = dateUtils.getLocalDateString();
      const startOfMonthStr = dateUtils.getStartOfMonth();

      // 1. Fetch app basic info
      let app = queries.getApp(packageName);
      if (!app) {
        // Fallback for system packages
        app = {
          package_name: packageName,
          display_name: packageName.startsWith('system.uid_')
            ? `System UID ${packageName.split('_')[1]}`
            : packageName === 'system.tethering'
            ? 'Tethering & Hotspot'
            : packageName,
          icon_uri: '',
          category: 'system',
        };
      }
      setAppInfo(app);

      // 2. Fetch history (30 days)
      const usageHistory = queries.getAppUsageHistory(packageName, 30, todayStr);
      setHistory(usageHistory);

      // 3. Compute totals
      let todaySum = 0;
      let monthSum = 0;
      let allTimeSum = 0;

      for (const row of usageHistory) {
        const rowSum = row.mobile + row.wifi + row.hotspot;
        allTimeSum += rowSum;
        
        if (row.date === todayStr) {
          todaySum = rowSum;
        }
        
        if (row.date >= startOfMonthStr) {
          monthSum += rowSum;
        }
      }
      
      setTotals({
        today: todaySum,
        month: monthSum,
        allTime: allTimeSum,
      });

    } catch (e) {
      console.error('[AppDetailScreen] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [packageName])
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <SkeletonLoader variant="row" style={{ height: 60, marginBottom: 24 }} />
          <SkeletonLoader variant="card" style={{ height: 120, marginBottom: 24 }} />
          <SkeletonLoader variant="card" style={{ height: 180 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Formatting sparklines/charts for gifted-charts
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 72;

  // Trend line chart data (daily totals in MB)
  const lineChartData = history.map((item) => {
    const sumMb = (item.mobile + item.wifi + item.hotspot) / (1024 * 1024);
    
    // Short label for weekends or major tick
    const parts = item.date.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const label = dateObj.getDate() === 1 || dateObj.getDate() % 7 === 0 
      ? dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) 
      : '';

    return { value: sumMb, label: label };
  });

  // Stacked chart data (network type split per day)
  const stackedChartData = history.map((item) => {
    const mobileMb = item.mobile / (1024 * 1024);
    const wifiMb = item.wifi / (1024 * 1024);
    const hotspotMb = item.hotspot / (1024 * 1024);

    const parts = item.date.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const label = dateObj.getDate() % 5 === 0 ? `${dateObj.getDate()}` : '';

    return {
      stacks: [
        { value: wifiMb, color: colors.accent },
        { value: mobileMb, color: colors.danger },
        { value: hotspotMb, color: colors.warning },
      ],
      label: label,
    };
  });

  // Render app logo/fallback
  const renderAppLogo = () => {
    const hasIcon = appInfo?.icon_uri && appInfo.icon_uri.startsWith('file://');
    if (hasIcon) {
      return <Image source={{ uri: appInfo.icon_uri }} style={styles.appIcon} />;
    }
    const firstLetter = appInfo?.display_name ? appInfo.display_name.charAt(0).toUpperCase() : '?';
    const isSystem = appInfo?.category === 'system';
    
    return (
      <View style={[styles.fallbackIcon, { backgroundColor: isSystem ? colors.card : colors.accentSemiTrans }]}>
        <Text style={[styles.fallbackIconText, { color: isSystem ? colors.textSecondary : colors.accent }]}>
          {firstLetter}
        </Text>
      </View>
    );
  };

  // Last 7 days breakdown rows
  const last7DaysBreakdown = [...history]
    .reverse()
    .slice(0, 7);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Metadata */}
        <View style={styles.appHeader}>
          {renderAppLogo()}
          <View style={styles.appInfoContainer}>
            <Text style={[styles.appName, { color: colors.text }]} numberOfLines={2}>
              {appInfo?.display_name}
            </Text>
            <Text style={[styles.appPkg, { color: colors.textSecondary }]} numberOfLines={1}>
              {appInfo?.package_name}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: colors.card }]}>
              <Text style={[styles.categoryText, { color: colors.accent }]}>
                {appInfo?.category || 'other'}
              </Text>
            </View>
          </View>
        </View>

        {/* Totals Summary Row */}
        <View style={[styles.totalsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.totalItem}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Today</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{formatBytes(totals.today).full}</Text>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>This Month</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{formatBytes(totals.month).full}</Text>
          </View>
          <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>30D Total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{formatBytes(totals.allTime).full}</Text>
          </View>
        </View>

        {/* Usage Trend Line Chart */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Usage Trend (MB)</Text>
          <View style={styles.chartWrapper}>
            <LineChart
              data={lineChartData}
              width={chartWidth}
              height={140}
              color={colors.accent}
              thickness={2}
              noOfSections={3}
              hideRules
              yAxisColor="transparent"
              xAxisColor={colors.border}
              yAxisThickness={0}
              xAxisThickness={1}
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8 }}
              hideDataPoints
              initialSpacing={10}
              adjustToWidth
            />
          </View>
        </View>

        {/* Stacked Chart split */}
        {totals.allTime > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Network Type Split (MB)</Text>
            <View style={styles.chartWrapper}>
              <BarChart
                stackData={stackedChartData}
                width={chartWidth}
                height={140}
                barWidth={6}
                spacing={12}
                noOfSections={3}
                barBorderRadius={3}
                initialSpacing={10}
                xAxisColor={colors.border}
                yAxisColor="transparent"
                xAxisThickness={1}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
                hideRules
              />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Wi-Fi</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Mobile</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Hotspot</Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily Breakdown Table */}
        <Text style={[styles.tableHeaderTitle, { color: colors.text }]}>Last 7 Days Breakdown</Text>
        <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {last7DaysBreakdown.map((day, idx) => {
            const daySum = day.mobile + day.wifi + day.hotspot;
            if (daySum === 0) return null;
            
            // Format row date e.g. "Wednesday, 16 Jul"
            const parts = day.date.split('-');
            const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

            return (
              <View
                key={day.date}
                style={[
                  styles.tableRow,
                  { borderBottomColor: colors.divider, borderBottomWidth: idx === last7DaysBreakdown.length - 1 ? 0 : 1 },
                ]}
              >
                <Text style={[styles.rowDate, { color: colors.text }]}>{dayName}</Text>
                
                <View style={styles.rowBreakdown}>
                  {day.wifi > 0 && (
                    <Text style={[styles.rowBreakdownText, { color: colors.accent }]}>
                      W: {formatBytes(day.wifi, 1).full}
                    </Text>
                  )}
                  {day.mobile > 0 && (
                    <Text style={[styles.rowBreakdownText, { color: colors.danger }]}>
                      M: {formatBytes(day.mobile, 1).full}
                    </Text>
                  )}
                  {day.hotspot > 0 && (
                    <Text style={[styles.rowBreakdownText, { color: colors.warning }]}>
                      H: {formatBytes(day.hotspot, 1).full}
                    </Text>
                  )}
                </View>
                
                <Text style={[styles.rowTotal, { color: colors.text }]}>
                  {formatBytes(daySum, 1).full}
                </Text>
              </View>
            );
          })}
        </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 16,
  },
  fallbackIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  fallbackIconText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  appInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  appPkg: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalDivider: {
    width: 1,
    height: 32,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12,
  },
  tableCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowDate: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1.2,
  },
  rowBreakdown: {
    flex: 1.8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rowBreakdownText: {
    fontSize: 9,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  rowTotal: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
    flex: 1,
  },
});
export default AppDetailScreen;
