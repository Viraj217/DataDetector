import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TodayStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { syncService } from '../services/syncService';
import { dateUtils } from '../utils/dateUtils';
import { formatBytes } from '../utils/formatBytes';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';
import { GlassCard } from '../components/GlassCard';
import { SkeletonLoader } from '../components/SkeletonLoader';

type HomeScreenNavigationProp = NativeStackNavigationProp<TodayStackParamList, 'TodayHome'>;

export const HomeScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [networkSplit, setNetworkSplit] = useState({ wifi: 0, mobile: 0, hotspot: 0 });
  const [topApps, setTopApps] = useState<any[]>([]);
  const [mobileLimit, setMobileLimit] = useState(10 * 1024 * 1024 * 1024); // 10 GB default
  const [wifiLimit, setWifiLimit] = useState(50 * 1024 * 1024 * 1024); // 50 GB default
  const [wifiAvgDaily, setWifiAvgDaily] = useState(0);
  const [wifiTrend, setWifiTrend] = useState(0);

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const mobCap = queries.getSetting('monthly_cap_bytes');
      if (mobCap) setMobileLimit(parseInt(mobCap, 10));
      
      const wfCap = queries.getSetting('wifi_cap_bytes');
      if (wfCap) setWifiLimit(parseInt(wfCap, 10));

      const todayStr = dateUtils.getLocalDateString();
      const splitRows = queries.getTodayTotalByNetworkType(todayStr);
      let wifi = 0, mobile = 0, hotspot = 0;
      for (const row of splitRows) {
        if (row.network_type === 'wifi') wifi = row.total_bytes;
        else if (row.network_type === 'mobile') mobile = row.total_bytes;
        else if (row.network_type === 'hotspot') hotspot = row.total_bytes;
      }
      setNetworkSplit({ wifi, mobile, hotspot });
      setTodayTotal(wifi + mobile + hotspot);
      
      const apps = queries.getTopAppsTodayAggregated(todayStr, 15);
      setTopApps(apps);

      const last14Days = queries.getDailyTotals(14, todayStr);
      let thisWeekWifi = 0;
      let lastWeekWifi = 0;
      let thisWeekDays = 0;
      let lastWeekDays = 0;

      const totalLen = last14Days.length;
      last14Days.forEach((day, index) => {
        if (index >= totalLen - 7) {
          thisWeekWifi += day.wifi;
          thisWeekDays++;
        } else {
          lastWeekWifi += day.wifi;
          lastWeekDays++;
        }
      });

      const avgDailyWifi = thisWeekDays > 0 ? thisWeekWifi / thisWeekDays : 0;
      const prevAvgDailyWifi = lastWeekDays > 0 ? lastWeekWifi / lastWeekDays : 0;
      let trend = 0;
      if (prevAvgDailyWifi > 0) {
        trend = ((avgDailyWifi - prevAvgDailyWifi) / prevAvgDailyWifi) * 100;
      }
      setWifiAvgDaily(avgDailyWifi);
      setWifiTrend(trend);
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
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingWrapper}>
           <SkeletonLoader variant="card" style={{ height: 180, marginBottom: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const mobileTotal = networkSplit.mobile + networkSplit.hotspot;
  const dailyMobileLimit = mobileLimit / 30;
  const dailyWifiLimit = wifiLimit / 30;
  const mobileUsageRatio = Math.min(mobileTotal / dailyMobileLimit, 1);
  const remainingMobile = Math.max(dailyMobileLimit - mobileTotal, 0);
  const remainingWifi = Math.max(dailyWifiLimit - networkSplit.wifi, 0);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTitleRow}>
        <View style={styles.headerLogoContainer}>
           <Text style={styles.headerLogoIcon}>📊</Text>
           <Text style={[styles.headerLogoText, { color: colors.accent }]}>DataDetector</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.headerRefreshBtn}>
          <Text style={{color: colors.accent, fontSize: 18}}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroWrapper}>
        <View>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Today's Usage</Text>
          <Text style={[styles.heroSubText, { color: colors.textSecondary }]}>You're on track to stay within your limits.</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.badgeText, { color: colors.accent }]}>{dateUtils.getLocalDateString(new Date()).slice(5).replace('-', ' ')}</Text>
        </View>
      </View>

      <View style={styles.circlesCol}>
        {/* Mobile Circle */}
        <Animated.View style={styles.circleCardWrapper} entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.circleCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.circleTitle, { color: colors.text }]}>Mobile Data</Text>
            
            <View style={[styles.chartWrapper, {
               shadowColor: '#6D28D9',
               shadowOffset: { width: 0, height: 12 },
               shadowOpacity: 0.25,
               shadowRadius: 16,
               elevation: 10,
               backgroundColor: colors.surface,
               borderRadius: 90,
            }]}>
              <PieChart
                donut
                radius={90}
                innerRadius={72}
                innerCircleColor={colors.surface}
                data={[{ value: mobileTotal, color: '#6D28D9' }, { value: remainingMobile, color: '#EDE9FE' }]}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={{fontSize: 20, color: '#6D28D9', fontWeight: '800', marginBottom: 2}}>{'(( A ))'}</Text>
                    <Text style={[styles.centerValue, { color: colors.text }]} numberOfLines={1}>{formatBytes(mobileTotal).value}</Text>
                    <Text style={[styles.centerUnit, { color: colors.textMuted }]}>{formatBytes(mobileTotal).unit} USED</Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Limit</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatBytes(dailyMobileLimit).full}</Text>
              </View>
              <View style={[styles.statBox, { alignItems: 'flex-end' }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Remaining</Text>
                <Text style={[styles.statValue, { color: '#6D28D9' }]}>{formatBytes(remainingMobile).full}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Wi-Fi Circle */}
        <Animated.View style={styles.circleCardWrapper} entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.circleCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.circleTitle, { color: colors.text }]}>Wi-Fi Usage</Text>
            
            <View style={[styles.chartWrapper, {
               shadowColor: '#0284C7',
               shadowOffset: { width: 0, height: 12 },
               shadowOpacity: 0.25,
               shadowRadius: 16,
               elevation: 10,
               backgroundColor: colors.surface,
               borderRadius: 90,
            }]}>
              <PieChart
                donut
                radius={90}
                innerRadius={72}
                innerCircleColor={colors.surface}
                data={[{ value: networkSplit.wifi, color: '#0284C7' }, { value: remainingWifi, color: '#E0F2FE' }]}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={{fontSize: 20, color: '#0284C7', fontWeight: '800', marginBottom: 2}}>{'((📶))'}</Text>
                    <Text style={[styles.centerValue, { color: colors.text }]} numberOfLines={1}>{formatBytes(networkSplit.wifi).value}</Text>
                    <Text style={[styles.centerUnit, { color: colors.textMuted }]}>{formatBytes(networkSplit.wifi).unit} USED</Text>
                  </View>
                )}
              />
            </View>

             <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Daily</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{formatBytes(wifiAvgDaily).full}</Text>
              </View>
              <View style={[styles.statBox, { alignItems: 'flex-end' }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Trend</Text>
                <Text style={[styles.statValue, { color: wifiTrend >= 0 ? colors.danger : '#0284C7' }]}>
                  {wifiTrend > 0 ? '📈' : '📉'} {wifiTrend > 0 ? '+' : ''}{wifiTrend.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.budgetRow}>
        <GlassCard style={styles.budgetCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <View>
              <Text style={[styles.budgetTitle, { color: colors.text }]}>Forecast</Text>
              <Text style={[styles.budgetSub, { color: colors.textSecondary }]}>End of cycle prediction</Text>
            </View>
            <View style={[styles.budgetIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
               <Text style={{fontSize: 16}}>📈</Text>
            </View>
          </View>
          
          <View style={styles.budgetProgressRow}>
            <Text style={[styles.budgetTotal, { color: colors.text }]}>{formatBytes(todayTotal).value}</Text>
            <Text style={[styles.budgetTotalUnit, { color: colors.textSecondary }]}>{formatBytes(todayTotal).unit} / {formatBytes(mobileLimit).full}</Text>
          </View>
          
          <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainer }]}>
             <LinearGradient 
               start={{x: 0, y: 0}} end={{x: 1, y: 0}} 
               colors={[colors.accent, colors.accentSecondary]} 
               style={[styles.progressBarFill, { width: `${Math.min((todayTotal / mobileLimit) * 100, 100)}%` }]} 
             />
          </View>

          <Text style={[styles.budgetFooterText, { color: colors.textSecondary }]}>
            You are projected to have <Text style={{color: colors.accentTertiary}}>{formatBytes(remainingMobile).full}</Text> remaining at the end of your billing cycle.
          </Text>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionBtn}>
           <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
             <Text style={{fontSize: 20}}>🛡️</Text>
           </View>
           <Text style={[styles.quickActionText, { color: colors.text }]}>Manage{"\n"}Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn}>
           <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
             <Text style={{fontSize: 20}}>⚡</Text>
           </View>
           <Text style={[styles.quickActionText, { color: colors.text }]}>Speed{"\n"}Monitor</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Apps Today</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
         {topApps.map((app, index) => (
           <Animated.View key={app.package_name} entering={FadeInRight.delay(400 + index * 50).springify()}>
              <TouchableOpacity onPress={() => navigation.navigate('AppDetail', { packageName: app.package_name })}>
                <View style={[styles.mockupAppCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.mockupAppIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                    {app.icon_uri ? (
                      <Image source={{ uri: app.icon_uri }} style={styles.mockupAppIcon} />
                    ) : (
                      <Text style={{fontSize: 20}}>📱</Text>
                    )}
                  </View>
                  <Text style={[styles.mockupAppName, { color: colors.text }]} numberOfLines={1}>{app.display_name || app.package_name}</Text>
                  <Text style={[styles.mockupAppBytes, { color: colors.textSecondary }]}>{formatBytes(app.total_bytes).full}</Text>
                </View>
              </TouchableOpacity>
           </Animated.View>
         ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.accent]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  loadingWrapper: { flex: 1, padding: 16 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingVertical: 8 },
  headerLogoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLogoIcon: { fontSize: 20 },
  headerLogoText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRefreshBtn: { padding: 4 },
  heroWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroTitle: { fontSize: 28, fontWeight: '800' },
  heroSubText: { fontSize: 13, marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  circlesCol: { flexDirection: 'column', marginBottom: 24, gap: 16 },
  circleCardWrapper: { flex: 1 },
  circleCard: { paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', overflow: 'hidden', borderRadius: 32, elevation: 2, shadowColor: '#9CA3AF', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 16 },
  circleTitle: { fontSize: 18, fontWeight: '800', marginBottom: 32, textAlign: 'center' },
  chartWrapper: { height: 180, width: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  centerLabel: { alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  centerValue: { fontSize: 36, fontWeight: '900', letterSpacing: -1.5 },
  centerUnit: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: '800' },
  budgetRow: { marginBottom: 24 },
  budgetCard: { padding: 24 },
  budgetTitle: { fontSize: 22, fontWeight: '700' },
  budgetSub: { fontSize: 13, marginBottom: 16 },
  budgetIconBg: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  budgetProgressRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  budgetTotal: { fontSize: 36, fontWeight: '800' },
  budgetTotalUnit: { fontSize: 14, marginLeft: 8, fontWeight: '600' },
  progressBarBg: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  budgetFooterText: { fontSize: 12, lineHeight: 18 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 32 },
  quickActionBtn: { alignItems: 'center' },
  quickActionIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  horizontalScroll: { gap: 16, paddingBottom: 16 },
  mockupAppCard: { width: 120, padding: 16, alignItems: 'center', borderRadius: 24, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8 },
  mockupAppIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  mockupAppIcon: { width: 32, height: 32, borderRadius: 8 },
  mockupAppName: { fontSize: 14, fontWeight: '700', marginBottom: 4, textAlign: 'center', width: '100%' },
  mockupAppBytes: { fontSize: 13, fontWeight: '600' },
});

export default HomeScreen;
