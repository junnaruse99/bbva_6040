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
import { isWeekday, toISO } from './src/logic/attendance';
import { peruHolidayName } from './src/logic/holidays';
import { colors } from './src/theme';
import {
  DEFAULT_REMINDER,
  loadDays,
  loadPlan,
  loadReminder,
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
  const [reminder, setReminder] = useState<ReminderConfig>(DEFAULT_REMINDER);

  const todayISO = toISO(new Date());

  useEffect(() => {
    (async () => {
      const [d, p, r] = await Promise.all([loadDays(), loadPlan(), loadReminder()]);
      setDays(d);
      setPlan(p);
      setReminder(r);
      // Si hoy ya está marcado, es fin de semana o feriado, vamos directo al calendario.
      if (d[todayISO] || !isWeekday(todayISO) || peruHolidayName(todayISO)) {
        setScreen('calendar');
      }
      setLoading(false);
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

  const handleSaveReminder = async (config: ReminderConfig) => {
    setReminder(config);
    await saveReminder(config);
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
            reminder={reminder}
            todayISO={todayISO}
            onTogglePlan={handleTogglePlan}
            onSaveReminder={handleSaveReminder}
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
