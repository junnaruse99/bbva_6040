import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarGrid from '../components/CalendarGrid';
import MonthHeader from '../components/MonthHeader';
import { fromISO, isWeekday, monthStats } from '../logic/attendance';
import { applyReminder, ensurePermissions } from '../notifications';
import { colors } from '../theme';
import { DayMap, PlanMap, ReminderConfig } from '../types';

interface Props {
  days: DayMap;
  plan: PlanMap;
  reminder: ReminderConfig;
  todayISO: string;
  onTogglePlan: (iso: string) => void;
  onSaveReminder: (config: ReminderConfig) => void;
}

export default function PlanScreen({
  days,
  plan,
  reminder,
  todayISO,
  onTogglePlan,
  onSaveReminder,
}: Props) {
  const today = fromISO(todayISO);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const stats = monthStats(year, month, days, todayISO);
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
    const status = days[iso];
    if (status === 'vacation' || status === 'holiday' || status === 'attended') {
      return;
    }
    onTogglePlan(iso);
  };

  const changeTime = (field: 'hour' | 'minute', delta: number) => {
    const max = field === 'hour' ? 24 : 60;
    const step = field === 'minute' ? 15 : 1;
    const value = (reminder[field] + delta * step + max) % max;
    onSaveReminder({ ...reminder, [field]: value });
  };

  const toggleEnabled = async (enabled: boolean) => {
    if (enabled) {
      const granted = await ensurePermissions();
      if (!granted) {
        Alert.alert(
          'Permiso necesario',
          'Activa las notificaciones para la app 6040 en los ajustes del teléfono.'
        );
        return;
      }
    }
    const next = { ...reminder, enabled };
    onSaveReminder(next);
    await applyReminder(next);
    if (enabled) {
      Alert.alert(
        'Recordatorio activado',
        `Te avisaré de lunes a viernes a las ${formatTime(next)} para marcar tu asistencia.`
      );
    }
  };

  const saveTime = async () => {
    if (reminder.enabled) {
      await applyReminder(reminder);
      Alert.alert('Listo', `Recordatorio actualizado a las ${formatTime(reminder)}.`);
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
        days={days}
        plan={plan}
        todayISO={todayISO}
        onPressDay={handlePressDay}
      />

      <Text style={styles.hint}>
        Toca los días laborables en los que planeas ir a la oficina. Los días con
        vacaciones, feriado o ya asistidos no se pueden planificar.
      </Text>

      <View style={styles.card}>
        <View style={styles.reminderHeader}>
          <Text style={styles.cardTitle}>🔔 Recordatorio diario</Text>
          <Switch
            value={reminder.enabled}
            onValueChange={toggleEnabled}
            trackColor={{ true: colors.blue }}
          />
        </View>
        <Text style={styles.cardSubtitle}>
          De lunes a viernes te preguntaré si fuiste a la oficina.
        </Text>

        <View style={styles.timeRow}>
          <TimeStepper
            value={reminder.hour}
            onChange={(d) => changeTime('hour', d)}
          />
          <Text style={styles.timeSeparator}>:</Text>
          <TimeStepper
            value={reminder.minute}
            onChange={(d) => changeTime('minute', d)}
          />
        </View>

        {reminder.enabled ? (
          <TouchableOpacity style={styles.saveButton} onPress={saveTime}>
            <Text style={styles.saveButtonText}>Guardar horario</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

function formatTime(c: ReminderConfig): string {
  return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
}

function TimeStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (delta: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity onPress={() => onChange(1)} style={styles.stepperButton}>
        <Text style={styles.stepperButtonText}>▲</Text>
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{String(value).padStart(2, '0')}</Text>
      <TouchableOpacity onPress={() => onChange(-1)} style={styles.stepperButton}>
        <Text style={styles.stepperButtonText}>▼</Text>
      </TouchableOpacity>
    </View>
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
  card: {
    backgroundColor: colors.grayLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.navy,
    marginHorizontal: 12,
  },
  stepper: {
    alignItems: 'center',
  },
  stepperButton: {
    padding: 6,
  },
  stepperButtonText: {
    fontSize: 18,
    color: colors.blue,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.navy,
    minWidth: 56,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.blue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
