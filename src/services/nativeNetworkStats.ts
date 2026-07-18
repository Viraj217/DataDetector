import { NativeModules } from 'react-native';

const { NetworkStatsModule } = NativeModules;

export enum NetworkType {
  MOBILE = 0,
  WIFI = 1,
}

export interface DeviceUsage {
  rxBytes: number;
  txBytes: number;
}

export interface AppUsage {
  uid: number;
  packageName: string;
  rxBytes: number;
  txBytes: number;
}

export interface InstalledApp {
  packageName: string;
  displayName: string;
  category: string;
  iconUri: string;
}

export interface HourlyAppUsage extends AppUsage {
  hour: number;
}

export const nativeNetworkStats = {
  checkUsagePermission: async (): Promise<boolean> => {
    return await NetworkStatsModule.checkUsagePermission();
  },

  requestUsagePermission: async (): Promise<void> => {
    return await NetworkStatsModule.requestUsagePermission();
  },

  getDeviceUsage: async (
    startMs: number,
    endMs: number,
    networkType: NetworkType
  ): Promise<DeviceUsage> => {
    return await NetworkStatsModule.getDeviceUsage(startMs, endMs, networkType);
  },

  getPerAppUsage: async (
    startMs: number,
    endMs: number,
    networkType: NetworkType
  ): Promise<AppUsage[]> => {
    return await NetworkStatsModule.getPerAppUsage(startMs, endMs, networkType);
  },

  getHourlyPerAppUsage: async (
    startMs: number,
    endMs: number,
    networkType: NetworkType
  ): Promise<HourlyAppUsage[]> => {
    return await NetworkStatsModule.getHourlyPerAppUsage(startMs, endMs, networkType);
  },

  broadcastWidgetUpdate: async (): Promise<boolean> => {
    try {
      return await NetworkStatsModule.broadcastWidgetUpdate();
    } catch (e) {
      console.error('[nativeNetworkStats] Widget broadcast failed:', e);
      return false;
    }
  },

  getInstalledApps: async (): Promise<InstalledApp[]> => {
    return await NetworkStatsModule.getInstalledApps();
  },
};
