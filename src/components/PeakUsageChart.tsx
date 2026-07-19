import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

interface HourlyData {
  date: string;
  hour: number;
  total_bytes: number;
}

interface PeakUsageChartProps {
  data: HourlyData[];
}

export const PeakUsageChart: React.FC<PeakUsageChartProps> = ({ data }) => {
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
      '12:00 AM — 4:00 AM',
      '4:00 AM — 8:00 AM',
      '8:00 AM — 12:00 PM',
      '12:00 PM — 4:00 PM',
      '4:00 PM — 8:00 PM',
      '8:00 PM — 12:00 AM',
    ];

    return {
      buckets,
      maxBytes,
      busiestRange: blockRanges[busiestIndex],
      blockLabels
    };
  }, [data]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: '#0F172A' }]}>Peak Usage Hours</Text>

      <View style={styles.chartArea}>
        {blocks.buckets.map((val, idx) => {
          // Calculate height percentage (min 10% so it's always visible)
          const fillPercent = val === 0 ? 10 : Math.max((val / blocks.maxBytes) * 100, 10);
          const isActive = activeIndex === idx;
          
          return (
            <TouchableOpacity 
              key={idx} 
              style={styles.barColumn}
              activeOpacity={0.8}
              onPress={() => setActiveIndex(isActive ? null : idx)}
            >
              {/* Tooltip Bubble */}
              {isActive && (
                <View style={styles.tooltipBubble}>
                  <Text style={styles.tooltipVal}>{(val / (1024 * 1024)).toFixed(1)}</Text>
                  <Text style={styles.tooltipUnit}>MB</Text>
                  <View style={styles.tooltipTail} />
                </View>
              )}

              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill, 
                    { height: `${fillPercent}%` },
                    isActive && { backgroundColor: '#4F46E5' } // slightly darker when active
                  ]} 
                />
              </View>
              <Text style={[styles.barLabel, isActive && { color: '#0F172A', fontWeight: '800' }]}>
                {blocks.blockLabels[idx]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          <Text style={{color: '#475569'}}>Busiest time: </Text>
          <Text style={{color: '#6D28D9', fontWeight: '800'}}>{blocks.busiestRange}</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 24,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    width: 32,
    zIndex: 1, // required for tooltips to overlap correctly
  },
  barBackground: {
    height: 140,
    width: 36,
    backgroundColor: '#F1F5F9', // light grey/blue pill
    borderRadius: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#6366F1', // Indigo pill color from mockup
    borderRadius: 18,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tooltipBubble: {
    position: 'absolute',
    top: -45, // Hover above the bar
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 10,
    width: 60,
  },
  tooltipVal: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 2,
  },
  tooltipUnit: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  tooltipTail: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E293B',
  },
  summaryBox: {
    alignItems: 'center',
    marginTop: 8,
  },
  summaryText: {
    fontSize: 12,
  },
});
