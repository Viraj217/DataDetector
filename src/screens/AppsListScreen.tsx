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
import { haptics } from '../utils/haptics';
import { CategoriesScreen } from './CategoriesScreen';

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
  const [viewMode, setViewMode] = useState<'list' | 'categories'>('list');

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
      const shortLabel = label.length > 12 ? label.substring(0, 12) + '..' : label;

      let barColor = colors.accent;
      if (sortOption === 'mobile') barColor = colors.danger;

      return {
        value: mbVal,
        label: shortLabel,
        frontColor: barColor,
      };
    }); // Render largest on top
  };

  const chartData = getChartData();
  
  // Calculate maxValue adding 20% padding so the largest bar doesn't overflow the value text
  const maxDataValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0;
  const chartMaxValue = maxDataValue > 0 ? maxDataValue * 1.2 : 100;

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
            onPress={() => { haptics.selection(); setSortOption('total'); }}
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
            onPress={() => { haptics.selection(); setSortOption('mobile'); }}
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
            onPress={() => { haptics.selection(); setSortOption('wifi'); }}
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
          <Text style={[styles.chartTitle, { color: colors.textSecondary, marginBottom: 16 }]}>
            Top Rankings (MB)
          </Text>
          <View style={{ paddingRight: 8 }}>
            {chartData.map((item, index) => {
              const widthPercentage = chartMaxValue > 0 ? (item.value / chartMaxValue) * 100 : 0;
              return (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Text 
                    numberOfLines={1} 
                    style={{ width: 85, textAlign: 'right', marginRight: 12, fontSize: 11, fontWeight: '600', color: colors.textSecondary }}
                  >
                    {item.label}
                  </Text>
                  <View style={{ flex: 1, borderLeftWidth: 1, borderLeftColor: colors.border, paddingVertical: 2, paddingLeft: 8, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View 
                        style={{ 
                          height: 16, 
                          width: `${widthPercentage}%`, 
                          backgroundColor: item.frontColor,
                          borderRadius: 4,
                          minWidth: 4,
                        }} 
                      />
                      <Text style={{ marginLeft: 8, fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                        {item.value >= 1 ? item.value.toFixed(1) : item.value.toFixed(2)} MB
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Segmented Controller Tab Bar */}
      <View style={[styles.toggleBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.toggleTab,
            viewMode === 'list' && { borderBottomColor: colors.accent },
          ]}
          onPress={() => { haptics.selection(); setViewMode('list'); }}
        >
          <Text style={[styles.toggleTabText, { color: viewMode === 'list' ? colors.accent : colors.textSecondary }]}>
            App List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleTab,
            viewMode === 'categories' && { borderBottomColor: colors.accent },
          ]}
          onPress={() => { haptics.selection(); setViewMode('categories'); }}
        >
          <Text style={[styles.toggleTabText, { color: viewMode === 'categories' ? colors.accent : colors.textSecondary }]}>
            Categories
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'categories' ? (
        <CategoriesScreen />
      ) : (
        <FlatList
          data={processedApps}
          renderItem={({ item, index }) => (
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
          )}
          keyExtractor={(item) => item.package_name}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
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
      )}
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
  toggleBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  toggleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  toggleTabText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
