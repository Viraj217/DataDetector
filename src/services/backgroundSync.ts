import BackgroundFetch from 'react-native-background-fetch';
import { syncService } from './syncService';

export const initBackgroundFetch = async (): Promise<void> => {
  const status = await BackgroundFetch.configure(
    {
      minimumFetchInterval: 30, // 30 minutes
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId) => {
      console.log('[BackgroundFetch] Active Task received:', taskId);
      try {
        await syncService.sync();
      } catch (error) {
        console.error('[BackgroundFetch] Active Task Sync failed:', error);
      } finally {
        BackgroundFetch.finish(taskId);
      }
    },
    async (taskId) => {
      console.warn('[BackgroundFetch] Active Task Timeout:', taskId);
      BackgroundFetch.finish(taskId);
    }
  );

  console.log('[BackgroundFetch] Configured successfully. Status:', status);
};

export const headlessTask = async (event: { taskId: string }) => {
  const taskId = event.taskId;
  console.log('[BackgroundFetch] Headless task start:', taskId);
  try {
    await syncService.sync();
  } catch (error) {
    console.error('[BackgroundFetch] Headless Task Sync failed:', error);
  } finally {
    BackgroundFetch.finish(taskId);
  }
};
