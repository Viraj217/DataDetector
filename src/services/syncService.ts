import { nativeNetworkStats, NetworkType } from './nativeNetworkStats';
import { queries } from '../database/queries';
import { dateUtils } from '../utils/dateUtils';
import { budgetService } from './budgetService';

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

      // 3. Aggregate usage in memory
      // key: packageName + '_' + networkType
      const aggregationMap = new Map<string, { packageName: string; networkType: string; rx: number; tx: number }>();

      const addUsage = (packageName: string, rawNetworkType: string, rx: number, tx: number) => {
        // Map system.tethering to 'hotspot' network type
        const networkType = packageName === 'system.tethering' ? 'hotspot' : rawNetworkType;
        
        // Ensure every package we encounter has an entry in the apps table
        // This prevents FK constraint violations for uninstalled apps or unknown system UIDs
        const existingApp = queries.getApp(packageName);
        if (!existingApp) {
          let displayName = packageName;
          let category = 'other';
          
          if (packageName.startsWith('system.uid_')) {
            const uidStr = packageName.split('_')[1];
            displayName = `System Services (UID ${uidStr})`;
            category = 'system';
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

      // Process mobile data
      for (const item of mobileUsage) {
        addUsage(item.packageName, 'mobile', item.rxBytes, item.txBytes);
      }

      // Process wifi data
      for (const item of wifiUsage) {
        addUsage(item.packageName, 'wifi', item.rxBytes, item.txBytes);
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

      // Save last sync time in settings
      queries.setSetting('last_sync_timestamp', Date.now().toString());
      
      // Check data budgets and trigger alerts
      budgetService.checkAlertThresholds();
      
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
