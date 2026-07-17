import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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
  const { colors } = useTheme();

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

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Week Comparison (MB)
      </Text>

      <View style={styles.chartWrapper}>
        <LineChart
          data={filteredThisWeek}
          data2={lastWeekAligned}
          width={chartWidth}
          height={140}
          color={colors.accent}
          color2={colors.textMuted}
          thickness={2.5}
          thickness2={1.5}
          noOfSections={3}
          hideRules
          yAxisColor="transparent"
          xAxisColor={colors.border}
          yAxisThickness={0}
          xAxisThickness={1}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9, fontWeight: '600' }}
          hideDataPoints={false}
          dataPointsColor={colors.accent}
          dataPointsColor2="transparent"
          dataPointsRadius={4}
          initialSpacing={15}
          adjustToWidth
        />
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.line, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>This Week</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.line, { backgroundColor: colors.textMuted, height: 1.5 }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Last Week</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  line: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
