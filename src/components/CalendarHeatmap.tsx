import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './AppText';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface HeatmapDay {
  date: string;
  total_bytes: number;
}

interface CalendarHeatmapProps {
  data: HeatmapDay[];
  currentDateStr: string;
  onPressDay: (date: string) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const LEVELS = [0.16, 0.34, 0.56, 0.78];

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map((part) => parseInt(part, 10));
  return new Date(year, month - 1, day);
};

const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  currentDateStr,
  onPressDay,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState<{ date: string; bytes: number } | null>(null);

  const {
    columns,
    maxBytes,
    totalBytes,
    activeDays,
    monthLabels,
  } = useMemo(() => {
    const dataMap = new Map<string, number>();
    let peakBytes = 0;
    let total = 0;
    let active = 0;

    for (const item of data) {
      dataMap.set(item.date, item.total_bytes);
      peakBytes = Math.max(peakBytes, item.total_bytes);
      total += item.total_bytes;
      if (item.total_bytes > 0) {
        active += 1;
      }
    }

    const today = parseLocalDate(currentDateStr);
    const daysUntilSaturday = 6 - today.getDay();
    const daysArray: { date: string; bytes: number; isToday: boolean; isFuture: boolean }[] = [];

    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i + daysUntilSaturday);
      const dateStr = toLocalDateString(date);
      daysArray.push({
        date: dateStr,
        bytes: dataMap.get(dateStr) || 0,
        isToday: dateStr === currentDateStr,
        isFuture: dateStr > currentDateStr,
      });
    }

    const groupedColumns: typeof daysArray[] = [];
    for (let c = 0; c < 13; c++) {
      groupedColumns.push(daysArray.slice(c * 7, c * 7 + 7));
    }

    const labels = groupedColumns.map((column, index) => {
      const firstRealDay = column.find((day) => !day.isFuture);
      if (!firstRealDay) {
        return '';
      }

      const date = parseLocalDate(firstRealDay.date);
      if (index === 0 || date.getDate() <= 7) {
        return date.toLocaleDateString('en-US', { month: 'short' });
      }

      return '';
    });

    return {
      columns: groupedColumns,
      maxBytes: Math.max(peakBytes, 1),
      totalBytes: total,
      activeDays: active,
      monthLabels: labels,
    };
  }, [currentDateStr, data]);

  const getCellColor = (bytes: number, isFuture: boolean) => {
    if (isFuture) {
      return isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.035)';
    }

    if (bytes <= 0) {
      return isDark ? 'rgba(255,255,255,0.07)' : '#EEF2F7';
    }

    const intensity = bytes / maxBytes;
    if (intensity <= LEVELS[0]) return isDark ? '#1E3A5F' : '#DBEAFE';
    if (intensity <= LEVELS[1]) return isDark ? '#1D4F7A' : '#93C5FD';
    if (intensity <= LEVELS[2]) return isDark ? '#2563EB' : '#3B82F6';
    if (intensity <= LEVELS[3]) return isDark ? '#F59E0B' : '#F59E0B';
    return colors.danger;
  };

  const handlePressCell = (date: string, bytes: number, isFuture: boolean) => {
    if (isFuture) {
      return;
    }

    setSelectedDay({ date, bytes });
    onPressDay(date);
  };

  const selectedSummary = selectedDay
    ? `${selectedDay.date} - ${formatBytes(selectedDay.bytes).full}`
    : `${activeDays} active days - ${formatBytes(totalBytes).full} total`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Activity Intensity</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Last 90 days by total usage</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.summaryPillText, { color: colors.accent }]}>
            {formatBytes(totalBytes).full}
          </Text>
        </View>
      </View>

      <View style={styles.monthRow}>
        <View style={styles.dayLabelSpacer} />
        {monthLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={[styles.monthLabel, { color: colors.textMuted }]}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.heatmapRow}>
        <View style={styles.dayLabelsColumn}>
          {DAY_LABELS.map((label, index) => (
            <Text key={`${label}-${index}`} style={[styles.dayLabel, { color: colors.textMuted }]}>
              {label}
            </Text>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridScroll}>
          <View style={styles.gridContainer}>
            {columns.map((column, columnIndex) => (
              <View key={columnIndex} style={styles.gridColumn}>
                {column.map((cell) => {
                  const isSelected = selectedDay?.date === cell.date;
                  const borderColor = cell.isToday
                    ? colors.accent
                    : isSelected
                      ? colors.text
                      : 'transparent';

                  return (
                    <TouchableOpacity
                      key={cell.date}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: getCellColor(cell.bytes, cell.isFuture),
                          borderColor,
                          opacity: cell.isFuture ? 0.45 : 1,
                        },
                      ]}
                      disabled={cell.isFuture}
                      onPress={() => handlePressCell(cell.date, cell.bytes, cell.isFuture)}
                      activeOpacity={0.72}
                      accessibilityRole="button"
                      accessibilityLabel={`${cell.date}, ${formatBytes(cell.bytes).full}`}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={[styles.detailRow, { borderTopColor: colors.divider }]}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{selectedSummary}</Text>
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
          {[0, 0.2, 0.42, 0.65, 0.9].map((ratio) => (
            <View
              key={ratio}
              style={[
                styles.legendBox,
                { backgroundColor: getCellColor(ratio * maxBytes, false) },
              ]}
            />
          ))}
          <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
        </View>
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
    marginBottom: 18,
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
  summaryPill: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  monthRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayLabelSpacer: {
    width: 22,
  },
  monthLabel: {
    width: 20,
    marginHorizontal: 3,
    fontSize: 9,
    fontWeight: '700',
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dayLabelsColumn: {
    width: 22,
    paddingTop: 1,
  },
  dayLabel: {
    height: 17,
    marginVertical: 2,
    fontSize: 9,
    fontWeight: '800',
    textAlignVertical: 'center',
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
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    marginVertical: 2,
  },
  detailRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  legendBox: {
    width: 11,
    height: 11,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});
