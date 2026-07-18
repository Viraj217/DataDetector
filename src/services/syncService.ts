import { nativeNetworkStats, NetworkType } from './nativeNetworkStats';
import { queries } from '../database/queries';
import { dateUtils } from '../utils/dateUtils';
import { budgetService } from './budgetService';
import { notificationService } from './notificationService';
import { formatBytes } from '../utils/formatBytes';

const WELL_KNOWN_UIDS: Record<string, string> = {
  '1000': 'Android OS (Core Services)',
  '1001': 'Phone & Cellular Services',
  '1002': 'Bluetooth Services',
  '1013': 'Media & Audio Server',
  '1027': 'NFC Services',
  '1073': 'System Webview Core',
  '2000': 'ADB Shell / System Access',
};

export const syncService = {
  sync: async (targetDate: Date = new Date()): Promise<void> => {
    try {
      console.log(`[SyncService] Starting sync for ${dateUtils.getLocalDateString(targetDate)}...`);
      
      const isGranted = await nativeNetworkStats.checkUsagePermission();
      if (!isGranted) {
        console.warn('[SyncService] Usage permission not granted. Skipping sync.');
        return;
      }

      const dateStr = dateUtils.getLocalDateString(targetDate);
      const startMs = dateUtils.getStartOfDayMs(targetDate);
      const endMs = dateUtils.getEndOfDayMs(targetDate);

      // 1. Sync app list to make sure all installed apps are in DB
      // We do this periodically, but let's run it on every sync since it's fast
      const installedApps = await nativeNetworkStats.getInstalledApps();
      for (const app of installedApps) {
        queries.upsertApp(app.packageName, app.displayName, app.iconUri, app.category);
      }

      // Upsert special system apps
      queries.upsertApp('system.tethering', 'Tethering & Hotspot', '', 'system');
      queries.upsertApp('system.removed', 'Removed Apps', '', 'system');

      // 2. Fetch usage data from native module
      const mobileUsage = await nativeNetworkStats.getPerAppUsage(startMs, endMs, NetworkType.MOBILE);
      const wifiUsage = await nativeNetworkStats.getPerAppUsage(startMs, endMs, NetworkType.WIFI);
      
      const mobileHourly = await nativeNetworkStats.getHourlyPerAppUsage(startMs, endMs, NetworkType.MOBILE);
      const wifiHourly = await nativeNetworkStats.getHourlyPerAppUsage(startMs, endMs, NetworkType.WIFI);

      // 3. Aggregate usage in memory
      // key: packageName + '_' + networkType
      const aggregationMap = new Map<string, { packageName: string; networkType: string; rx: number; tx: number }>();
      // key: packageName + '_' + hour + '_' + networkType
      const hourlyAggregationMap = new Map<string, { packageName: string; hour: number; networkType: string; rx: number; tx: number }>();

      const addUsage = (packageName: string, rawNetworkType: string, rx: number, tx: number) => {
        // Map system.tethering to 'hotspot' network type
        const networkType = packageName === 'system.tethering' ? 'hotspot' : rawNetworkType;
        
        // Ensure every package we encounter has an entry in the apps table
        // This prevents FK constraint violations for uninstalled apps or unknown system UIDs
        const existingApp = queries.getApp(packageName);
        let shouldUpsert = !existingApp;
        let displayName = existingApp?.display_name || packageName;
        let category = existingApp?.category || 'other';
        
        if (!existingApp || packageName.startsWith('system.uid_')) {
          if (packageName.startsWith('system.uid_')) {
            const uidStr = packageName.split('_')[1];
            const uid = parseInt(uidStr, 10);
            if (uid >= 10000) {
              displayName = `Uninstalled App (UID ${uidStr})`;
              category = 'other';
            } else {
              displayName = WELL_KNOWN_UIDS[uidStr] || `System Services (UID ${uidStr})`;
              category = 'system';
            }
            if (!existingApp || existingApp.display_name !== displayName) {
              shouldUpsert = true;
            }
          } else if (packageName === 'system.tethering') {
            displayName = 'Tethering & Hotspot';
            category = 'system';
          } else if (packageName === 'system.removed') {
            displayName = 'Removed Apps';
            category = 'system';
          } else {
            // Unknown package (possibly uninstalled), use package name as display
            displayName = packageName.split('.').pop() || packageName;
          }
        }
        
        if (shouldUpsert) {
          queries.upsertApp(packageName, displayName, '', category);
        }

        const key = `${packageName}_${networkType}`;
        const existing = aggregationMap.get(key);
        if (existing) {
          existing.rx += rx;
          existing.tx += tx;
        } else {
          aggregationMap.set(key, { packageName, networkType, rx, tx });
        }
      };

      const addHourlyUsage = (packageName: string, hour: number, rawNetworkType: string, rx: number, tx: number) => {
        const networkType = packageName === 'system.tethering' ? 'hotspot' : rawNetworkType;
        
        // App table entry is already verified/upserted in daily aggregation step!
        
        const key = `${packageName}_${hour}_${networkType}`;
        const existing = hourlyAggregationMap.get(key);
        if (existing) {
          existing.rx += rx;
          existing.tx += tx;
        } else {
          hourlyAggregationMap.set(key, { packageName, hour, networkType, rx, tx });
        }
      };

      // Process mobile data
      for (const item of mobileUsage) {
        addUsage(item.packageName, 'mobile', item.rxBytes, item.txBytes);
      }

      // Process wifi data
      for (const item of wifiUsage) {
        addUsage(item.packageName, 'wifi', item.rxBytes, item.txBytes);
      }

      // Process mobile hourly data
      for (const item of mobileHourly) {
        addHourlyUsage(item.packageName, item.hour, 'mobile', item.rxBytes, item.txBytes);
      }

      // Process wifi hourly data
      for (const item of wifiHourly) {
        addHourlyUsage(item.packageName, item.hour, 'wifi', item.rxBytes, item.txBytes);
      }

      // 4. Write aggregated records to SQLite
      for (const [_, record] of aggregationMap) {
        queries.upsertDailyUsage(
          dateStr,
          record.packageName,
          record.networkType,
          record.rx,
          record.tx
        );
      }

      for (const [_, record] of hourlyAggregationMap) {
        queries.upsertHourlyUsage(
          dateStr,
          record.hour,
          record.packageName,
          record.networkType,
          record.rx,
          record.tx
        );
      }

      // Save last sync time in settings
      queries.setSetting('last_sync_timestamp', Date.now().toString());
      
      // Check data budgets and trigger alerts
      budgetService.checkAlertThresholds();

      // Trigger homescreen widget update broadcast
      await nativeNetworkStats.broadcastWidgetUpdate();

      // Check and send Daily Usage Summary
      const dailySummaryEnabled = queries.getSetting('daily_summary_enabled') === 'true';
      const lastSentDate = queries.getSetting('daily_summary_sent_date');
      const currentHour = new Date().getHours();

      if (dailySummaryEnabled && currentHour >= 21 && lastSentDate !== dateStr) {
        const todayNetworkUsage = queries.getTodayTotalByNetworkType(dateStr);
        const totalBytes = todayNetworkUsage.reduce((sum, item) => sum + item.total_bytes, 0);
        const formatted = formatBytes(totalBytes);

        notificationService.showNotification(
          'Daily Data Summary 📊',
          `You consumed ${formatted.full} of data today.`
        );
        queries.setSetting('daily_summary_sent_date', dateStr);
      }
      
      console.log(`[SyncService] Sync completed successfully for ${dateStr}. Saved ${aggregationMap.size} records.`);
    } catch (error) {
      console.error('[SyncService] Sync failed:', error);
      throw error;
    }
  },

  // Helper to sync a range of dates (e.g. on first startup or manual refresh)
  syncRange: async (days: number): Promise<void> => {
    console.log(`[SyncService] Starting historical sync for last ${days} days...`);
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      await syncService.sync(targetDate);
    }
    console.log('[SyncService] Historical range sync completed.');
  }
};
