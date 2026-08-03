import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayMap, DayStatus, PlanMap, ReminderConfig } from '../types';

const DAYS_KEY = '6040/days';
const PLAN_KEY = '6040/plan';
const REMINDER_KEY = '6040/reminder';
const ALERT_KEY = '6040/alert';

export const DEFAULT_REMINDER: ReminderConfig = {
  enabled: false,
  hour: 18,
  minute: 0,
};

export const DEFAULT_ALERT: ReminderConfig = {
  enabled: false,
  hour: 7,
  minute: 0,
};

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Si el almacenamiento falla (p. ej. web sin localStorage), la app sigue en memoria. */
async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sin persistencia disponible
  }
}

export async function loadDays(): Promise<DayMap> {
  return readJSON<DayMap>(DAYS_KEY, {});
}

export async function saveDays(days: DayMap): Promise<void> {
  await writeJSON(DAYS_KEY, days);
}

export async function setDay(
  days: DayMap,
  iso: string,
  status: DayStatus | null
): Promise<DayMap> {
  const next = { ...days };
  if (status === null) {
    delete next[iso];
  } else {
    next[iso] = status;
  }
  await saveDays(next);
  return next;
}

export async function loadPlan(): Promise<PlanMap> {
  return readJSON<PlanMap>(PLAN_KEY, {});
}

export async function savePlan(plan: PlanMap): Promise<void> {
  await writeJSON(PLAN_KEY, plan);
}

export async function loadReminder(): Promise<ReminderConfig> {
  return readJSON<ReminderConfig>(REMINDER_KEY, DEFAULT_REMINDER);
}

export async function saveReminder(config: ReminderConfig): Promise<void> {
  await writeJSON(REMINDER_KEY, config);
}

export async function loadAlertConfig(): Promise<ReminderConfig> {
  return readJSON<ReminderConfig>(ALERT_KEY, DEFAULT_ALERT);
}

export async function saveAlertConfig(config: ReminderConfig): Promise<void> {
  await writeJSON(ALERT_KEY, config);
}
