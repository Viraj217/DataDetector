# DataDetector

DataDetector is a React Native and Native Kotlin application that helps users track, manage, and audit their daily mobile data usage.

## Features 🚀

### 📱 Home Screen Widget
- Glanceable widget placed on the Android home screen.
- Displays today's usage (with unit dynamic formatting) and progress toward the monthly data budget.
- Updates natively using SQLite (without waking the JS engine) and updates instantly on data synchronization.

### ⚡ Real-Time Speed Monitor
- Persistent notification service showing real-time network speed deltas (⬇ Down / ⬆ Up).
- Runs as an Android Foreground Service using system `TrafficStats`.
- Toggleable directly from the Settings screen.

### 🕐 Peak Usage Heatmap
- 7x24 grid displaying data consumption trends across each hour of the day.
- Visual opacity scale shows heavy peak usage windows.
- Accessible in the **History** tab.

### 🎓 Dynamic Onboarding Flow
- Swipeable tutorial on the first launch of the app.
- Interactive system usage permissions handler.
- Prompts user to set initial budget constraints.

### 📂 App Categories Breakdown
- Groups app usage dynamically into Android system categories (Social, Video, Games, System, etc.).
- Features progress bar usage splits (WiFi vs Mobile) and highlights top apps per category.
- Segmented controller tab in the **Apps** tab.

### ⚙️ Customizable Notifications
- Custom settings for Warning and Critical data usage percentages.
- Daily usage summary notifications pushed at 9 PM when enabled.

### 📳 Haptic Tactile Feedback
- Gentle physical feedback across tab transitions, settings updates, and list interactions.

---

## Tech Stack 🛠

- **Framework**: React Native (with TypeScript)
- **State & Sync**: headlessly synced SQLite via JSI `@op-engineering/op-sqlite`
- **Native Modules**: Written in Kotlin (usage statistics queries, speed monitor service, widget provider)
- **Animations**: `react-native-reanimated`
- **Background Operations**: `react-native-background-fetch`

---

## Database Schema 🗄

The SQLite database (`datadetector.sqlite`) resides in the device's native databases folder and contains three main tables:

### 1. `apps`
Holds app metadata and category info.
```sql
CREATE TABLE IF NOT EXISTS apps (
  package_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  icon_uri TEXT,
  category TEXT
);
```

### 2. `daily_usage`
Stores daily sums for Mobile, WiFi, and Hotspot.
```sql
CREATE TABLE IF NOT EXISTS daily_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,           -- 'YYYY-MM-DD'
  app_package_name TEXT NOT NULL,
  network_type TEXT NOT NULL,   -- 'mobile' | 'wifi' | 'hotspot'
  rx_bytes INTEGER NOT NULL DEFAULT 0,
  tx_bytes INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (app_package_name) REFERENCES apps(package_name) ON DELETE CASCADE,
  UNIQUE(date, app_package_name, network_type)
);
```

### 3. `hourly_usage`
Holds hourly buckets for the peak usage heatmap.
```sql
CREATE TABLE IF NOT EXISTS hourly_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,              -- 'YYYY-MM-DD'
  hour INTEGER NOT NULL,           -- 0-23
  app_package_name TEXT NOT NULL,
  network_type TEXT NOT NULL,      -- 'mobile' | 'wifi' | 'hotspot'
  rx_bytes INTEGER NOT NULL DEFAULT 0,
  tx_bytes INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (app_package_name) REFERENCES apps(package_name) ON DELETE CASCADE,
  UNIQUE(date, hour, app_package_name, network_type)
);
```

---

## Installation & Setup 💻

### Prerequisites
- Android SDK (API level 34+)
- Node.js & npm

### Steps

1. **Install JavaScript dependencies**:
   ```bash
   npm install
   ```

2. **Start the Metro Bundler**:
   ```bash
   npm run start -- --reset-cache
   ```

3. **Build and Run on Android**:
   ```bash
   npx react-native run-android
   ```
