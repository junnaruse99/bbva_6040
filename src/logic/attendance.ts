import { DayMap, MonthStats } from '../types';

export const ATTENDANCE_RATIO = 0.6;

/** Fecha local como YYYY-MM-DD (sin depender de la zona horaria de toISOString). */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** true si es lunes a viernes. */
export function isWeekday(iso: string): boolean {
  const dow = fromISO(iso).getDay();
  return dow >= 1 && dow <= 5;
}

/** Todas las fechas ISO de un mes (month: 1-12). */
export function daysOfMonth(year: number, month: number): string[] {
  const last = new Date(year, month, 0).getDate();
  const out: string[] = [];
  for (let d = 1; d <= last; d++) {
    out.push(toISO(new Date(year, month - 1, d)));
  }
  return out;
}

/** Días laborables (lun-vie) de un mes. */
export function workdaysOfMonth(year: number, month: number): string[] {
  return daysOfMonth(year, month).filter(isWeekday);
}

/**
 * Días requeridos de oficina en el mes:
 * (laborables - vacaciones - feriados) * 0.6, redondeado hacia arriba.
 * Solo descuentan las vacaciones/feriados que caen en día laborable.
 */
export function requiredDays(year: number, month: number, days: DayMap): number {
  const workdays = workdaysOfMonth(year, month);
  const excluded = workdays.filter(
    (d) => days[d] === 'vacation' || days[d] === 'holiday'
  ).length;
  const base = workdays.length - excluded;
  return Math.ceil(base * ATTENDANCE_RATIO);
}

/**
 * Estadísticas completas del mes para la vista calendario.
 * `todayISO` se usa para saber cuántos días laborables quedan disponibles.
 */
export function monthStats(
  year: number,
  month: number,
  days: DayMap,
  todayISO: string
): MonthStats {
  const workdays = workdaysOfMonth(year, month);
  const excluded = workdays.filter(
    (d) => days[d] === 'vacation' || days[d] === 'holiday'
  ).length;
  const baseDays = workdays.length - excluded;
  const required = Math.ceil(baseDays * ATTENDANCE_RATIO);

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const attended = Object.keys(days).filter(
    (d) => d.startsWith(monthPrefix) && days[d] === 'attended'
  ).length;

  const remaining = Math.max(0, required - attended);

  // Días laborables de hoy (inclusive) a fin de mes en los que aún se puede ir:
  // no marcados como vacaciones, feriado ni ausencia.
  const available = workdays.filter((d) => {
    if (d < todayISO) return false;
    const s = days[d];
    return s !== 'vacation' && s !== 'holiday' && s !== 'absent' && s !== 'attended';
  }).length;

  return {
    workdays: workdays.length,
    baseDays,
    required,
    attended,
    remaining,
    available,
    achievable: remaining <= available,
    completed: remaining === 0,
  };
}

export interface CriticalDay {
  date: string;
  remaining: number;
  available: number;
}

/**
 * Días del mes en los que, si no se registra ninguna asistencia adicional,
 * habrá que ir sí o sí (los días que faltan >= los días disponibles).
 * Asume que los datos no cambian sin pasar por la app: cada cambio
 * debe reprogramar las alertas con esta función.
 */
export function criticalAlertDays(
  year: number,
  month: number,
  days: DayMap,
  todayISO: string
): CriticalDay[] {
  return workdaysOfMonth(year, month)
    .filter((d) => d >= todayISO && !days[d])
    .map((d) => {
      const stats = monthStats(year, month, days, d);
      return { date: d, remaining: stats.remaining, available: stats.available };
    })
    .filter((c) => c.remaining > 0 && c.remaining >= c.available);
}
