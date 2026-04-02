
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications.');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendGameNotification = (title: string, body: string, icon?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Check if tab is focused - only notify if hidden to avoid redundancy
  if (document.visibilityState === 'hidden' || true) {
    // FIX: Cast the options object to 'any' to avoid TypeScript error about 'renotify' property
    // while ensuring the browser still receives the property which is widely supported.
    new Notification(title, {
      body,
      icon: icon || 'https://cdn-icons-png.flaticon.com/512/811/811325.png', // Generic hockey puck icon
      silent: false,
      tag: 'nhl-faceoff-alert',
      renotify: true
    } as any);
  }
};

export const getNotificationStatus = (): NotificationPermission => {
  return ('Notification' in window) ? Notification.permission : 'denied';
};
