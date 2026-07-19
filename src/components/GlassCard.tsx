import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface GlassCardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ style, children, ...props }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.card,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border,
          shadowColor: isDark ? '#000' : '#000',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
  },
});
