import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export const Text: React.FC<TextProps> = (props) => {
  const { style, ...rest } = props;
  
  // Flatten style to inspect styling props
  const flatStyle = StyleSheet.flatten(style);
  
  let fontFamily = 'Inter-Regular';
  
  if (flatStyle && flatStyle.fontWeight) {
    const weight = flatStyle.fontWeight;
    if (weight === 'bold' || weight === '700' || weight === '800' || weight === '900') {
      fontFamily = 'Inter-Bold';
    } else if (weight === '600' || weight === '500') {
      fontFamily = 'Inter-SemiBold';
    } else if (weight === 'medium' || weight === '400') {
      // 400 is regular, but let's keep regular. If it's explicitly medium or 500, we map to Medium.
      // Wait, 500 can map to SemiBold or Medium. Let's map 500 to Inter-Medium, 600 to Inter-SemiBold.
      if (weight === '500') {
        fontFamily = 'Inter-Medium';
      } else {
        fontFamily = 'Inter-Regular';
      }
    }
  }

  // Clear fontWeight so React Native doesn't try to double-embolden the custom bold font
  const cleanedStyle = flatStyle ? { ...flatStyle, fontFamily } : { fontFamily };
  if (cleanedStyle.fontWeight && fontFamily !== 'Inter-Regular') {
    delete cleanedStyle.fontWeight;
  }

  return <RNText {...rest} style={cleanedStyle} />;
};
