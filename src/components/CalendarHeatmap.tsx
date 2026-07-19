import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface HeatmapDay {
  date: string;
  total_bytes: number;
}

interface CalendarHeatmapProps {
  data: HeatmapDay[]; // already sorted oldest to newest
  currentDateStr: string;
  onPressDay: (date: string) => void;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  currentDateStr,
  onPressDay,
}) => {
  const { colors, isDark } = useTheme();

  // Create a map of date -> total_bytes for fast lookup
  const dataMap = new Map<string, number>();
  for (const item of data) {
    dataMap.set(item.date, item.total_bytes);
  }

  // Generate 91 days (13 weeks * 7 days) ending today
  const totalDaysNeeded = 91;
  const daysArray: { date: string; bytes: number }[] = [];
  const baseDate = new Date();

  // Find the closest preceding Sunday to align the grid nicely
  // so the first row is always Sunday
  const todayDayOfWeek = baseDate.getDay();
  // We want the total grid size to be 13 columns * 7 days = 91 cells
  // We align the start so the final cell corresponds to Saturday of the current week
  const totalCells = 91;
  const daysUntilSaturday = 6 - todayDayOfWeek;

  for (let i = totalCells - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i + daysUntilSaturday);
    
    // Format YYYY-MM-DD
    const offset = d.getTimezoneOffset();
    const localD = new Date(d.getTime() - offset * 60 * 1000);
    const dateStr = localD.toISOString().split('T')[0];
    
    const bytes = dataMap.get(dateStr) || 0;
    daysArray.push({ date: dateStr, bytes });
  }

  // Group into 13 columns of 7 days
  const columns: { date: string; bytes: number }[][] = [];
  for (let c = 0; c < 13; c++) {
    const col: { date: string; bytes: number }[] = [];
    for (let r = 0; r < 7; r++) {
      const idx = c * 7 + r;
      if (idx < daysArray.length) {
        col.push(daysArray[idx]);
      }
    }
    columns.push(col);
  }

  // Easing function for color mapping (matching mockup purple scale)
  const getCellColor = (bytes: number) => {
    if (bytes === 0) return '#F3F4F6'; // very light grey/purple
    const mb = bytes / (1024 * 1024);
    if (mb < 50) return '#EDE9FE';
    if (mb < 250) return '#C4B5FD';
    if (mb < 1000) return '#8B5CF6';
    return '#6D28D9'; // max intensity
  };

  const totalBytes = data.reduce((sum, item) => sum + item.total_bytes, 0);

  // Day labels
  const rowLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: '#0F172A' }]}>Activity Intensity</Text>
        <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '600' }}>Last 90 Days</Text>
      </View>
      
      <View style={styles.heatmapRow}>
        {/* Heatmap Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
          <View style={styles.gridContainer}>
            {columns.map((col, cIdx) => (
              <View key={cIdx} style={styles.gridColumn}>
                {col.map((cell, rIdx) => {
                  const cellColor = getCellColor(cell.bytes);
                  
                  return (
                    <TouchableOpacity
                      key={cell.date}
                      style={[
                        styles.cell,
                        { backgroundColor: cellColor }
                      ]}
                      onPress={() => onPressDay(cell.date)}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Footer / Legend */}
      <View style={styles.footerRow}>
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: '#64748B' }]}>Less</Text>
          <View style={[styles.legendBox, { backgroundColor: '#EDE9FE' }]} />
          <View style={[styles.legendBox, { backgroundColor: '#C4B5FD' }]} />
          <View style={[styles.legendBox, { backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.legendBox, { backgroundColor: '#6D28D9' }]} />
          <Text style={[styles.legendText, { color: '#64748B' }]}>More</Text>
        </View>
        <Text style={styles.totalText}>{formatBytes(totalBytes).full} Total</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridScroll: {
    paddingRight: 10,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  gridColumn: {
    flexDirection: 'column',
    marginHorizontal: 3,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginVertical: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  totalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8B5CF6',
  },
});
