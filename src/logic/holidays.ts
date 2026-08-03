import { DayMap } from '../types';
import { toISO } from './attendance';

/**
 * Domingo de Pascua (algoritmo de Butcher/Meeus, calendario gregoriano).
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Feriados nacionales de Perú con fecha fija (MM-DD -> nombre). */
const FIXED_HOLIDAYS: [string, string][] = [
  ['01-01', 'Año Nuevo'],
  ['05-01', 'Día del Trabajo'],
  ['06-07', 'Batalla de Arica y Día de la Bandera'],
  ['06-29', 'San Pedro y San Pablo'],
  ['07-23', 'Día de la Fuerza Aérea del Perú'],
  ['07-28', 'Fiestas Patrias'],
  ['07-29', 'Fiestas Patrias'],
  ['08-06', 'Batalla de Junín'],
  ['08-30', 'Santa Rosa de Lima'],
  ['10-08', 'Combate de Angamos'],
  ['11-01', 'Día de Todos los Santos'],
  ['12-08', 'Inmaculada Concepción'],
  ['12-09', 'Batalla de Ayacucho'],
  ['12-25', 'Navidad'],
];

/**
 * Feriados nacionales de Perú de un año: fecha ISO -> nombre.
 * Incluye los móviles: Jueves y Viernes Santo.
 */
export function peruHolidays(year: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [mmdd, name] of FIXED_HOLIDAYS) {
    out[`${year}-${mmdd}`] = name;
  }
  const easter = easterSunday(year);
  const thursday = new Date(year, easter.getMonth(), easter.getDate() - 3);
  const friday = new Date(year, easter.getMonth(), easter.getDate() - 2);
  out[toISO(thursday)] = 'Jueves Santo';
  out[toISO(friday)] = 'Viernes Santo';
  return out;
}

/** Nombre del feriado peruano en esa fecha, o null. */
export function peruHolidayName(iso: string): string | null {
  const year = Number(iso.slice(0, 4));
  return peruHolidays(year)[iso] ?? null;
}

/**
 * Combina los feriados de Perú del año con lo marcado por el usuario.
 * Lo que el usuario marcó siempre gana (puede, p. ej., marcar que sí fue
 * a la oficina en un feriado y ese día cuenta como asistido).
 */
export function withPeruHolidays(days: DayMap, year: number): DayMap {
  const merged: DayMap = {};
  for (const iso of Object.keys(peruHolidays(year))) {
    merged[iso] = 'holiday';
  }
  return { ...merged, ...days };
}
