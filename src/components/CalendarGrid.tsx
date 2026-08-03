import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { daysOfMonth, fromISO, isWeekday } from '../logic/attendance';
import { colors } from '../theme';
import { DayMap, PlanMap } from '../types';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface Props {
  year: number;
  month: number; // 1-12
  days: DayMap;
  plan?: PlanMap;
  todayISO: string;
  onPressDay?: (iso: string) => void;
}

function dayBackground(iso: string, days: DayMap, plan?: PlanMap): {
  bg: string;
  fg: string;
  borderColor?: string;
} {
  switch (days[iso]) {
    case 'attended':
      return { bg: colors.green, fg: colors.white };
    case 'absent':
      return { bg: colors.redSoft, fg: colors.red };
    case 'vacation':
      return { bg: colors.orangeSoft, fg: colors.orange };
    case 'holiday':
      return { bg: colors.purpleSoft, fg: colors.purple };
  }
  if (plan && plan[iso]) {
    return { bg: colors.lightBlue, fg: colors.blue, borderColor: colors.blue };
  }
  return { bg: 'transparent', fg: isWeekday(iso) ? colors.text : '#B0B0B0' };
}

export default function CalendarGrid({
  year,
  month,
  days,
  plan,
  todayISO,
  onPressDay,
}: Props) {
  const dates = daysOfMonth(year, month);
  // Índice de columna: lunes = 0 ... domingo = 6
  const firstCol = (fromISO(dates[0]).getDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array.from({ length: firstCol }, () => null),
    ...dates,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((l, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.weekday}>{l}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((iso, ci) => {
            if (!iso) return <View key={ci} style={styles.cell} />;
            const { bg, fg, borderColor } = dayBackground(iso, days, plan);
            const isToday = iso === todayISO;
            return (
              <View key={ci} style={styles.cell}>
                <TouchableOpacity
                  onPress={onPressDay ? () => onPressDay(iso) : undefined}
                  disabled={!onPressDay}
                  style={[
                    styles.day,
                    { backgroundColor: bg },
                    borderColor ? { borderWidth: 2, borderColor } : null,
                    isToday ? styles.today : null,
                  ]}
                >
                  <Text style={[styles.dayText, { color: fg }]}>
                    {fromISO(iso).getDate()}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  weekday: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray,
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 2,
    borderColor: colors.navy,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
