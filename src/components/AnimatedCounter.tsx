import React, { useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native';

interface AnimatedCounterProps extends TextProps {
  value: number;
  duration?: number; // duration in ms
  formatter: (val: number) => string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
  formatter,
  style,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      const current = startValue + easedProgress * (endValue - startValue);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <Text style={style} {...props}>
      {formatter(displayValue)}
    </Text>
  );
};
