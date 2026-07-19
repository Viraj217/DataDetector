import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './AppText';
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

const MIN_BAR_HEIGHT = 8;
const MAX_BAR_HEIGHT = 170;

export const StackedBarChart: React.FC<StackedBarChartProps> = ({ data }) => {
  const { colors } = useTheme();

  const chartData = useMemo(() => {
    const rows = data.map((item) => {
      const total = item.mobile + item.wifi + item.hotspot;
      const dateParts = item.date.split('-');
      const dateObj = new Date(
        parseInt(dateParts[0], 10),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[2], 10)
      );

      return {
        ...item,
        total,
        label: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        shortDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });

    const maxTotal = Math.max(...rows.map((row) => row.total), 1);
    const totalBytes = rows.reduce((sum, row) => sum + row.total, 0);

    return { rows, maxTotal, totalBytes };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.placeholderContainer, { borderColor: colors.border }]}>
        <Text style={{ color: colors.textSecondary }}>No historical data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total in range</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>
            {formatBytes(chartData.totalBytes).full}
          </Text>
        </View>
        <Text style={[styles.summaryHint, { color: colors.textMuted }]}>Mobile, Wi-Fi, Hotspot</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScroll}
      >
        {chartData.rows.map((item) => {
          const totalHeight = Math.max((item.total / chartData.maxTotal) * MAX_BAR_HEIGHT, item.total > 0 ? MIN_BAR_HEIGHT : 0);
          const mobileHeight = item.total > 0 ? (item.mobile / item.total) * totalHeight : 0;
          const wifiHeight = item.total > 0 ? (item.wifi / item.total) * totalHeight : 0;
          const hotspotHeight = item.total > 0 ? (item.hotspot / item.total) * totalHeight : 0;

          return (
            <View key={item.date} style={styles.dayColumn}>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceContainer }]}>
                <View
                  style={[
                    styles.segment,
                    {
                      height: wifiHeight,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.segment,
                    {
                      height: mobileHeight,
                      backgroundColor: colors.accentTertiary,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.segment,
                    {
                      height: hotspotHeight,
                      backgroundColor: colors.warning,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{item.label}</Text>
              <Text style={[styles.dateLabel, { color: colors.textMuted }]}>{item.shortDate}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.legendContainer}>
        <LegendDot color={colors.accentTertiary} label="Mobile" textColor={colors.textSecondary} />
        <LegendDot color={colors.accent} label="Wi-Fi" textColor={colors.textSecondary} />
        <LegendDot color={colors.warning} label="Hotspot" textColor={colors.textSecondary} />
      </View>
    </View>
  );
};

const LegendDot: React.FC<{ color: string; label: string; textColor: string }> = ({
  color,
  label,
  textColor,
}) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={[styles.legendLabel, { color: textColor }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryHint: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  chartScroll: {
    alignItems: 'flex-end',
    paddingTop: 4,
    paddingRight: 8,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 18,
    width: 34,
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    width: 30,
    borderRadius: 15,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  segment: {
    width: '100%',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 10,
  },
  dateLabel: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
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
    marginHorizontal: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
});
