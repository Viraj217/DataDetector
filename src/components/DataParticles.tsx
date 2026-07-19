import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  SharedValue,
  cancelAnimation,
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

interface DataParticlesProps {
  radius: number;
  usageRatio: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PARTICLES = [
  { offset: 0, dotRadius: 3.2, opacity: 0.95 },
  { offset: 0.22, dotRadius: 2.6, opacity: 0.78 },
  { offset: 0.47, dotRadius: 2.9, opacity: 0.88 },
  { offset: 0.73, dotRadius: 2.2, opacity: 0.7 },
];

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const Particle: React.FC<{
  center: number;
  dotRadius: number;
  orbitRadius: number;
  offset: number;
  opacity: number;
  progress: SharedValue<number>;
  ratio: SharedValue<number>;
  colors: {
    accent: string;
    warning: string;
    danger: string;
  };
}> = ({ center, dotRadius, orbitRadius, offset, opacity, progress, ratio, colors }) => {
  const animatedProps = useAnimatedProps(() => {
    const turn = (progress.value + offset) % 1;
    const angle = turn * Math.PI * 2;
    const risk = clamp(ratio.value, 0, 1.25);
    const fill = interpolateColor(
      risk,
      [0, 0.8, 1, 1.25],
      [colors.accent, colors.accent, colors.warning, colors.danger]
    );

    return {
      cx: center + Math.cos(angle) * orbitRadius,
      cy: center + Math.sin(angle) * orbitRadius,
      fill,
      opacity: opacity * clamp(0.45 + risk, 0.55, 1),
    };
  });

  return <AnimatedCircle animatedProps={animatedProps} r={dotRadius} />;
};

export const DataParticles: React.FC<DataParticlesProps> = ({
  radius,
  usageRatio,
  size,
}) => {
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const progress = useSharedValue(0);
  const ratio = useSharedValue(usageRatio);
  const containerSize = size ?? radius * 2;
  const center = containerSize / 2;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    ratio.value = usageRatio;
  }, [ratio, usageRatio]);

  useEffect(() => {
    if (reduceMotion || usageRatio <= 0) {
      cancelAnimation(progress);
      return;
    }

    const boundedRatio = Math.min(Math.max(usageRatio, 0), 1.25);
    const duration = 8000 - (boundedRatio / 1.25) * 6000;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, reduceMotion, usageRatio]);

  if (reduceMotion || usageRatio <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.container, { width: containerSize, height: containerSize }]}
    >
      <Svg width={containerSize} height={containerSize} style={styles.svg}>
        {PARTICLES.map((particle) => (
          <Particle
            key={particle.offset}
            center={center}
            dotRadius={particle.dotRadius}
            orbitRadius={radius}
            offset={particle.offset}
            opacity={particle.opacity}
            progress={progress}
            ratio={ratio}
            colors={colors}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  svg: {
    overflow: 'hidden',
  },
});
