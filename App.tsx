import React, { useEffect, useState, useRef } from 'react';
import {
  AppState,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { PermissionScreen } from './src/screens/PermissionScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { nativeNetworkStats } from './src/services/nativeNetworkStats';
import { syncService } from './src/services/syncService';
import { initBackgroundFetch } from './src/services/backgroundSync';
import { notificationService } from './src/services/notificationService';
import { queries } from './src/database/queries';
import { AppLoadingSkeleton } from './src/components/AppLoadingSkeleton';


function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);

  const checkPermissionAndSync = async (forceSync = false) => {
    try {
      const granted = await nativeNetworkStats.checkUsagePermission();
      setPermissionGranted(granted);
      
      if (granted) {
        // Initialize background tasks if granted
        initBackgroundFetch();
        
        // Sync data on startup
        if (forceSync || !isSyncing) {
          setIsSyncing(true);
          // Sync today and yesterday to capture roll-over data
          await syncService.syncRange(2);
          setIsSyncing(false);
        }
      }
    } catch (e) {
      console.error('[App] Error in checkPermissionAndSync:', e);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Configure local notifications
    notificationService.configure();

    // Check onboarding status
    const onboardingDone = queries.getSetting('onboarding_completed') === 'true';
    setOnboardingCompleted(onboardingDone);

    // Initial check
    checkPermissionAndSync();

    // Re-check when app returns to foreground (user comes back from Settings)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[App] App returned to active state, checking permission...');
        checkPermissionAndSync(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (permissionGranted === null || onboardingCompleted === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <AppLoadingSkeleton />
      </View>
    );
  }

  // Show onboarding on first launch
  if (!onboardingCompleted) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <OnboardingScreen
          onComplete={() => {
            setOnboardingCompleted(true);
            checkPermissionAndSync(true);
          }}
        />
      </>
    );
  }

  if (!permissionGranted) {
    return (
      <PermissionScreen
        onPermissionGranted={() => checkPermissionAndSync(true)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
