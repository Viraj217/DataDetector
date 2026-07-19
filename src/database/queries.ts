import { db } from './db';

export interface AppRecord {
  package_name: string;
  display_name: string;
  icon_uri: string;
  category: string;
}

export interface DailyUsageRecord {
  date: string;
  app_package_name: string;
  network_type: string; // 'mobile' | 'wifi' | 'hotspot'
  rx_bytes: number;
  tx_bytes: number;
}

export interface AppUsageDetail extends DailyUsageRecord {
  display_name: string;
  icon_uri: string;
  category: string;
}

export const queries = {
  // Upsert an app's metadata
  upsertApp: (package_name: string, display_name: string, icon_uri: string, category: string): void => {
    db.executeSync(
      `INSERT INTO apps (package_name, display_name, icon_uri, category)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(package_name) DO UPDATE SET
         display_name = excluded.display_name,
         icon_uri = CASE WHEN excluded.icon_uri != '' THEN excluded.icon_uri ELSE apps.icon_uri END,
         category = excluded.category`,
      [package_name, display_name, icon_uri, category]
    );
  },

  // Upsert daily usage records
  upsertDailyUsage: (
    date: string,
    app_package_name: string,
    network_type: string,
    rx_bytes: number,
    tx_bytes: number
  ): void => {
    db.executeSync(
      `INSERT INTO daily_usage (date, app_package_name, network_type, rx_bytes, tx_bytes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(date, app_package_name, network_type) DO UPDATE SET
         rx_bytes = excluded.rx_bytes,
         tx_bytes = excluded.tx_bytes`,
      [date, app_package_name, network_type, rx_bytes, tx_bytes]
    );
  },

  // Get app info
  getApp: (packageName: string): AppRecord | null => {
    const result = db.executeSync(`SELECT * FROM apps WHERE package_name = ? LIMIT 1`, [packageName]);
    return result.rows.length > 0 ? (result.rows[0] as unknown as AppRecord) : null;
  },

  // Get all apps
  getApps: (): AppRecord[] => {
    const result = db.executeSync(`SELECT * FROM apps`);
    return result.rows as unknown as AppRecord[];
  },

  // Get usage for a specific day split by network type
  getTodayTotalByNetworkType: (dateStr: string): { network_type: string; total_bytes: number }[] => {
    const result = db.executeSync(
      `SELECT network_type, SUM(rx_bytes + tx_bytes) as total_bytes
       FROM daily_usage
       WHERE date = ?
       GROUP BY network_type`,
      [dateStr]
    );
    return result.rows as any[];
  },

  // Get top apps for a given day
  getTopAppsToday: (dateStr: string, limit: number = 20): AppUsageDetail[] => {
    const result = db.executeSync(
      `SELECT du.*, a.display_name, a.icon_uri, a.category
       FROM daily_usage du
       LEFT JOIN apps a ON du.app_package_name = a.package_name
       WHERE du.date = ?
       ORDER BY (du.rx_bytes + du.tx_bytes) DESC
       LIMIT ?`,
      [dateStr, limit]
    );
    return result.rows as unknown as AppUsageDetail[];
  },

  // Get aggregated top apps for today (summing the network types)
  getTopAppsTodayAggregated: (dateStr: string, limit: number = 20): (AppRecord & { total_bytes: number, mobile_bytes: number, wifi_bytes: number, hotspot_bytes: number })[] => {
    const result = db.executeSync(
      `SELECT 
         a.package_name,
         a.display_name,
         a.icon_uri,
         a.category,
         SUM(du.rx_bytes + du.tx_bytes) as total_bytes,
         SUM(CASE WHEN du.network_type = 'mobile' THEN du.rx_bytes + du.tx_bytes ELSE 0 END) as mobile_bytes,
         SUM(CASE WHEN du.network_type = 'wifi' THEN du.rx_bytes + du.tx_bytes ELSE 0 END) as wifi_bytes,
         SUM(CASE WHEN du.network_type = 'hotspot' THEN du.rx_bytes + du.tx_bytes ELSE 0 END) as hotspot_bytes
       FROM daily_usage du
       LEFT JOIN apps a ON du.app_package_name = a.package_name
       WHERE du.date = ?
       GROUP BY a.package_name
       ORDER BY total_bytes DESC
       LIMIT ?`,
      [dateStr, limit]
    );
    return result.rows as any[];
  },

  // Get daily totals for last N days (for stacked bar chart)
  getDailyTotals: (days: number, currentDateStr: string): { date: string; mobile: number; wifi: number; hotspot: number }[] => {
    const result = db.executeSync(
      `SELECT 
         date,
         SUM(CASE WHEN network_type = 'mobile' THEN rx_bytes + tx_bytes ELSE 0 END) as mobile,
         SUM(CASE WHEN network_type = 'wifi' THEN rx_bytes + tx_bytes ELSE 0 END) as wifi,
         SUM(CASE WHEN network_type = 'hotspot' THEN rx_bytes + tx_bytes ELSE 0 END) as hotspot
       FROM daily_usage
       WHERE date >= date(?, '-' || ? || ' days') AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [currentDateStr, days - 1, currentDateStr]
    );
    return result.rows as any[];
  },

  // Get usage history for a single app
  getAppUsageHistory: (packageName: string, days: number, currentDateStr: string): { date: string; mobile: number; wifi: number; hotspot: number }[] => {
    const result = db.executeSync(
      `SELECT 
         date,
         SUM(CASE WHEN network_type = 'mobile' THEN rx_bytes + tx_bytes ELSE 0 END) as mobile,
         SUM(CASE WHEN network_type = 'wifi' THEN rx_bytes + tx_bytes ELSE 0 END) as wifi,
         SUM(CASE WHEN network_type = 'hotspot' THEN rx_bytes + tx_bytes ELSE 0 END) as hotspot
       FROM daily_usage
       WHERE app_package_name = ? AND date >= date(?, '-' || ? || ' days') AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [packageName, currentDateStr, days - 1, currentDateStr]
    );
    return result.rows as any[];
  },

  // Get sparkline data for all apps over last N days
  getAppsSparklines: (days: number, currentDateStr: string): { app_package_name: string; date: string; daily_bytes: number }[] => {
    const result = db.executeSync(
      `SELECT 
         app_package_name,
         date,
         SUM(rx_bytes + tx_bytes) as daily_bytes
       FROM daily_usage
       WHERE date >= date(?, '-' || ? || ' days') AND date <= ?
       GROUP BY app_package_name, date`,
      [currentDateStr, days - 1, currentDateStr]
    );
    return result.rows as any[];
  },

  // Compare totals across two weeks day by day (for line chart comparison)
  getWeekComparison: (week1StartStr: string, week1EndStr: string, week2StartStr: string, week2EndStr: string): { week1: { date: string; total: number }[]; week2: { date: string; total: number }[] } => {
    const w1Result = db.executeSync(
      `SELECT date, SUM(rx_bytes + tx_bytes) as total
       FROM daily_usage
       WHERE date >= ? AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [week1StartStr, week1EndStr]
    );
    const w2Result = db.executeSync(
      `SELECT date, SUM(rx_bytes + tx_bytes) as total
       FROM daily_usage
       WHERE date >= ? AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [week2StartStr, week2EndStr]
    );
    return {
      week1: w1Result.rows as any[],
      week2: w2Result.rows as any[],
    };
  },

  // Get total data consumption for a date range (mobile + hotspot only)
  getMonthlyDataTotal: (startDateStr: string, endDateStr: string): number => {
    const result = db.executeSync(
      `SELECT SUM(rx_bytes + tx_bytes) as total
       FROM daily_usage
       WHERE date >= ? AND date <= ? AND network_type IN ('mobile', 'hotspot')`,
      [startDateStr, endDateStr]
    );
    return result.rows.length > 0 && result.rows[0].total ? (result.rows[0].total as number) : 0;
  },

  // Heatmap: usage intensity for the last N days
  getHeatmapData: (days: number, currentDateStr: string): { date: string; total_bytes: number }[] => {
    const result = db.executeSync(
      `SELECT date, SUM(rx_bytes + tx_bytes) as total_bytes
       FROM daily_usage
       WHERE date >= date(?, '-' || ? || ' days') AND date <= ?
       GROUP BY date
       ORDER BY date ASC`,
      [currentDateStr, days - 1, currentDateStr]
    );
    return result.rows as any[];
  },

  // Get a value from the settings table
  getSetting: (key: string): string | null => {
    const result = db.executeSync(`SELECT value FROM settings WHERE key = ? LIMIT 1`, [key]);
    return result.rows.length > 0 ? (result.rows[0].value as string) : null;
  },

  // Set a value in the settings table
  setSetting: (key: string, value: string): void => {
    db.executeSync(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  },

  // Upsert hourly usage records
  upsertHourlyUsage: (
    date: string,
    hour: number,
    app_package_name: string,
    network_type: string,
    rx_bytes: number,
    tx_bytes: number
  ): void => {
    db.executeSync(
      `INSERT INTO hourly_usage (date, hour, app_package_name, network_type, rx_bytes, tx_bytes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(date, hour, app_package_name, network_type) DO UPDATE SET
         rx_bytes = excluded.rx_bytes,
         tx_bytes = excluded.tx_bytes`,
      [date, hour, app_package_name, network_type, rx_bytes, tx_bytes]
    );
  },

  // Get hourly breakdown for a given day (aggregated across all apps)
  getHourlyBreakdown: (dateStr: string): { hour: number; total_bytes: number }[] => {
    const result = db.executeSync(
      `SELECT hour, SUM(rx_bytes + tx_bytes) as total_bytes
       FROM hourly_usage
       WHERE date = ?
       GROUP BY hour
       ORDER BY hour ASC`,
      [dateStr]
    );
    return result.rows as any[];
  },

  // Get hourly breakdown aggregated over multiple days (for heatmap grid: 7 days × 24 hours)
  getHourlyHeatmap: (days: number, currentDateStr: string): { date: string; hour: number; total_bytes: number }[] => {
    const result = db.executeSync(
      `SELECT date, hour, SUM(rx_bytes + tx_bytes) as total_bytes
       FROM hourly_usage
       WHERE date >= date(?, '-' || ? || ' days') AND date <= ?
       GROUP BY date, hour
       ORDER BY date ASC, hour ASC`,
      [currentDateStr, days - 1, currentDateStr]
    );
    return result.rows as any[];
  },

  // Get usage grouped by app category for a given day
  getCategoryBreakdown: (dateStr: string): { category: string; total_bytes: number; mobile_bytes: number; wifi_bytes: number; app_count: number }[] => {
    const result = db.executeSync(
      `SELECT 
         COALESCE(a.category, 'other') as category,
         SUM(du.rx_bytes + du.tx_bytes) as total_bytes,
         SUM(CASE WHEN du.network_type = 'mobile' THEN du.rx_bytes + du.tx_bytes ELSE 0 END) as mobile_bytes,
         SUM(CASE WHEN du.network_type = 'wifi' THEN du.rx_bytes + du.tx_bytes ELSE 0 END) as wifi_bytes,
         COUNT(DISTINCT a.package_name) as app_count
       FROM daily_usage du
       LEFT JOIN apps a ON du.app_package_name = a.package_name
       WHERE du.date = ?
       GROUP BY COALESCE(a.category, 'other')
       ORDER BY total_bytes DESC`,
      [dateStr]
    );
    return result.rows as any[];
  },

  // Get monthly totals for the last N months
  getMonthlyTotals: (months: number, currentDateStr: string): { month: string; total_bytes: number }[] => {
    const result = db.executeSync(
      `SELECT 
         strftime('%Y-%m', date) as month,
         SUM(rx_bytes + tx_bytes) as total_bytes
       FROM daily_usage
       WHERE date >= date(?, '-' || ? || ' months') AND date <= ?
       GROUP BY strftime('%Y-%m', date)
       ORDER BY month ASC`,
      [currentDateStr, months, currentDateStr]
    );
    return result.rows as any[];
  },

  // Get top app in a category for a given day
  getTopAppInCategory: (dateStr: string, category: string): { package_name: string; display_name: string; total_bytes: number } | null => {
    const result = db.executeSync(
      `SELECT 
         a.package_name,
         a.display_name,
         SUM(du.rx_bytes + du.tx_bytes) as total_bytes
       FROM daily_usage du
       LEFT JOIN apps a ON du.app_package_name = a.package_name
       WHERE du.date = ? AND COALESCE(a.category, 'other') = ?
       GROUP BY a.package_name
       ORDER BY total_bytes DESC
       LIMIT 1`,
      [dateStr, category]
    );
    return result.rows.length > 0 ? (result.rows[0] as any) : null;
  },
};
