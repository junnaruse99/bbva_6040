import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderConfig } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('recordatorios', {
      name: 'Recordatorios de asistencia',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Programa un recordatorio repetitivo de lunes a viernes a la hora indicada.
 * Cancela cualquier recordatorio anterior antes de programar.
 */
export async function applyReminder(config: ReminderConfig): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!config.enabled) return;

  // weekday: 1 = domingo ... 7 = sábado; lunes a viernes = 2..6
  for (let weekday = 2; weekday <= 6; weekday++) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '6040 · Presencialidad',
        body: '¿Fuiste hoy a la oficina? Marca tu asistencia.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: config.hour,
        minute: config.minute,
        channelId: Platform.OS === 'android' ? 'recordatorios' : undefined,
      },
    });
  }
}
