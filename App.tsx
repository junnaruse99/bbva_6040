import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarScreen from './src/screens/CalendarScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import PlanScreen from './src/screens/PlanScreen';
import { criticalAlertDays, fromISO, isWeekday, toISO } from './src/logic/attendance';
import { peruHolidayName, withPeruHolidays } from './src/logic/holidays';
import { applyCriticalAlerts, applyMarkReminder } from './src/notifications';
import { colors } from './src/theme';
import {
  DEFAULT_ALERT,
  DEFAULT_REMINDER,
  loadAlertConfig,
  loadDays,
  loadPlan,
  loadReminder,
  saveAlertConfig,
  savePlan,
  saveReminder,
  setDay,
} from './src/storage/store';
import { DayMap, DayStatus, PlanMap, ReminderConfig } from './src/types';

type Screen = 'checkin' | 'calendar' | 'plan';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('checkin');
  const [days, setDays] = useState<DayMap>({});
  const [plan, setPlan] = useState<PlanMap>({});
  const [markReminder, setMarkReminder] = useState<ReminderConfig>(DEFAULT_REMINDER);
  const [alertConfig, setAlertConfig] = useState<ReminderConfig>(DEFAULT_ALERT);

  const todayISO = toISO(new Date());

  // Reprograma las alertas de cumplimiento del mes actual con los datos vigentes.
  const refreshCriticalAlerts = async (d: DayMap, config: ReminderConfig) => {
    const today = fromISO(todayISO);
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const critical = criticalAlertDays(
      year,
      month,
      withPeruHolidays(d, year),
      todayISO
    );
    await applyCriticalAlerts(config, critical);
  };

  useEffect(() => {
    (async () => {
      const [d, p, r, a] = await Promise.all([
        loadDays(),
        loadPlan(),
        loadReminder(),
        loadAlertConfig(),
      ]);
      setDays(d);
      setPlan(p);
      setMarkReminder(r);
      setAlertConfig(a);
      // Si hoy ya está marcado, es fin de semana o feriado, vamos directo al calendario.
      if (d[todayISO] || !isWeekday(todayISO) || peruHolidayName(todayISO)) {
        setScreen('calendar');
      }
      setLoading(false);
      // Las alertas dependen de la fecha: se recalculan en cada apertura.
      await refreshCriticalAlerts(d, a);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetDay = async (iso: string, status: DayStatus | null) => {
    const next = await setDay(days, iso, status);
    setDays(next);
    // Si el día queda marcado, deja de estar "planificado".
    if (status !== null && plan[iso]) {
      const nextPlan = { ...plan };
      delete nextPlan[iso];
      setPlan(nextPlan);
      await savePlan(nextPlan);
    }
    // Cada cambio de datos puede alterar qué días son críticos.
    await refreshCriticalAlerts(next, alertConfig);
  };

  const handleCheckIn = async (status: DayStatus) => {
    await handleSetDay(todayISO, status);
    setScreen('calendar');
  };

  const handleTogglePlan = async (iso: string) => {
    const next = { ...plan };
    if (next[iso]) {
      delete next[iso];
    } else {
      next[iso] = true;
    }
    setPlan(next);
    await savePlan(next);
  };

  const handleSaveMarkReminder = async (config: ReminderConfig, reschedule: boolean) => {
    setMarkReminder(config);
    await saveReminder(config);
    if (reschedule) {
      await applyMarkReminder(config);
    }
  };

  const handleSaveAlertConfig = async (config: ReminderConfig, reschedule: boolean) => {
    setAlertConfig(config);
    await saveAlertConfig(config);
    if (reschedule) {
      await refreshCriticalAlerts(days, config);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  if (screen === 'checkin') {
    return (
      <SafeAreaView style={styles.flex}>
        <StatusBar style="light" />
        <CheckInScreen
          todayISO={todayISO}
          onAttended={() => handleCheckIn('attended')}
          onAbsent={() => handleCheckIn('absent')}
          onSkip={() => setScreen('calendar')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar style="dark" />
      <View style={styles.flex}>
        {screen === 'calendar' ? (
          <CalendarScreen
            days={days}
            plan={plan}
            todayISO={todayISO}
            onSetDay={handleSetDay}
          />
        ) : (
          <PlanScreen
            days={days}
            plan={plan}
            markReminder={markReminder}
            alertConfig={alertConfig}
            todayISO={todayISO}
            onTogglePlan={handleTogglePlan}
            onSaveMarkReminder={handleSaveMarkReminder}
            onSaveAlertConfig={handleSaveAlertConfig}
          />
        )}
      </View>
      <View style={styles.tabBar}>
        <TabButton
          label="📅 Calendario"
          active={screen === 'calendar'}
          onPress={() => setScreen('calendar')}
        />
        <TabButton
          label="📝 Plan"
          active={screen === 'plan'}
          onPress={() => setScreen('plan')}
        />
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray,
  },
  tabTextActive: {
    color: colors.blue,
  },
});
