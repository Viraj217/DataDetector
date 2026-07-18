import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Thin wrapper around react-native-haptic-feedback for consistent haptic
 * responses across the app.
 */
export const haptics = {
  /** Light tap — tab switches, toggle taps, list item selections */
  light: () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.impactLight, options);
  },

  /** Medium tap — button presses, save actions */
  medium: () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.impactMedium, options);
  },

  /** Heavy tap — destructive or significant actions */
  heavy: () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.impactHeavy, options);
  },

  /** Success — completed operations (save, export) */
  success: () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.notificationSuccess, options);
  },

  /** Warning — alert thresholds crossed */
  warning: () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.notificationWarning, options);
  },

  /** Selection changed — picker / sort option changes */
  selection: () => {
    ReactNativeHapticFeedback.trigger(HapticFeedbackTypes.selection, options);
  },
};
