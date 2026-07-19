import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from './AppText';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';

interface WeekDataPoint {
  date: string;
  total: number;
}

interface WeekComparisonChartProps {
  thisWeek: WeekDataPoint[];
  lastWeek: WeekDataPoint[];
}

export const WeekComparisonChart: React.FC<WeekComparisonChartProps> = ({
  thisWeek,
  lastWeek,
}) => {
  const { colors, isDark } = useTheme();

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Map dates to day-of-week index (0 = Monday, 6 = Sunday)
  const getDayIndex = (dateStr: string): number => {
    const parts = dateStr.split('-');
    const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    // JS getDay() returns 0 for Sunday, 1 for Monday, etc.
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Map to 0-6 (Monday-Sunday)
  };

  // Pre-fill arrays for alignment
  const thisWeekAligned = Array(7).fill(null).map((_, i) => ({ value: 0, label: daysOfWeek[i] }));
  const lastWeekAligned = Array(7).fill(null).map((_, i) => ({ value: 0 }));

  // Populate this week values
  for (const item of thisWeek) {
    const idx = getDayIndex(item.date);
    if (idx >= 0 && idx < 7) {
      thisWeekAligned[idx].value = item.total / (1024 * 1024); // Convert to MB
    }
  }

  // Populate last week values
  for (const item of lastWeek) {
    const idx = getDayIndex(item.date);
    if (idx >= 0 && idx < 7) {
      lastWeekAligned[idx].value = item.total / (1024 * 1024); // Convert to MB
    }
  }

  // Slice "this week" to hide future days that haven't occurred yet (so line doesn't drop to 0)
  // Let's find how many days of this week have data (or what day it is today)
  const today = new Date();
  let todayIdx = today.getDay();
  todayIdx = todayIdx === 0 ? 6 : todayIdx - 1; // Monday=0, Sunday=6
  
  // Keep values up to todayIdx, and make the rest null or omit them so the line stops
  const filteredThisWeek = thisWeekAligned.map((item, idx) => {
    if (idx > todayIdx) {
      // Return value as undefined or hide it, gifted-charts allows hide
      return { ...item, value: 0, hideDataPoint: true }; 
    }
    return item;
  });

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 72;

  // Calculate efficiency
  let thisWeekSum = 0;
  let lastWeekSum = 0;
  thisWeekAligned.forEach(d => { thisWeekSum += d.value; });
  lastWeekAligned.forEach(d => { lastWeekSum += d.value; });
  
  // Averages (using 7 days for last week, and up to today for this week)
  const thisWeekAvg = (todayIdx + 1) > 0 ? thisWeekSum / (todayIdx + 1) : 0;
  const lastWeekAvg = lastWeekSum / 7;
  
  let efficiencyText = '0% more efficient';
  let isMoreEfficient = true;
  if (lastWeekAvg > 0) {
    const diff = lastWeekAvg - thisWeekAvg;
    const pct = (diff / lastWeekAvg) * 100;
    isMoreEfficient = pct >= 0;
    efficiencyText = `${isMoreEfficient ? '+' : ''}${pct.toFixed(0)}% ${isMoreEfficient ? 'more' : 'less'} efficient`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <LineChart
          data={filteredThisWeek}
          data2={lastWeekAligned}
          width={chartWidth}
          height={160}
          color={colors.accentTertiary}
          color2={colors.textMuted}
          thickness={4}
          thickness2={2}
          strokeDashArray2={[6, 6]}
          noOfSections={3}
          hideRules={false}
          rulesColor={colors.divider}
          rulesType="solid"
          yAxisColor="transparent"
          xAxisColor="transparent"
          yAxisThickness={0}
          xAxisThickness={0}
          hideYAxisText
          hideDataPoints
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}
          initialSpacing={10}
          endSpacing={10}
          adjustToWidth
          pointerConfig={{
            pointerStripHeight: 160,
            pointerStripColor: colors.divider,
            pointerStripWidth: 2,
            pointerColor: colors.accentTertiary,
            radius: 4,
            pointerLabelWidth: 80,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: items => {
              if (!items || !items[0]) return null;
              return (
                <View
                  style={{
                    backgroundColor: isDark ? colors.surfaceContainer : '#1E293B',
                    padding: 8,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: isDark ? colors.text : '#F8FAFC', fontSize: 10, fontWeight: '700', marginBottom: 4}}>
                    {items[0].value.toFixed(1)} MB
                  </Text>
                  <Text style={{color: isDark ? colors.textSecondary : '#94A3B8', fontSize: 9}}>
                    This Week
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={[styles.legendItem, { marginRight: 24 }]}>
          <View style={[styles.line, { backgroundColor: colors.textMuted, opacity: 0.8 }]} />
          <Text style={[styles.legendLabel, { color: colors.textMuted }]}>PREV. WEEK</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.line, { backgroundColor: colors.accentTertiary }]} />
          <Text style={[styles.legendLabel, { color: colors.accentTertiary }]}>THIS WEEK</Text>
        </View>
      </View>

      {/* Efficiency Summary Card */}
      <View style={[styles.efficiencyCard, { backgroundColor: colors.surfaceContainer }]}>
        <View style={[styles.efficiencyIconWrap, { backgroundColor: isMoreEfficient ? colors.accentSemiTrans : 'rgba(245, 158, 11, 0.16)' }]}>
          <Text style={[styles.efficiencyIcon, { color: isMoreEfficient ? colors.accent : colors.warning }]}>
            {isMoreEfficient ? 'UP' : 'DOWN'}
          </Text>
        </View>
        <View style={styles.efficiencyTextWrap}>
          <Text style={[styles.efficiencyTitle, { color: colors.text }]}>{efficiencyText}</Text>
          <Text style={[styles.efficiencySub, { color: colors.textSecondary }]}>
            Compared to last week's average daily spend.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  efficiencyCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  efficiencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  efficiencyIcon: {
    fontSize: 9,
    fontWeight: '900',
  },
  efficiencyTextWrap: {
    flex: 1,
  },
  efficiencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  efficiencySub: {
    fontSize: 11,
    lineHeight: 16,
  },
});
