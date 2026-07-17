import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface DailyTotalRow {
  date: string;
  mobile: number;
  wifi: number;
  hotspot: number;
}

interface StackedBarChartProps {
  data: DailyTotalRow[];
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data }) => {
  const { colors } = useTheme();

  // If no data, show placeholder
  if (!data || data.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={{ color: colors.textSecondary }}>No historical data available.</Text>
      </View>
    );
  }

  // Format data for gifted-charts Stacked Bar Chart
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 72; // Padding margins

  // Find max value for scaling y-axis labels
  let maxDaySum = 0;
  const stackData = data.map((item) => {
    const mobileMb = item.mobile / (1024 * 1024);
    const wifiMb = item.wifi / (1024 * 1024);
    const hotspotMb = item.hotspot / (1024 * 1024);
    const daySum = mobileMb + wifiMb + hotspotMb;
    
    if (daySum > maxDaySum) {
      maxDaySum = daySum;
    }

    // Short date formatting, e.g. "16 Jul"
    const parts = item.date.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const label = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    return {
      stacks: [
        { value: wifiMb, color: colors.accent },
        { value: mobileMb, color: colors.danger },
        { value: hotspotMb, color: colors.warning },
      ],
      label: label,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Daily Usage Stacked (MB)
      </Text>
      
      <View style={styles.chartWrapper}>
        <BarChart
          stackData={stackData}
          width={chartWidth}
          height={180}
          barWidth={14}
          spacing={24}
          noOfSections={4}
          barBorderRadius={4}
          initialSpacing={16}
          xAxisColor={colors.border}
          yAxisColor="transparent"
          xAxisThickness={1}
          yAxisThickness={0}
          yAxisLabelWidth={40}
          yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
          xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' }}
          hideRules
        />
      </View>

      {/* Custom Legend */}
      <View style={styles.legendContainer}>
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
  placeholderContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
});
