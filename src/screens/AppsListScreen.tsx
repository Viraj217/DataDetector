import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppsStackParamList } from '../navigation/types';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { formatBytes } from '../utils/formatBytes';
import { AppUsageRow } from '../components/AppUsageRow';
import { SkeletonLoader } from '../components/SkeletonLoader';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';
import { dateUtils } from '../utils/dateUtils';

type AppsListNavigationProp = NativeStackNavigationProp<AppsStackParamList, 'AppsHome'>;
type SortOption = 'total' | 'mobile' | 'wifi';

export const AppsListScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<AppsListNavigationProp>();

  // State
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('total');
  const [allApps, setAllApps] = useState<any[]>([]);

  const loadData = () => {
    setLoading(true);
    try {
      const todayStr = dateUtils.getLocalDateString();
      const apps = queries.getTopAppsTodayAggregated(todayStr, 100);
      setAllApps(apps);
    } catch (e) {
      console.error('[AppsListScreen] Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Filter & Sort
  const getFilteredAndSortedApps = () => {
    let result = allApps.filter((app) => {
      const name = (app.display_name || app.package_name).toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });

    if (sortOption === 'mobile') {
      result = result.sort((a, b) => b.mobile_bytes - a.mobile_bytes).filter((a) => a.mobile_bytes > 0);
    } else if (sortOption === 'wifi') {
      result = result.sort((a, b) => b.wifi_bytes - a.wifi_bytes).filter((a) => a.wifi_bytes > 0);
    } else {
      result = result.sort((a, b) => b.total_bytes - a.total_bytes);
    }

    return result;
  };

  const processedApps = getFilteredAndSortedApps();

  // Create Horizontal Chart data for top 5 apps
  const getChartData = () => {
    const top5 = processedApps.slice(0, 5);
    if (top5.length === 0) return [];
    
    return top5.map((app) => {
      let val = app.total_bytes;
      if (sortOption === 'mobile') val = app.mobile_bytes;
      else if (sortOption === 'wifi') val = app.wifi_bytes;
      
      const mbVal = val / (1024 * 1024);
      
      // Limit label characters for space
      const label = app.display_name || app.package_name;
      const shortLabel = label.length > 8 ? label.substring(0, 8) + '..' : label;

      let barColor = colors.accent;
      if (sortOption === 'mobile') barColor = colors.danger;

      return {
        value: mbVal,
        label: shortLabel,
        frontColor: barColor,
      };
    }).reverse(); // reverse for clean top-down rendering in horizontal chart
  };

  const chartData = getChartData();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 110;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
          <SkeletonLoader variant="card" style={{ height: 160, marginBottom: 24 }} />
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
      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
          <Path
            d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
            stroke={colors.textSecondary}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </Svg>
        <TextInput
          placeholder="Search installed apps..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Sorting bar */}
      <View style={styles.sortBar}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Stats</Text>
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortOption === 'total' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSortOption('total')}
          >
            <Text style={[styles.sortText, { color: sortOption === 'total' ? colors.background : colors.textSecondary }]}>
              Total
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortOption === 'mobile' && { backgroundColor: colors.danger },
            ]}
            onPress={() => setSortOption('mobile')}
          >
            <Text style={[styles.sortText, { color: sortOption === 'mobile' ? '#FFFFFF' : colors.textSecondary }]}>
              Mobile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortBtn,
              sortOption === 'wifi' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSortOption('wifi')}
          >
            <Text style={[styles.sortText, { color: sortOption === 'wifi' ? colors.background : colors.textSecondary }]}>
              Wi-Fi
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal rankings bar chart */}
      {chartData.length > 0 && (
        <Animated.View 
          style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={ZoomIn.springify()}
        >
          <Text style={[styles.chartTitle, { color: colors.textSecondary }]}>
            Top Rankings (MB)
          </Text>
          <View style={styles.chartWrapper}>
            <BarChart
              data={chartData}
              horizontal
              barWidth={16}
              spacing={20}
              width={chartWidth}
              height={140}
              initialSpacing={10}
              noOfSections={3}
              xAxisColor={colors.border}
              yAxisColor="transparent"
              xAxisThickness={1}
              yAxisThickness={0}
              hideRules
              yAxisLabelWidth={65}
              yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={processedApps}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <AppUsageRow
              displayName={item.display_name}
              packageName={item.package_name}
              iconUri={item.icon_uri}
              totalBytes={item.total_bytes}
              mobileBytes={item.mobile_bytes}
              wifiBytes={item.wifi_bytes}
              hotspotBytes={item.hotspot_bytes}
              index={index}
              onPress={() => navigation.navigate('AppDetail', { packageName: item.package_name })}
            />
          </Animated.View>
        )}
        keyExtractor={(item) => item.package_name}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No matching apps found.
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -16,
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
