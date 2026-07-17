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
  const { colors } = useTheme();

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
  // We align the start so the final cell corresponds to today
  const totalCells = 91;
  const startDateOffset = totalCells - 1 - todayDayOfWeek;

  for (let i = totalCells - 1; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i + todayDayOfWeek);
    
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

  // Easing function for color mapping
  const getCellColor = (bytes: number) => {
    if (bytes === 0) return colors.card;
    const mb = bytes / (1024 * 1024);
    if (mb < 50) return 'rgba(0, 229, 160, 0.15)';   // Tier 1: < 50 MB (light teal)
    if (mb < 250) return 'rgba(0, 229, 160, 0.4)';   // Tier 2: < 250 MB (medium teal)
    if (mb < 1000) return colors.accent;             // Tier 3: < 1 GB (vibrant teal)
    if (mb < 3000) return colors.warning;            // Tier 4: < 3 GB (amber alert)
    return colors.danger;                            // Tier 5: > 3 GB (coral spike)
  };

  // Day labels
  const rowLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        Activity Intensity (Last 90 Days)
      </Text>
      
      <View style={styles.heatmapRow}>
        {/* Row Labels (S, M, W, F...) */}
        <View style={styles.labelsColumn}>
          {rowLabels.map((label, index) => (
            <Text key={index} style={[styles.rowLabel, { color: colors.textMuted }]}>
              {label}
            </Text>
          ))}
        </View>

        {/* Heatmap Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
          <View style={styles.gridContainer}>
            {columns.map((col, cIdx) => (
              <View key={cIdx} style={styles.gridColumn}>
                {col.map((cell, rIdx) => {
                  const cellColor = getCellColor(cell.bytes);
                  const isToday = cell.date === currentDateStr;
                  
                  return (
                    <TouchableOpacity
                      key={cell.date}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: cellColor,
                          borderColor: isToday ? '#FFFFFF' : 'transparent',
                          borderWidth: isToday ? 1 : 0,
                        },
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

      {/* Color Scale Legend */}
      <View style={styles.legendRow}>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
        <View style={[styles.legendBox, { backgroundColor: colors.card }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(0, 229, 160, 0.15)' }]} />
        <View style={[styles.legendBox, { backgroundColor: 'rgba(0, 229, 160, 0.4)' }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.accent }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.warning }]} />
        <View style={[styles.legendBox, { backgroundColor: colors.danger }]} />
        <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelsColumn: {
    justifyContent: 'space-between',
    height: 104, // 7 * 12px cell + 6 * 3px gap
    marginRight: 8,
    paddingVertical: 2,
  },
  rowLabel: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridScroll: {
    paddingRight: 10,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  gridColumn: {
    flexDirection: 'column',
    marginHorizontal: 1.5,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginVertical: 1.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
