import assert from 'node:assert/strict';
import { test } from 'node:test';
import { criticalAlertDays, workdaysOfMonth } from '../src/logic/attendance';
import { withPeruHolidays } from '../src/logic/holidays';
import { DayMap } from '../src/types';

// Agosto 2026 con feriados de Perú: 21 laborables - 1 feriado (jueves 6) = 20.
// Meta: ceil(20 * 0.6) = 12.

test('sin asistencias, la alerta empieza cuando quedan justo los días de la meta', () => {
  const days = withPeruHolidays({}, 2026);
  const critical = criticalAlertDays(2026, 8, days, '2026-08-03');
  // Disponible == 12 por primera vez el viernes 14 de agosto.
  assert.equal(critical[0].date, '2026-08-14');
  assert.equal(critical.length, 12);
  assert.equal(critical[0].remaining, 12);
  assert.equal(critical[0].available, 12);
  // El último día del mes sigue siendo crítico.
  assert.equal(critical[critical.length - 1].date, '2026-08-31');
});

test('con la meta cumplida no hay días críticos', () => {
  const user: DayMap = {};
  const workdays = workdaysOfMonth(2026, 8).filter((d) => d !== '2026-08-06');
  for (let i = 0; i < 12; i++) user[workdays[i]] = 'attended';
  const days = withPeruHolidays(user, 2026);
  assert.deepEqual(criticalAlertDays(2026, 8, days, '2026-08-03'), []);
});

test('cada asistencia retrasa el inicio de las alertas', () => {
  const user: DayMap = { '2026-08-03': 'attended' };
  const days = withPeruHolidays(user, 2026);
  const critical = criticalAlertDays(2026, 8, days, '2026-08-04');
  // Faltan 11; disponible == 11 por primera vez el lunes 17.
  assert.equal(critical[0].date, '2026-08-17');
  assert.equal(critical[0].remaining, 11);
});

test('cuando ya es imposible cumplir, igual alerta (remaining > available)', () => {
  const days = withPeruHolidays({}, 2026);
  const critical = criticalAlertDays(2026, 8, days, '2026-08-28');
  // Solo quedan 28 y 31: ambos críticos, faltando 12.
  assert.equal(critical.length, 2);
  assert.equal(critical[0].remaining, 12);
  assert.equal(critical[0].available, 2);
});

test('los días ya marcados (ausencia, vacaciones) no reciben alerta', () => {
  const user: DayMap = { '2026-08-28': 'vacation' };
  const days = withPeruHolidays(user, 2026);
  const critical = criticalAlertDays(2026, 8, days, '2026-08-27');
  assert.deepEqual(
    critical.map((c) => c.date),
    ['2026-08-27', '2026-08-31']
  );
});
