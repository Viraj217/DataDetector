import { NativeModules } from 'react-native';

const { SpeedMonitorModule } = NativeModules;

export const speedMonitor = {
  start: async (): Promise<boolean> => {
    try {
      return await SpeedMonitorModule.startService();
    } catch (e) {
      console.error('[SpeedMonitor] Failed to start service:', e);
      return false;
    }
  },

  stop: async (): Promise<boolean> => {
    try {
      return await SpeedMonitorModule.stopService();
    } catch (e) {
      console.error('[SpeedMonitor] Failed to stop service:', e);
      return false;
    }
  },
};

export default speedMonitor;
