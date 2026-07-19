import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface HourlyData {
  date: string;
  hour: number;
  total_bytes: number;
}

interface PeakUsageChartProps {
  data: HourlyData[];
}

export const PeakUsageChart: React.FC<PeakUsageChartProps> = ({ data }) => {
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Aggregate data into 6 buckets (4-hour blocks)
  const blocks = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0];
    const blockLabels = ['12am', '4am', '8am', '12pm', '4pm', '8pm'];
    
    data.forEach(item => {
      const blockIndex = Math.floor(item.hour / 4);
      if (blockIndex >= 0 && blockIndex < 6) {
        buckets[blockIndex] += item.total_bytes;
      }
    });

    const maxBytes = Math.max(...buckets, 1); // Avoid division by zero

    let busiestIndex = 0;
    let maxBucketVal = 0;
    buckets.forEach((val, idx) => {
      if (val > maxBucketVal) {
        maxBucketVal = val;
        busiestIndex = idx;
      }
    });

    const blockRanges = [
      '12:00 AM - 4:00 AM',
      '4:00 AM - 8:00 AM',
      '8:00 AM - 12:00 PM',
      '12:00 PM - 4:00 PM',
      '4:00 PM - 8:00 PM',
      '8:00 PM - 12:00 AM',
    ];

    return {
      buckets,
      maxBytes,
      busiestRange: blockRanges[busiestIndex],
      blockLabels
    };
  }, [data]);

  const activeBytes = activeIndex === null ? null : blocks.buckets[activeIndex];
  const hasData = blocks.buckets.some((value) => value > 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Peak Usage Hours Today</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            4-hour blocks from today's synced data
          </Text>
        </View>
        <View style={[styles.valuePill, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.valuePillText, { color: colors.accent }]}>
            {formatBytes(activeBytes ?? (hasData ? blocks.maxBytes : 0)).full}
          </Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {blocks.buckets.map((val, idx) => {
          const fillPercent = val === 0 ? 7 : Math.max((val / blocks.maxBytes) * 100, 12);
          const isActive = activeIndex === idx;
          
          return (
            <TouchableOpacity 
              key={idx} 
              style={styles.barColumn}
              activeOpacity={0.8}
              onPress={() => setActiveIndex(isActive ? null : idx)}
            >
              <View style={[styles.barBackground, { backgroundColor: isDark ? colors.surfaceContainer : '#EAF0F8' }]}>
                <View 
                  style={[
                    styles.barFill, 
                    {
                      height: `${fillPercent}%`,
                      backgroundColor: val > 0 ? colors.accent : colors.divider,
                      opacity: !hasData || val > 0 ? 1 : 0.5,
                    },
                    isActive && { backgroundColor: colors.accentSecondary }
                  ]} 
                />
              </View>
              <Text style={[styles.barLabel, { color: isActive ? colors.text : colors.textMuted }]}>
                {blocks.blockLabels[idx]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.summaryBox, { backgroundColor: colors.surfaceContainer }]}>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          <Text style={{color: colors.textSecondary}}>Busiest time: </Text>
          <Text style={{color: colors.accent, fontWeight: '800'}}>{blocks.busiestRange}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  valuePill: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 110,
  },
  valuePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  barColumn: {
    alignItems: 'center',
    width: 38,
  },
  barBackground: {
    height: 126,
    width: 44,
    borderRadius: 22,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    width: '100%',
    borderRadius: 22,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  summaryBox: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
