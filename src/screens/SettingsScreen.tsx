import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';
import { queries } from '../database/queries';
import { nativeNetworkStats } from '../services/nativeNetworkStats';
import { budgetService, BudgetStatus } from '../services/budgetService';
import { formatBytes } from '../utils/formatBytes';
import { haptics } from '../utils/haptics';
import { speedMonitor } from '../services/speedMonitor';

export const SettingsScreen: React.FC = () => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  // Settings State
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [monthlyCapGb, setMonthlyCapGb] = useState('');
  const [wifiCapGb, setWifiCapGb] = useState('');
  const [cycleStartDay, setCycleStartDay] = useState('');
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [lastSyncStr, setLastSyncStr] = useState('Never');
  // Notification settings
  const [warningThreshold, setWarningThreshold] = useState('80');
  const [criticalThreshold, setCriticalThreshold] = useState('100');
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [speedMonitorEnabled, setSpeedMonitorEnabled] = useState(false);

  // Load current configuration
  const loadSettings = async () => {
    try {
      // 1. Check permission
      const granted = await nativeNetworkStats.checkUsagePermission();
      setPermissionGranted(granted);

      // 2. Fetch budget variables
      const capSetting = queries.getSetting('monthly_cap_bytes');
      if (capSetting) {
        const bytes = parseInt(capSetting, 10);
        setMonthlyCapGb((bytes / (1024 * 1024 * 1024)).toString());
      } else {
        setMonthlyCapGb('10'); // Default 10 GB
      }

      const wifiCapSetting = queries.getSetting('wifi_cap_bytes');
      if (wifiCapSetting) {
        const bytes = parseInt(wifiCapSetting, 10);
        setWifiCapGb((bytes / (1024 * 1024 * 1024)).toString());
      } else {
        setWifiCapGb('50'); // Default 50 GB
      }

      const cycleDaySetting = queries.getSetting('billing_cycle_start_day');
      setCycleStartDay(cycleDaySetting || '1');

      // 3. Compute budget status
      const status = budgetService.getBudgetStatus();
      setBudgetStatus(status);

      // 4. Fetch last sync
      const syncTime = queries.getSetting('last_sync_timestamp');
      if (syncTime) {
        const date = new Date(parseInt(syncTime, 10));
        setLastSyncStr(date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }

      // 5. Fetch notification settings
      const warnThresh = queries.getSetting('alert_warning_threshold');
      setWarningThreshold(warnThresh || '80');
      const critThresh = queries.getSetting('alert_critical_threshold');
      setCriticalThreshold(critThresh || '100');
      const dailySummary = queries.getSetting('daily_summary_enabled');
      setDailySummaryEnabled(dailySummary === 'true');
      const speedMon = queries.getSetting('speed_monitor_enabled');
      setSpeedMonitorEnabled(speedMon === 'true');
    } catch (e) {
      console.error('[SettingsScreen] Failed to load settings:', e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveBudget = () => {
    const gb = parseFloat(monthlyCapGb);
    const wgb = parseFloat(wifiCapGb);
    const day = parseInt(cycleStartDay, 10);

    if (isNaN(gb) || gb < 0 || isNaN(wgb) || wgb < 0) {
      Alert.alert('Invalid Input', 'Please enter valid data limits in GB.');
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Invalid Input', 'Billing cycle start day must be between 1 and 31.');
      return;
    }

    try {
      const bytes = Math.round(gb * 1024 * 1024 * 1024);
      const wBytes = Math.round(wgb * 1024 * 1024 * 1024);
      queries.setSetting('monthly_cap_bytes', bytes.toString());
      queries.setSetting('wifi_cap_bytes', wBytes.toString());
      queries.setSetting('billing_cycle_start_day', day.toString());
      
      // Re-load and update
      loadSettings();
      
      Alert.alert('Settings Saved', 'Data budget settings updated successfully.');
      haptics.success();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const handleOpenSettings = async () => {
    haptics.medium();
    await nativeNetworkStats.requestUsagePermission();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Permission Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Permissions</Text>
            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Usage Statistics</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Required to retrieve network statistics from the device.
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: permissionGranted ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 77, 106, 0.15)' },
                ]}
              >
                <Text style={{ color: permissionGranted ? colors.accent : colors.danger, fontWeight: 'bold', fontSize: 12 }}>
                  {permissionGranted ? 'Granted' : 'Missing'}
                </Text>
              </View>
            </View>
            {!permissionGranted && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={handleOpenSettings}
              >
                <Text style={[styles.actionBtnText, { color: colors.background }]}>Grant Access Settings</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Budget Config Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Data Budgets</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mobile Data Cap (GB)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={monthlyCapGb}
                onChangeText={setMonthlyCapGb}
                placeholder="e.g. 15"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Wi-Fi Cap (GB)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={wifiCapGb}
                onChangeText={setWifiCapGb}
                placeholder="e.g. 50"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Billing Cycle Start Day (1-31)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={cycleStartDay}
                onChangeText={setCycleStartDay}
                placeholder="e.g. 1"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {budgetStatus && budgetStatus.capBytes > 0 && (
              <View style={[styles.alertStatusCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.alertTitle, { color: colors.textSecondary }]}>Burn Rate Projection</Text>
                
                <Text style={[styles.alertValue, { color: colors.text }]}>
                  Used: {formatBytes(budgetStatus.consumedBytes).full} of {monthlyCapGb} GB
                </Text>
                
                {budgetStatus.projectedCapDate ? (
                  <Text style={[styles.alertWarning, { color: colors.danger }]}>
                    ⚠️ Projected to hit limit on {budgetStatus.projectedCapDate}
                  </Text>
                ) : (
                  <Text style={[styles.alertSafe, { color: colors.accent }]}>
                    ✓ Under budget (Projected: {formatBytes(budgetStatus.projectedBytes).full})
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent, marginTop: 12 }]}
              onPress={handleSaveBudget}
            >
              <Text style={[styles.actionBtnText, { color: colors.background }]}>Save Budget Settings</Text>
            </TouchableOpacity>
          </View>

          {/* Theme Mode Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Appearance</Text>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { borderColor: colors.border, backgroundColor: themeMode === 'dark' ? colors.accent : colors.card },
                ]}
                onPress={() => { haptics.selection(); setThemeMode('dark'); }}
              >
                <Text style={[styles.themeBtnText, { color: themeMode === 'dark' ? colors.background : colors.text }]}>
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { borderColor: colors.border, backgroundColor: themeMode === 'light' ? colors.accent : colors.card },
                ]}
                onPress={() => { haptics.selection(); setThemeMode('light'); }}
              >
                <Text style={[styles.themeBtnText, { color: themeMode === 'light' ? colors.background : colors.text }]}>
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  { borderColor: colors.border, backgroundColor: themeMode === 'system' ? colors.accent : colors.card },
                ]}
                onPress={() => { haptics.selection(); setThemeMode('system'); }}
              >
                <Text style={[styles.themeBtnText, { color: themeMode === 'system' ? colors.background : colors.text }]}>
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Notifications</Text>

            <View style={styles.row}>
              <View style={styles.textCol}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Daily Usage Summary</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Get a notification with your daily total around 9 PM.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  { backgroundColor: dailySummaryEnabled ? colors.accent : colors.card, borderColor: colors.border },
                ]}
                onPress={() => {
                  haptics.selection();
                  const newVal = !dailySummaryEnabled;
                  setDailySummaryEnabled(newVal);
                  queries.setSetting('daily_summary_enabled', newVal.toString());
                }}
              >
                <Text style={{ color: dailySummaryEnabled ? colors.background : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {dailySummaryEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.row, { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 16 }]}>
              <View style={styles.textCol}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Real-Time Speed Monitor</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  Show live network speed in notification bar.
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  { backgroundColor: speedMonitorEnabled ? colors.accent : colors.card, borderColor: colors.border },
                ]}
                onPress={async () => {
                  haptics.selection();
                  const newVal = !speedMonitorEnabled;
                  
                  if (newVal && Platform.OS === 'android' && Platform.Version >= 33) {
                    try {
                      const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
                      );
                      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        Alert.alert(
                          'Permission Required',
                          'Notification permission is required to display live network speed.'
                        );
                        return;
                      }
                    } catch (err) {
                      console.warn(err);
                      return;
                    }
                  }

                  setSpeedMonitorEnabled(newVal);
                  queries.setSetting('speed_monitor_enabled', newVal.toString());
                  if (newVal) {
                    await speedMonitor.start();
                  } else {
                    await speedMonitor.stop();
                  }
                }}
              >
                <Text style={{ color: speedMonitorEnabled ? colors.background : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
                  {speedMonitorEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 16 }} />

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Warning Threshold (%)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={warningThreshold}
                onChangeText={(val) => {
                  setWarningThreshold(val);
                  queries.setSetting('alert_warning_threshold', val);
                }}
                placeholder="80"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Critical Threshold (%)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                keyboardType="numeric"
                value={criticalThreshold}
                onChangeText={(val) => {
                  setCriticalThreshold(val);
                  queries.setSetting('alert_critical_threshold', val);
                }}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* System Diagnostics Info */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>System & Sync</Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Data Sync</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>{lastSyncStr}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Storage Type</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>SQLite (JSI op-sqlite)</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Target Platform</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>Android API 34+</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Version</Text>
              <Text style={[styles.infoVal, { color: colors.text }]}>1.0.0</Text>
            </View>
          </View>

          {/* About */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => { haptics.light(); navigation.navigate('About'); }}
          >
            <Text style={[styles.rowTitle, { color: colors.text, marginBottom: 0 }]}>About DataDetector</Text>
            <Text style={[styles.infoVal, { color: colors.textMuted }]}>v1.0.0 →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textCol: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rowSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  alertStatusCard: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  alertTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  alertValue: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertWarning: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertSafe: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleBtn: {
    borderWidth: 1,
    borderRadius: 8,
    width: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
export default SettingsScreen;
