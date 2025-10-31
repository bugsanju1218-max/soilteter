import { useState, useEffect, useCallback } from 'react';

type NotificationPermission = 'default' | 'denied' | 'granted';

export const useNotifications = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.error("This browser does not support desktop notification");
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const scheduleNotification = useCallback(async (title: string, body: string, delayInSeconds: number) => {
    let permission = notificationPermission;
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }

    if (permission === 'granted') {
      setTimeout(() => {
        new Notification(title, {
          body,
          icon: '/vite.svg', // Optional: you can use a custom icon
        });
      }, delayInSeconds * 1000);
    } else {
        console.warn("Notification permission was not granted.");
    }
  }, [notificationPermission, requestNotificationPermission]);

  return { notificationPermission, requestNotificationPermission, scheduleNotification };
};
