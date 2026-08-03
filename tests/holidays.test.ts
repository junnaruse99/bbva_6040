import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toISO } from '../src/logic/attendance';
import {
  easterSunday,
  peruHolidayName,
  peruHolidays,
  withPeruHolidays,
} from '../src/logic/holidays';
import { requiredDays } from '../src/logic/attendance';

test('easterSunday calcula fechas conocidas', () => {
  assert.equal(toISO(easterSunday(2024)), '2024-03-31');
  assert.equal(toISO(easterSunday(2025)), '2025-04-20');
  assert.equal(toISO(easterSunday(2026)), '2026-04-05');
  assert.equal(toISO(easterSunday(2027)), '2027-03-28');
});

test('peruHolidays incluye Jueves y Viernes Santo', () => {
  const h2026 = peruHolidays(2026);
  assert.equal(h2026['2026-04-02'], 'Jueves Santo');
  assert.equal(h2026['2026-04-03'], 'Viernes Santo');
  const h2025 = peruHolidays(2025);
  assert.equal(h2025['2025-04-17'], 'Jueves Santo');
  assert.equal(h2025['2025-04-18'], 'Viernes Santo');
});

test('peruHolidays tiene 16 feriados nacionales', () => {
  assert.equal(Object.keys(peruHolidays(2026)).length, 16);
  assert.equal(peruHolidayName('2026-07-28'), 'Fiestas Patrias');
  assert.equal(peruHolidayName('2026-08-30'), 'Santa Rosa de Lima');
  assert.equal(peruHolidayName('2026-08-15'), null);
});

test('withPeruHolidays marca feriados pero el usuario tiene prioridad', () => {
  const merged = withPeruHolidays({ '2026-07-28': 'attended' }, 2026);
  assert.equal(merged['2026-07-28'], 'attended'); // el usuario gana
  assert.equal(merged['2026-07-29'], 'holiday'); // precargado
});

test('feriados precargados reducen la meta del mes', () => {
  // Julio 2026: 23 laborables; feriados en laborable: 23 (jue), 28 (mar), 29 (mié).
  const plain = requiredDays(2026, 7, {});
  const withHolidays = requiredDays(2026, 7, withPeruHolidays({}, 2026));
  assert.equal(plain, Math.ceil(23 * 0.6)); // 14
  assert.equal(withHolidays, Math.ceil(20 * 0.6)); // 12
});

test('agosto 2026: Batalla de Junín (6, jueves) descuenta; Santa Rosa (30, domingo) no', () => {
  // 21 laborables - 1 feriado laborable = 20 -> meta 12
  assert.equal(requiredDays(2026, 8, withPeruHolidays({}, 2026)), 12);
});
