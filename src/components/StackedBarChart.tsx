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
  const stackData = data.map((item) => {
    const mobileMb = item.mobile / (1024 * 1024);
    const wifiMb = item.wifi / (1024 * 1024);

    // Format X-axis to Mon, Tue, etc.
    const parts = item.date.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    // Mockup has Mobile (Purple) on bottom, Wi-Fi (Blue) on top
    return {
      stacks: [
        { value: mobileMb, color: '#8B5CF6', marginBottom: 2 }, // Mobile
        { value: wifiMb, color: '#2563EB' }, // Wi-Fi
      ],
      label: label,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <BarChart
          stackData={stackData}
          width={chartWidth}
          height={180}
          barWidth={24}
          spacing={screenWidth > 400 ? 32 : 24}
          noOfSections={4}
          barBorderRadius={12}
          initialSpacing={16}
          xAxisColor="transparent"
          yAxisColor="transparent"
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisLabelWidth={0}
          hideYAxisText
          xAxisLabelTextStyle={{ color: '#64748B', fontSize: 10, fontWeight: '600', textAlign: 'center' }}
          hideRules
          pointerConfig={{
            pointerStripHeight: 180,
            pointerStripColor: '#E2E8F0',
            pointerStripWidth: 2,
            pointerColor: '#8B5CF6',
            radius: 4,
            pointerLabelWidth: 90,
            pointerLabelHeight: 60,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: items => {
              if (!items || !items[0]) return null;
              
              // For StackedBarChart, items[0] usually contains the stacked data or total value.
              // We'll calculate the sum of the stacks to show the total for the day.
              let total = 0;
              if (items[0].stacks) {
                items[0].stacks.forEach(stack => { total += stack.value; });
              } else if (items[0].value) {
                total = items[0].value;
              }

              return (
                <View
                  style={{
                    backgroundColor: '#1E293B',
                    padding: 8,
                    borderRadius: 8,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text style={{color: '#F8FAFC', fontSize: 10, fontWeight: '700', marginBottom: 4}}>
                    {total.toFixed(1)} MB
                  </Text>
                  <Text style={{color: '#94A3B8', fontSize: 9}}>
                    Total Usage
                  </Text>
                </View>
              );
            },
          }}
        />
      </View>

      {/* Custom Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.legendLabel}>Mobile</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
          <Text style={styles.legendLabel}>Wi-Fi</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
    marginTop: 10,
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
    color: '#0F172A',
  },
});
