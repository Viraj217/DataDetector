import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface SkeletonLoaderProps {
  style?: StyleProp<ViewStyle>;
  variant?: 'card' | 'row' | 'text';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ style, variant = 'row' }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fadeAnim]);

  const skeletonColor = colors.card;

  if (variant === 'card') {
    return (
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: skeletonColor, opacity: fadeAnim },
          style,
        ]}
      />
    );
  }

  if (variant === 'text') {
    return (
      <Animated.View
        style={[
          styles.text,
          { backgroundColor: skeletonColor, opacity: fadeAnim },
          style,
        ]}
      />
    );
  }

  return (
    <View style={[styles.rowContainer, style]}>
      <Animated.View
        style={[
          styles.avatar,
          { backgroundColor: skeletonColor, opacity: fadeAnim },
        ]}
      />
      <View style={styles.textContainer}>
        <Animated.View
          style={[
            styles.titleLine,
            { backgroundColor: skeletonColor, opacity: fadeAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.subLine,
            { backgroundColor: skeletonColor, opacity: fadeAnim },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.rightBlock,
          { backgroundColor: skeletonColor, opacity: fadeAnim },
        ]}
      />
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
