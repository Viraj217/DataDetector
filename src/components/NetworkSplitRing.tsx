import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn, FadeInRight } from 'react-native-reanimated';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface NetworkSplitRingProps {
  mobile: number;
  wifi: number;
  hotspot: number;
  size?: number;
}

export const NetworkSplitRing: React.FC<NetworkSplitRingProps> = ({
  mobile,
  wifi,
  hotspot,
  size = 180,
}) => {
  const { colors } = useTheme();

  const total = mobile + wifi + hotspot;
  const formattedTotal = formatBytes(total);

  // If no data, show a placeholder grey ring
  const hasData = total > 0;
  
  const chartData = hasData
    ? [
        { value: wifi, color: colors.accent, text: 'Wi-Fi' },
        { value: mobile, color: colors.danger, text: 'Mobile' },
        { value: hotspot, color: colors.warning, text: 'Hotspot' },
      ].filter((item) => item.value > 0)
    : [{ value: 1, color: colors.card, text: 'No Data' }];

  const radius = size / 2;
  const innerRadius = radius - 18;

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(600)}>
      <Animated.View style={styles.chartWrapper} entering={ZoomIn.springify().damping(14).delay(100)}>
        <PieChart
          data={chartData}
          donut
          radius={radius}
          innerRadius={innerRadius}
          focusOnPress
          toggleFocusOnPress={false}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <View style={styles.centerValueRow}>
                <Text style={[styles.centerValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formattedTotal.value}
                </Text>
                <Text style={[styles.centerUnit, { color: colors.accent }]}>
                  {formattedTotal.unit}
                </Text>
              </View>
              <Text style={[styles.centerText, { color: colors.textSecondary }]}>
                Today's Total
              </Text>
            </View>
          )}
        />
      </Animated.View>

      <Animated.View style={styles.legendContainer} entering={FadeInRight.delay(300).duration(500)}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Wi-Fi</Text>
          </View>
          <Text style={[styles.legendValue, { color: colors.text }]}>
            {formatBytes(wifi).full}
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.danger }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Mobile</Text>
          </View>
          <Text style={[styles.legendValue, { color: colors.text }]}>
            {formatBytes(mobile).full}
          </Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Hotspot</Text>
          </View>
          <Text style={[styles.legendValue, { color: colors.text }]}>
            {formatBytes(hotspot).full}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100, // Constrain width so it wraps nicely within ring
  },
  centerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  centerUnit: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 2,
  },
  centerText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendContainer: {
    flex: 1,
    marginLeft: 24,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
