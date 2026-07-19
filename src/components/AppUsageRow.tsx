import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { formatBytes } from '../utils/formatBytes';
import { GlassCard } from './GlassCard';

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
  const { colors, isDark } = useTheme();
  const formatted = formatBytes(totalBytes);

  const delay = Math.min(index * 50, 400);

  const renderIcon = () => {
    const hasIcon = iconUri && iconUri.startsWith('file://');
    if (hasIcon) {
      return <Image source={{ uri: iconUri }} style={styles.icon} />;
    }
    
    const firstLetter = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const isSystem = packageName.startsWith('system.');
    const bgColor = isSystem ? colors.surfaceContainer : colors.accentSemiTrans;
    const textColor = isSystem ? colors.textSecondary : colors.accent;
    
    return (
      <View style={[styles.iconPlaceholder, { backgroundColor: bgColor }]}>
        <Text style={[styles.iconPlaceholderText, { color: textColor }]}>{firstLetter}</Text>
      </View>
    );
  };

  // Generate a fake percentage for the progress bar (since we don't have a max for the list passed here easily)
  // or we could use sparkline data if we want.
  const progressPercent = Math.min((totalBytes / (2 * 1024 * 1024 * 1024)) * 100, 100); 

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <GlassCard style={styles.container}>
          {renderIcon()}

          <View style={styles.detailsContainer}>
            <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
              {displayName || packageName}
            </Text>
            
            <View style={styles.networkIndicators}>
              <Text style={[styles.pkgText, { color: colors.textMuted }]} numberOfLines={1}>
                {packageName}
              </Text>
            </View>
            <View style={styles.splitUsage}>
              <Text style={[styles.splitText, { color: colors.accent }]}>📱 {formatBytes(mobileBytes).full}</Text>
              <Text style={[styles.splitText, { color: colors.accentTertiary }]}>📶 {formatBytes(wifiBytes).full}</Text>
            </View>
            
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainer }]}>
               <View style={[styles.progressBarFill, { backgroundColor: colors.accent, width: `${Math.max(progressPercent, 5)}%` }]} />
            </View>
          </View>

          <View style={styles.usageContainer}>
             <Text style={[styles.usageVal, { color: colors.accent }]}>{formatted.value}</Text>
             <Text style={[styles.usageUnit, { color: colors.textSecondary }]}>{formatted.unit}</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 16,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  networkIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pkgText: {
    fontSize: 12,
    fontWeight: '500',
  },
  splitUsage: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  splitText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  usageVal: {
    fontSize: 20,
    fontWeight: '700',
  },
  usageUnit: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
