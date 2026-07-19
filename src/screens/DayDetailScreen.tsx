import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../components/AppText';
import { useRoute, useNavigation, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HistoryStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { formatBytes } from '../utils/formatBytes';
import { NetworkSplitRing } from '../components/NetworkSplitRing';
import { AppUsageRow } from '../components/AppUsageRow';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { budgetService } from '../services/budgetService';

type DayDetailScreenRouteProp = RouteProp<HistoryStackParamList, 'DayDetail'>;
type DayDetailScreenNavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'DayDetail'>;

type SortType = 'total' | 'mobile' | 'wifi';

export const DayDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<DayDetailScreenRouteProp>();
  const navigation = useNavigation<DayDetailScreenNavigationProp>();
  const { date } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [networkSplit, setNetworkSplit] = useState({ wifi: 0, mobile: 0, hotspot: 0 });
  const [usageRatio, setUsageRatio] = useState<number | undefined>();
  const [appsData, setAppsData] = useState<any[]>([]);
  const [sortType, setSortType] = useState<SortType>('total');

  const loadData = () => {
    setLoading(true);
    try {
      // 1. Load network split
      const splitRows = queries.getTodayTotalByNetworkType(date);
      let wifi = 0;
      let mobile = 0;
      let hotspot = 0;
      for (const row of splitRows) {
        if (row.network_type === 'wifi') wifi = row.total_bytes;
        else if (row.network_type === 'mobile') mobile = row.total_bytes;
        else if (row.network_type === 'hotspot') hotspot = row.total_bytes;
      }
      setNetworkSplit({ wifi, mobile, hotspot });
      setUsageRatio(calculateDailyUsageRatio(date, mobile, hotspot));

      // 2. Load apps usage for that date
      const apps = queries.getTopAppsTodayAggregated(date, 50);
      setAppsData(apps);
    } catch (e) {
      console.error('[DayDetailScreen] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [date])
  );

  // Sorting logic
  const getSortedApps = () => {
    const dataCopy = [...appsData];
    if (sortType === 'mobile') {
      return dataCopy.sort((a, b) => b.mobile_bytes - a.mobile_bytes).filter((a) => a.mobile_bytes > 0);
    }
    if (sortType === 'wifi') {
      return dataCopy.sort((a, b) => b.wifi_bytes - a.wifi_bytes).filter((a) => a.wifi_bytes > 0);
    }
    return dataCopy.sort((a, b) => b.total_bytes - a.total_bytes);
  };

  const sortedApps = getSortedApps();

  // Short formatting of header date e.g. "12 Dec 2025"
  const getFormattedHeaderDate = () => {
    const parts = date.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <SkeletonLoader variant="card" style={{ height: 180, marginBottom: 24 }} />
          <SkeletonLoader variant="text" style={{ width: '30%', height: 20, marginBottom: 12 }} />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
          <SkeletonLoader variant="row" />
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{getFormattedHeaderDate()}</Text>
      
      {/* Donut Chart split */}
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <NetworkSplitRing
          mobile={networkSplit.mobile}
          wifi={networkSplit.wifi}
          hotspot={networkSplit.hotspot}
          size={156}
          usageRatio={usageRatio}
          centerLabel="Day Total"
        />
      </View>

      {/* Sorting bar */}
      <View style={styles.sortBar}>
        <Text style={[styles.sortTitle, { color: colors.textSecondary }]}>Sort by:</Text>
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortType === 'total' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSortType('total')}
          >
            <Text style={[styles.sortText, { color: sortType === 'total' ? colors.background : colors.textSecondary }]}>
              Total
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortType === 'mobile' && { backgroundColor: colors.danger },
            ]}
            onPress={() => setSortType('mobile')}
          >
            <Text style={[styles.sortText, { color: sortType === 'mobile' ? '#FFFFFF' : colors.textSecondary }]}>
              Mobile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortType === 'wifi' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSortType('wifi')}
          >
            <Text style={[styles.sortText, { color: sortType === 'wifi' ? colors.background : colors.textSecondary }]}>
              Wi-Fi
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sortedApps}
        renderItem={({ item }) => (
          <AppUsageRow
            displayName={item.display_name}
            packageName={item.package_name}
            iconUri={item.icon_uri}
            totalBytes={item.total_bytes}
            mobileBytes={item.mobile_bytes}
            wifiBytes={item.wifi_bytes}
            hotspotBytes={item.hotspot_bytes}
            onPress={() => navigation.navigate('AppDetail', { packageName: item.package_name })}
          />
        )}
        keyExtractor={(item) => item.package_name}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No network stats recorded for this date.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const calculateDailyUsageRatio = (
  date: string,
  mobile: number,
  hotspot: number
): number | undefined => {
  const capSetting = queries.getSetting('monthly_cap_bytes');
  const capBytes = capSetting ? parseInt(capSetting, 10) : 0;
  if (!capBytes || Number.isNaN(capBytes)) {
    return undefined;
  }

  const cycleDaySetting = queries.getSetting('billing_cycle_start_day');
  const cycleStartDay = cycleDaySetting ? parseInt(cycleDaySetting, 10) : 1;
  const [year, month, day] = date.split('-').map((part) => parseInt(part, 10));
  const viewedDate = new Date(year, month - 1, day);
  const { start, end } = budgetService.getBillingCycleRange(cycleStartDay, viewedDate);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const cycleDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / oneDayMs) + 1);
  const dailyMobilePace = capBytes / cycleDays;

  return dailyMobilePace > 0 ? (mobile + hotspot) / dailyMobilePace : undefined;
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sortTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 6,
  },
  sortText: {
    fontSize: 11,
    fontWeight: '700',
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
