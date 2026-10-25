import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { authAPI } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CyberGuard Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00B4FF',
      });
    }

    const tokenRes = await Notifications.getExpoPushTokenAsync().catch(() => null);
    const token = tokenRes?.data;

    if (token) {
      try { await authAPI.registerPushToken?.(token); } catch {}
    }

    return token;
  } catch (err) {
    console.log('Push notification registration bypassed:', err.message);
    return null;
  }
};

export const scheduleLocalNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  } catch (err) {
    console.log('Local notification error:', err.message);
  }
};
