import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
  if (!Device.isDevice) {
    console.log('[PUSH] Simulator or web environment detected; push registration bypassed.');
    return null;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Push notification permissions not granted.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'CyberGuard Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00B4FF',
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;

    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    ).catch((err) => {
      console.log('[PUSH] Push token retrieval notice:', err.message);
      return null;
    });

    const token = tokenRes?.data;

    if (token) {
      try {
        await authAPI.registerPushToken?.(token);
        console.log('[PUSH] Push token registered with backend successfully.');
      } catch (backendErr) {
        console.log('[PUSH] Backend token registration notice:', backendErr.message);
      }
    }

    return token || null;
  } catch (err) {
    console.log('[PUSH] Push notification registration bypassed:', err.message);
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
