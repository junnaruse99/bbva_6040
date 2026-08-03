import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CriticalDay, fromISO } from './logic/attendance';
import { ReminderConfig } from './types';

/** Las notificaciones programadas solo existen en Android/iOS, no en web. */
export const notificationsSupported = Platform.OS !== 'web';

// Prefijos para poder cancelar cada familia de notificaciones por separado.
const MARK_PREFIX = 'mark-';
const ALERT_PREFIX = 'alert-';

const CHANNEL_ID = 'recordatorios';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermissions(): Promise<boolean> {
  if (!notificationsSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de asistencia',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function cancelByPrefix(prefix: string): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Recordatorio para marcar asistencia: se repite de lunes a viernes
 * a la hora configurada.
 */
export async function applyMarkReminder(config: ReminderConfig): Promise<void> {
  if (!notificationsSupported) return;
  await cancelByPrefix(MARK_PREFIX);
  if (!config.enabled) return;

  // weekday: 1 = domingo ... 7 = sábado; lunes a viernes = 2..6
  for (let weekday = 2; weekday <= 6; weekday++) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${MARK_PREFIX}${weekday}`,
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
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  }
}

/**
 * Alertas de cumplimiento: una notificación puntual en cada día crítico
 * del mes (cuando los días que faltan >= los días disponibles).
 * Se reprograman en cada apertura de la app y en cada cambio de datos.
 */
export async function applyCriticalAlerts(
  config: ReminderConfig,
  critical: CriticalDay[]
): Promise<void> {
  if (!notificationsSupported) return;
  await cancelByPrefix(ALERT_PREFIX);
  if (!config.enabled) return;

  for (const { date, remaining, available } of critical) {
    const when = fromISO(date);
    when.setHours(config.hour, config.minute, 0, 0);
    if (when.getTime() <= Date.now()) continue;

    const body =
      remaining > available
        ? `Te faltan ${remaining} días y solo quedan ${available}: ve hoy para acercarte lo más posible a tu meta.`
        : remaining === 1
          ? 'Te falta 1 día y es el último disponible: hoy tienes que ir a la oficina.'
          : `Te faltan ${remaining} días y quedan justo ${available}: tienes que ir hoy y todos los días restantes para cumplir.`;

    await Notifications.scheduleNotificationAsync({
      identifier: `${ALERT_PREFIX}${date}`,
      content: {
        title: '6040 · ¡Hoy toca oficina! 🚨',
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  }
}
