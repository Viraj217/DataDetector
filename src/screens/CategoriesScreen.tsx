import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text } from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { formatBytes } from '../utils/formatBytes';
import { dateUtils } from '../utils/dateUtils';
import { haptics } from '../utils/haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import { Smartphone, Wifi } from 'lucide-react-native';

// Custom Category Icon mapping using SVG
const CategoryIcon: React.FC<{ category: string; size: number; color: string }> = ({ category, size, color }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {category === 'game' && (
        <Path d="M6 12H10M8 10V14M15 11C15 11.5523 15.4477 12 16 12C16.5523 12 17 11.5523 17 11M17 13C17 13.5523 17.4477 14 18 14C18.5523 14 19 13.5523 19 13M21 7H3C1.89543 7 1 7.89543 1 9V17C1 18.1046 1.89543 19 3 19H21C22.1046 19 23 18.1046 23 17V9C23 7.89543 22.1046 7 21 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'audio' && (
        <Path d="M9 18V5L21 3V16M9 18C9 19.6569 7.20914 21 5 21C2.79086 21 1 19.6569 1 18C1 16.3431 2.79086 15 5 15C7.20914 15 9 16.3431 9 18ZM21 16C21 17.6569 19.2091 19 17 19C14.7909 19 13 17.6569 13 16C13 14.3431 14.7909 13 17 13C19.2091 13 21 14.3431 21 16Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'video' && (
        <Path d="M23 7L16 12L23 17V7Z M1 5H15V19H1V5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'image' && (
        <Path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM5 17L8.5 12.5L11 15.5L14.5 11L19 17H5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'social' && (
        <Path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21 M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11ZM23 21V19C23 17.166 21.8427 15.6026 20.2183 15.0681M16 3.13C17.72 3.65 19 5.17 19 7C19 8.83 17.72 10.35 16 10.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'news' && (
        <Path d="M4 4H20 M4 8H20 M4 12H12 M4 16H12 M4 20H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      )}
      {category === 'maps' && (
        <Path d="M1 6V22L8 18L16 22L23 18V2L16 6L8 2L1 6Z M8 2V18 M16 6V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'productivity' && (
        <Path d="M9 11L12 14L22 4 M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {category === 'system' && (
        <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z M19.4 15A1.65 1.65 0 0 0 20 16.3A1.65 1.65 0 0 1 18.3 18H18.2A1.65 1.65 0 0 0 16.9 18.6A1.65 1.65 0 0 1 14.6 18.6L14.5 18.5A1.65 1.65 0 0 0 13.2 17.9A1.65 1.65 0 0 1 12 16.2V16.1A1.65 1.65 0 0 0 10.7 14.8A1.65 1.65 0 0 1 9.4 15M4.6 9A1.65 1.65 0 0 0 4 7.7A1.65 1.65 0 0 1 5.7 6H5.8A1.65 1.65 0 0 0 7.1 5.4A1.65 1.65 0 0 1 9.4 5.4L9.5 5.5A1.65 1.65 0 0 0 10.8 6.1A1.65 1.65 0 0 1 12 7.8V7.9A1.65 1.65 0 0 0 13.3 9.2A1.65 1.65 0 0 1 14.6 9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      )}
      {category === 'other' && (
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      )}
    </Svg>
  );
};

export const CategoriesScreen: React.FC = () => {
  const { colors } = useTheme();
  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    try {
      const todayStr = dateUtils.getLocalDateString();
      const categories = queries.getCategoryBreakdown(todayStr);
      
      const fullData = categories.map((cat) => {
        const topApp = queries.getTopAppInCategory(todayStr, cat.category);
        return {
          ...cat,
          topAppName: topApp ? topApp.display_name : 'None',
          topAppBytes: topApp ? topApp.total_bytes : 0,
        };
      });

      setCategoriesData(fullData);
    } catch (e) {
      console.error('[CategoriesScreen] Failed to load data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    haptics.light();
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  const renderCategoryItem = ({ item, index }: { item: any; index: number }) => {
    const formattedTotal = formatBytes(item.total_bytes);
    const formattedMobile = formatBytes(item.mobile_bytes);
    const formattedWifi = formatBytes(item.wifi_bytes);

    const total = item.mobile_bytes + item.wifi_bytes;
    const mobilePercent = total > 0 ? (item.mobile_bytes / total) * 100 : 0;
    const wifiPercent = total > 0 ? (item.wifi_bytes / total) * 100 : 0;

    return (
      <Animated.View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        entering={FadeInDown.delay(Math.min(index * 25, 100)).duration(180)}
      >
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.accentSemiTrans }]}>
            <CategoryIcon category={item.category} size={24} color={colors.accent} />
          </View>
          <View style={styles.titleWrapper}>
            <Text style={[styles.categoryName, { color: colors.text }]}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
            <Text style={[styles.appCount, { color: colors.textSecondary }]}>
              {item.app_count} app{item.app_count !== 1 ? 's' : ''} active today
            </Text>
          </View>
          <View style={styles.totalWrapper}>
            <Text style={[styles.totalText, { color: colors.text }]}>{formattedTotal.value}</Text>
            <Text style={[styles.unitText, { color: colors.accent }]}>{formattedTotal.unit}</Text>
          </View>
        </View>

        {/* Progress Bar Split */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBase, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.danger, width: `${mobilePercent}%` },
              ]}
            />
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.accent, width: `${wifiPercent}%` },
              ]}
            />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Smartphone size={12} color={colors.textMuted} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>
                Mobile: {formattedMobile.full} ({mobilePercent.toFixed(0)}%)
              </Text>
            </View>
            <View style={styles.legendItem}>
              <Wifi size={12} color={colors.textMuted} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>
                WiFi: {formattedWifi.full} ({wifiPercent.toFixed(0)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Top App Row */}
        {item.topAppName !== 'None' && (
          <View style={[styles.topAppContainer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.topAppLabel, { color: colors.textSecondary }]}>Top App:</Text>
            <Text style={[styles.topAppName, { color: colors.text }]} numberOfLines={1}>
              {item.topAppName}
            </Text>
            <Text style={[styles.topAppUsage, { color: colors.textMuted }]}>
              ({formatBytes(item.topAppBytes).full})
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={categoriesData}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.accent]} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No usage categories recorded today.
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  appCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalText: {
    fontSize: 20,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 2,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBase: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  topAppContainer: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topAppLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  topAppName: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  topAppUsage: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CategoriesScreen;
