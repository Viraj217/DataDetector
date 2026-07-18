import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  AppState,
  StatusBar,
  StyleSheet,
  Text,
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

  if (permissionGranted === null || isSyncing || onboardingCompleted === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {isSyncing ? 'Synchronizing usage data...' : 'Verifying permissions...'}
        </Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default App;
