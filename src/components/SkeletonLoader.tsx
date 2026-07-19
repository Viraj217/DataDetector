import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonLoaderProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'card' | 'row' | 'text';
}

const ShimmerBlock: React.FC<{ style: StyleProp<ViewStyle> }> = ({ style }) => {
  const { isDark } = useTheme();
  const translateX = useSharedValue(-100);
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (width > 0) {
      translateX.value = -width;
      translateX.value = withRepeat(
        withTiming(width, {
          duration: 1200,
          easing: Easing.bezier(0.3, 0.1, 0.3, 1),
        }),
        -1,
        false
      );
    }
  }, [width]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const baseColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';

  return (
    <View
      style={[
        { backgroundColor: baseColor, overflow: 'hidden', position: 'relative' },
        style,
      ]}
      onLayout={onLayout}
    >
      {width > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[baseColor, highlightColor, baseColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ style, variant = 'row' }) => {
  if (variant === 'card') {
    return <ShimmerBlock style={[styles.card, style]} />;
  }

  if (variant === 'text') {
    return <ShimmerBlock style={[styles.text, style]} />;
  }

  return (
    <View style={[styles.rowContainer, style]}>
      <ShimmerBlock style={styles.avatar} />
      <View style={styles.textContainer}>
        <ShimmerBlock style={styles.titleLine} />
        <ShimmerBlock style={styles.subLine} />
      </View>
      <ShimmerBlock style={styles.rightBlock} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginVertical: 8,
  },
  text: {
    height: 16,
    borderRadius: 4,
    marginVertical: 4,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleLine: {
    height: 14,
    borderRadius: 4,
    width: '60%',
    marginBottom: 6,
  },
  subLine: {
    height: 10,
    borderRadius: 4,
    width: '40%',
  },
  rightBlock: {
    width: 50,
    height: 20,
    borderRadius: 4,
  },
});
