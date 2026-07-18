// @ts-ignore
import PushNotification from 'react-native-push-notification';

export const notificationService = {
  configure: () => {
    PushNotification.configure({
      // Called when a remote or local notification is opened or received
      onNotification: function (notification: any) {
        console.log('[NotificationService] ON NOTIFICATION:', notification);
      },
      requestPermissions: false,
    });

    // Create Channel (Android specific)
    PushNotification.createChannel(
      {
        channelId: 'data-detector-alerts', // channelId is unique
        channelName: 'Data Budget Alerts', // channelName is human-readable
        channelDescription: 'Alerts regarding monthly data budgets and consumption thresholds.',
        playSound: true,
        soundName: 'default',
        importance: 4, // High importance
        vibrate: true,
      },
      (created: boolean) => console.log(`[NotificationService] CreateChannel returned '${created}'`)
    );
  },

  showNotification: (title: string, message: string) => {
    PushNotification.localNotification({
      channelId: 'data-detector-alerts',
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
    });
  },
};
