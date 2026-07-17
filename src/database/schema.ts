export const SCHEMA_STATEMENTS = [
  `PRAGMA foreign_keys = ON;`,
  
  `CREATE TABLE IF NOT EXISTS apps (
    package_name TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    icon_uri TEXT,
    category TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS daily_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,           -- 'YYYY-MM-DD'
    app_package_name TEXT NOT NULL,
    network_type TEXT NOT NULL,   -- 'mobile' | 'wifi' | 'hotspot'
    rx_bytes INTEGER NOT NULL DEFAULT 0,
    tx_bytes INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (app_package_name) REFERENCES apps(package_name) ON DELETE CASCADE,
    UNIQUE(date, app_package_name, network_type)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(date);`,
  `CREATE INDEX IF NOT EXISTS idx_daily_usage_app ON daily_usage(app_package_name);`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`
];
