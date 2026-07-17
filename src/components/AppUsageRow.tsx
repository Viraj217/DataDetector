import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';

interface AppUsageRowProps {
  displayName: string;
  packageName: string;
  iconUri: string;
  totalBytes: number;
  mobileBytes: number;
  wifiBytes: number;
  hotspotBytes: number;
  sparklineData?: number[]; // last 7 days bytes
  onPress?: () => void;
  index?: number;
}

export const AppUsageRow: React.FC<AppUsageRowProps> = ({
  displayName,
  packageName,
  iconUri,
  totalBytes,
  mobileBytes,
  wifiBytes,
  hotspotBytes,
  sparklineData = [],
  onPress,
  index = 0,
}) => {
  const { colors } = useTheme();
  const formatted = formatBytes(totalBytes);

  // Stagger the entrance animation based on index
  const delay = Math.min(index * 50, 400);

  // Render first letter as fallback for empty icons
  const renderIcon = () => {
    const hasIcon = iconUri && iconUri.startsWith('file://');
    if (hasIcon) {
      return <Image source={{ uri: iconUri }} style={styles.icon} />;
    }
    
    // System apps or fallback
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const isSystem = packageName.startsWith('system.');
    const bgColor = isSystem ? colors.card : colors.accentSemiTrans;
    const textColor = isSystem ? colors.textSecondary : colors.accent;
    
    return (
      <View style={[styles.iconPlaceholder, { backgroundColor: bgColor }]}>
        <Text style={[styles.iconPlaceholderText, { color: textColor }]}>{firstLetter}</Text>
      </View>
    );
  };

  // Setup sparkline data
  const hasSparkline = sparklineData && sparklineData.length > 0;
  const chartData = hasSparkline
    ? sparklineData.map((val) => ({ value: val }))
    : [{ value: 0 }, { value: 0 }];

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)}>
      <TouchableOpacity
        style={[styles.container, { borderBottomColor: colors.divider }]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        {renderIcon()}

        <View style={styles.detailsContainer}>
          <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
            {displayName || packageName}
          </Text>
          
          <View style={styles.networkIndicators}>
            {wifiBytes > 0 && (
              <View style={[styles.indicator, { backgroundColor: colors.accent }]} />
            )}
            {mobileBytes > 0 && (
              <View style={[styles.indicator, { backgroundColor: colors.danger }]} />
            )}
            {hotspotBytes > 0 && (
              <View style={[styles.indicator, { backgroundColor: colors.warning }]} />
            )}
            <Text style={[styles.pkgText, { color: colors.textMuted }]} numberOfLines={1}>
              {packageName}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {hasSparkline && (
            <LineChart
              data={chartData}
              width={50}
              height={20}
              hideRules
              hideDataPoints
              hideAxesAndRules
              thickness={1.5}
              color={colors.accent}
              adjustToWidth
            />
          )}
        </View>

        <View style={styles.usageContainer}>
          <Text style={[styles.usageVal, { color: colors.text }]}>{formatted.value}</Text>
          <Text style={[styles.usageUnit, { color: colors.textSecondary }]}>{formatted.unit}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  networkIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  pkgText: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 120,
    marginLeft: 2,
  },
  chartContainer: {
    width: 50,
    height: 20,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usageContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  usageVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  usageUnit: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: -2,
  },
});
