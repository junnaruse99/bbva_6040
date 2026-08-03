import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CalendarGrid from '../components/CalendarGrid';
import MonthHeader from '../components/MonthHeader';
import ReminderCard from '../components/ReminderCard';
import { fromISO, isWeekday, monthStats } from '../logic/attendance';
import { withPeruHolidays } from '../logic/holidays';
import { ensurePermissions, notificationsSupported } from '../notifications';
import { showAlert } from '../alert';
import { colors } from '../theme';
import { DayMap, PlanMap, ReminderConfig } from '../types';

interface Props {
  days: DayMap;
  plan: PlanMap;
  markReminder: ReminderConfig;
  alertConfig: ReminderConfig;
  todayISO: string;
  onTogglePlan: (iso: string) => void;
  onSaveMarkReminder: (config: ReminderConfig, reschedule: boolean) => Promise<void>;
  onSaveAlertConfig: (config: ReminderConfig, reschedule: boolean) => Promise<void>;
}

function formatTime(c: ReminderConfig): string {
  return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
}

export default function PlanScreen({
  days,
  plan,
  markReminder,
  alertConfig,
  todayISO,
  onTogglePlan,
  onSaveMarkReminder,
  onSaveAlertConfig,
}: Props) {
  const today = fromISO(todayISO);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // Feriados de Perú precargados; lo que marque el usuario tiene prioridad.
  const effectiveDays = withPeruHolidays(days, year);
  const stats = monthStats(year, month, effectiveDays, todayISO);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const planned = Object.keys(plan).filter((d) => d.startsWith(monthPrefix)).length;
  const enough = planned + stats.attended >= stats.required;

  const move = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const handlePressDay = (iso: string) => {
    if (!isWeekday(iso)) return;
    const status = effectiveDays[iso];
    if (status === 'vacation' || status === 'holiday' || status === 'attended') {
      return;
    }
    onTogglePlan(iso);
  };

  const changeTime =
    (config: ReminderConfig, save: Props['onSaveMarkReminder']) =>
    (field: 'hour' | 'minute', delta: number) => {
      const max = field === 'hour' ? 24 : 60;
      const step = field === 'minute' ? 15 : 1;
      const value = (config[field] + delta * step + max) % max;
      // Solo persiste el valor; se programa al pulsar "Guardar horario".
      void save({ ...config, [field]: value }, false);
    };

  const toggle =
    (config: ReminderConfig, save: Props['onSaveMarkReminder'], onMessage: string) =>
    async (enabled: boolean) => {
      if (enabled) {
        if (!notificationsSupported) {
          showAlert(
            'No disponible en web',
            'Las notificaciones solo funcionan en la app instalada en Android o iOS.'
          );
          return;
        }
        const granted = await ensurePermissions();
        if (!granted) {
          showAlert(
            'Permiso necesario',
            'Activa las notificaciones para la app 6040 en los ajustes del teléfono.'
          );
          return;
        }
      }
      const next = { ...config, enabled };
      await save(next, true);
      if (enabled) {
        showAlert('Activado', `${onMessage} (${formatTime(next)}).`);
      }
    };

  const saveTime =
    (config: ReminderConfig, save: Props['onSaveMarkReminder']) => async () => {
      await save(config, true);
      if (config.enabled) {
        showAlert('Listo', `Horario actualizado a las ${formatTime(config)}.`);
      }
    };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MonthHeader
        year={year}
        month={month}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
      />

      <View
        style={[
          styles.banner,
          { backgroundColor: enough ? colors.green : colors.blue },
        ]}
      >
        <Text style={styles.bannerText}>
          {planned} planificado{planned === 1 ? '' : 's'} + {stats.attended} asistido
          {stats.attended === 1 ? '' : 's'} / meta {stats.required}
          {enough ? ' ✅' : ` · marca ${stats.required - stats.attended - planned} más`}
        </Text>
      </View>

      <CalendarGrid
        year={year}
        month={month}
        days={effectiveDays}
        plan={plan}
        todayISO={todayISO}
        onPressDay={handlePressDay}
      />

      <Text style={styles.hint}>
        Toca los días laborables en los que planeas ir a la oficina. Los días con
        vacaciones, feriado o ya asistidos no se pueden planificar.
      </Text>

      <ReminderCard
        title="🔔 Recordatorio para marcar"
        subtitle="De lunes a viernes te preguntaré si fuiste a la oficina, a la hora que elijas."
        config={markReminder}
        onToggle={toggle(
          markReminder,
          onSaveMarkReminder,
          'Te preguntaré de lunes a viernes si fuiste a la oficina'
        )}
        onChangeTime={changeTime(markReminder, onSaveMarkReminder)}
        onSaveTime={saveTime(markReminder, onSaveMarkReminder)}
      />

      <ReminderCard
        title="🚨 Alerta de cumplimiento"
        subtitle="Si los días que te faltan son iguales o más que los disponibles, te avisaré cada mañana que hoy tienes que ir sí o sí."
        config={alertConfig}
        onToggle={toggle(
          alertConfig,
          onSaveAlertConfig,
          'Te avisaré por la mañana cuando tengas que ir sí o sí para cumplir'
        )}
        onChangeTime={changeTime(alertConfig, onSaveAlertConfig)}
        onSaveTime={saveTime(alertConfig, onSaveAlertConfig)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  bannerText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
