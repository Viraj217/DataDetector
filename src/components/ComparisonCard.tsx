import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ComparisonCardProps {
  title: string;
  value: string;
  changePercent: number; // e.g. +15 or -8
  isIncreaseBetter?: boolean; // normally for data usage, a DECREASE is better (green)
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  value,
  changePercent,
  isIncreaseBetter = false,
}) => {
  const { colors } = useTheme();

  const isIncrease = changePercent > 0;
  const isZero = changePercent === 0;
  
  // Decide color: for data usage, increase is bad (coral red), decrease is good (teal green)
  let badgeColor = colors.textSecondary;
  let badgeBg = colors.card;
  let sign = '';

  if (!isZero) {
    const isPositiveOutcome = isIncreaseBetter ? isIncrease : !isIncrease;
    badgeColor = isPositiveOutcome ? colors.accent : colors.danger;
    badgeBg = isPositiveOutcome ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255, 77, 106, 0.1)';
    sign = isIncrease ? '▲' : '▼';
  }

  const absPercent = Math.abs(changePercent).toFixed(0);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>
          {isZero ? '—' : `${sign} ${absPercent}%`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    minHeight: 110,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
