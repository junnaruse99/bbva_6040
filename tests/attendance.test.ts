import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isWeekday,
  monthStats,
  requiredDays,
  workdaysOfMonth,
} from '../src/logic/attendance';
import { DayMap } from '../src/types';

// Agosto 2026: empieza en sábado, 31 días, 21 días laborables.
test('workdaysOfMonth cuenta lun-vie', () => {
  assert.equal(workdaysOfMonth(2026, 8).length, 21);
  // Febrero 2026: 28 días, empieza en domingo -> 20 laborables.
  assert.equal(workdaysOfMonth(2026, 2).length, 20);
});

test('isWeekday distingue fin de semana', () => {
  assert.equal(isWeekday('2026-08-03'), true); // lunes
  assert.equal(isWeekday('2026-08-01'), false); // sábado
  assert.equal(isWeekday('2026-08-02'), false); // domingo
});

test('requiredDays sin vacaciones ni feriados = ceil(laborables * 0.6)', () => {
  // 21 laborables * 0.6 = 12.6 -> 13
  assert.equal(requiredDays(2026, 8, {}), 13);
  // 20 laborables * 0.6 = 12 -> 12
  assert.equal(requiredDays(2026, 2, {}), 12);
});

test('requiredDays descuenta vacaciones y feriados en días laborables', () => {
  const days: DayMap = {
    '2026-08-03': 'vacation', // lunes
    '2026-08-04': 'vacation', // martes
    '2026-08-05': 'holiday', // miércoles
  };
  // (21 - 3) * 0.6 = 10.8 -> 11
  assert.equal(requiredDays(2026, 8, days), 11);
});

test('requiredDays ignora vacaciones/feriados en fin de semana', () => {
  const days: DayMap = {
    '2026-08-01': 'holiday', // sábado, no descuenta
  };
  assert.equal(requiredDays(2026, 8, days), 13);
});

test('monthStats cuenta asistencias y días restantes', () => {
  const days: DayMap = {
    '2026-08-03': 'attended',
    '2026-08-04': 'attended',
    '2026-08-05': 'absent',
  };
  const stats = monthStats(2026, 8, days, '2026-08-06');
  assert.equal(stats.required, 13);
  assert.equal(stats.attended, 2);
  assert.equal(stats.remaining, 11);
  // Laborables del 6 al 31 de agosto sin marcar: 6,7,10..14,17..21,24..28,31 = 18
  assert.equal(stats.available, 18);
  assert.equal(stats.achievable, true);
  assert.equal(stats.completed, false);
});

test('monthStats marca imposible cuando no alcanzan los días', () => {
  // Solo asistió 1 día y estamos a 28 de agosto (viernes).
  const days: DayMap = { '2026-08-03': 'attended' };
  const stats = monthStats(2026, 8, days, '2026-08-28');
  // Quedan laborables: 28 y 31 = 2 disponibles; faltan 12.
  assert.equal(stats.remaining, 12);
  assert.equal(stats.available, 2);
  assert.equal(stats.achievable, false);
});

test('monthStats marca meta cumplida', () => {
  const days: DayMap = {};
  const workdays = workdaysOfMonth(2026, 8);
  for (let i = 0; i < 13; i++) {
    days[workdays[i]] = 'attended';
  }
  const stats = monthStats(2026, 8, days, '2026-08-31');
  assert.equal(stats.completed, true);
  assert.equal(stats.remaining, 0);
  assert.equal(stats.achievable, true);
});

test('monthStats no cuenta días ausentes ni vacaciones como disponibles', () => {
  const days: DayMap = {
    '2026-08-06': 'vacation', // jueves futuro
    '2026-08-07': 'absent', // viernes futuro (p. ej. ya sabe que no irá)
  };
  const stats = monthStats(2026, 8, days, '2026-08-06');
  // Laborables 6..31 = 18; menos el 6 (vacaciones) y el 7 (ausente) = 16.
  assert.equal(stats.available, 16);
});
