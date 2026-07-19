import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface HourlyHeatmapGridProps {
  // Array of records for last 7 days
  data: { date: string; hour: number; total_bytes: number }[];
}

export const HourlyHeatmapGrid: React.FC<HourlyHeatmapGridProps> = ({ data }) => {
  const { colors, isDark } = useTheme();
  const [selectedCell, setSelectedCell] = useState<{ date: string; hour: number; bytes: number } | null>(null);

  // Generate lists of last 7 dates and 24 hours
  const datesSet = new Set(data.map((d) => d.date));
  const dates = Array.from(datesSet).sort(); // chronological

  if (dates.length === 0) {
    // Fallback if no dates yet
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Map data to quick lookup grid: key: date_hour -> total_bytes
  const gridMap = new Map<string, number>();
  let maxBytes = 1; // avoid divide by zero

  for (const item of data) {
    const key = `${item.date}_${item.hour}`;
    gridMap.set(key, item.total_bytes);
    if (item.total_bytes > maxBytes) {
      maxBytes = item.total_bytes;
    }
  }

  const getCellOpacity = (bytes: number): number => {
    if (!bytes || bytes === 0) return 0.05;
    // Map to scale between 0.15 and 1.0 based on usage intensity
    return 0.15 + (bytes / maxBytes) * 0.85;
  };

  const getFormatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getFormatHour = (hr: number) => {
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hour12 = hr % 12 === 0 ? 12 : hr % 12;
    return `${hour12}${ampm}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Peak Usage Hours (Last 7 Days)</Text>

      {/* Grid Container with Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.gridContainer}>
          {/* Hour labels row */}
          <View style={styles.hoursHeaderRow}>
            <View style={styles.yLabelPlaceholder} />
            {hours.map((hour) => (
              <View key={hour} style={styles.xLabelWrapper}>
                {hour % 3 === 0 ? (
                  <Text style={[styles.xLabel, { color: colors.textMuted }]}>
                    {getFormatHour(hour)}
                  </Text>
                ) : (
                  <View style={styles.dotSeparator} />
                )}
              </View>
            ))}
          </View>

          {/* Grid rows (dates) */}
          {dates.map((date) => (
            <View key={date} style={styles.gridRow}>
              {/* Day label */}
              <View style={styles.yLabelWrapper}>
                <Text style={[styles.yLabel, { color: colors.textSecondary }]}>
                  {getFormatDay(date)}
                </Text>
              </View>

              {/* Hour cells */}
              {hours.map((hour) => {
                const key = `${date}_${hour}`;
                const bytes = gridMap.get(key) || 0;
                const opacity = getCellOpacity(bytes);

                return (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: bytes > 0 ? colors.accent : (isDark ? colors.surfaceContainer : '#D1D5DB'),
                        opacity: bytes > 0 ? opacity : 1,
                        borderColor: selectedCell?.date === date && selectedCell?.hour === hour ? colors.text : (isDark ? colors.border : '#9CA3AF'),
                      },
                    ]}
                    onPress={() => setSelectedCell({ date, hour, bytes })}
                    activeOpacity={0.8}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Tooltip detail */}
      <View style={[styles.tooltipContainer, { borderTopColor: colors.divider }]}>
        {selectedCell ? (
          <View style={styles.tooltipContent}>
            <Text style={[styles.tooltipLabel, { color: colors.textSecondary }]}>
              {getFormatDay(selectedCell.date)}, {selectedCell.date} @ {getFormatHour(selectedCell.hour)}:
            </Text>
            <Text style={[styles.tooltipVal, { color: colors.text }]}>
              {formatBytes(selectedCell.bytes).full}
            </Text>
          </View>
        ) : (
          <Text style={[styles.tooltipPlaceholder, { color: colors.textMuted }]}>
            Tap any block to view usage details.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  scrollContainer: {
    paddingBottom: 8,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  hoursHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  yLabelPlaceholder: {
    width: 44,
  },
  xLabelWrapper: {
    width: 22,
    alignItems: 'center',
    overflow: 'visible',
  },
  xLabel: {
    fontSize: 9,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
    marginLeft: -5,
  },
  dotSeparator: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  yLabelWrapper: {
    width: 44,
    justifyContent: 'center',
  },
  yLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  cell: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginHorizontal: 2,
    borderWidth: 1,
  },
  tooltipContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
    minHeight: 32,
    justifyContent: 'center',
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  tooltipVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  tooltipPlaceholder: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default HourlyHeatmapGrid;
