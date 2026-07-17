import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { nativeNetworkStats } from '../services/nativeNetworkStats';

interface PermissionScreenProps {
  onPermissionGranted: () => void;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({ onPermissionGranted }) => {
  const handleGrantAccess = async () => {
    try {
      await nativeNetworkStats.requestUsagePermission();
    } catch (error) {
      console.error('Error requesting usage access settings:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.appTitle}>DATA DETECTOR</Text>
          <View style={styles.iconContainer}>
            <View style={styles.pulseInner} />
          </View>
          <Text style={styles.title}>Usage Statistics Access</Text>
          <Text style={styles.description}>
            To track your data usage and give you per-app breakdowns, Android requires your permission.
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <View style={styles.bulletTextContainer}>
              <Text style={styles.bulletTitle}>Analyze Data Consumption</Text>
              <Text style={styles.bulletDescription}>
                Tracks how many megabytes are transmitted over Mobile Data, Wi-Fi, and Mobile Hotspot.
              </Text>
            </View>
          </View>

          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <View style={styles.bulletTextContainer}>
              <Text style={styles.bulletTitle}>Per-App Breakdowns</Text>
              <Text style={styles.bulletDescription}>
                Identifies which apps are consuming the most data, allowing you to save money.
              </Text>
            </View>
          </View>

          <View style={styles.bulletRow}>
            <View style={styles.bulletPoint} />
            <View style={styles.bulletTextContainer}>
              <Text style={styles.bulletTitle}>100% Local & Private</Text>
              <Text style={styles.bulletDescription}>
                All calculations are performed on-device. No trackers, no accounts, and no data is ever uploaded.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleGrantAccess} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Enable Access in Settings</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            You will be redirected to the System Settings. Scroll to "Data Detector" and turn on "Allow usage tracking".
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  appTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00E5A0',
    letterSpacing: 3,
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 229, 160, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pulseInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00E5A0',
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  cardContainer: {
    backgroundColor: '#141829',
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#1C2137',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5A0',
    marginTop: 6,
    marginRight: 12,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bulletDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#00E5A0',
    height: 52,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
  },
  buttonText: {
    color: '#0A0E1A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
