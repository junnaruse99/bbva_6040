import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarGrid from '../components/CalendarGrid';
import MonthHeader from '../components/MonthHeader';
import { fromISO, monthStats } from '../logic/attendance';
import { peruHolidayName, withPeruHolidays } from '../logic/holidays';
import { colors } from '../theme';
import { DayMap, DayStatus, PlanMap } from '../types';

interface Props {
  days: DayMap;
  plan: PlanMap;
  todayISO: string;
  onSetDay: (iso: string, status: DayStatus | null) => void;
}

const STATUS_OPTIONS: { status: DayStatus | null; label: string; color: string }[] = [
  { status: 'attended', label: '🏢 Fui a la oficina', color: colors.green },
  { status: 'absent', label: '🏠 No fui', color: colors.red },
  { status: 'vacation', label: '🏖️ Vacaciones', color: colors.orange },
  { status: 'holiday', label: '🎉 Feriado', color: colors.purple },
  { status: null, label: '✖️ Limpiar', color: colors.gray },
];

export default function CalendarScreen({ days, plan, todayISO, onSetDay }: Props) {
  const today = fromISO(todayISO);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selected, setSelected] = useState<string | null>(null);

  // Feriados de Perú precargados; lo que marque el usuario tiene prioridad.
  const effectiveDays = withPeruHolidays(days, year);
  const stats = monthStats(year, month, effectiveDays, todayISO);

  const move = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  let statusColor = colors.blue;
  let statusText = `Te faltan ${stats.remaining} día${stats.remaining === 1 ? '' : 's'} este mes`;
  if (stats.completed) {
    statusColor = colors.green;
    statusText = '✅ ¡Meta cumplida este mes!';
  } else if (!stats.achievable) {
    statusColor = colors.red;
    statusText = `⚠️ Ya no es posible cumplir: faltan ${stats.remaining} y solo quedan ${stats.available} día${stats.available === 1 ? '' : 's'} disponibles`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MonthHeader
        year={year}
        month={month}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
      />

      <View style={[styles.banner, { backgroundColor: statusColor }]}>
        <Text style={styles.bannerText}>{statusText}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Meta" value={stats.required} />
        <Stat label="Asistidos" value={stats.attended} />
        <Stat label="Faltan" value={stats.remaining} />
        <Stat label="Disponibles" value={stats.available} />
      </View>

      <CalendarGrid
        year={year}
        month={month}
        days={effectiveDays}
        plan={plan}
        todayISO={todayISO}
        onPressDay={setSelected}
      />

      <View style={styles.legend}>
        <LegendItem color={colors.green} label="Fui" />
        <LegendItem color={colors.redSoft} label="No fui" />
        <LegendItem color={colors.orangeSoft} label="Vacaciones" />
        <LegendItem color={colors.purpleSoft} label="Feriado" />
        <LegendItem color={colors.lightBlue} label="Planificado" />
      </View>

      <Text style={styles.hint}>
        Toca un día para marcarlo. La meta es el 60% de los días laborables
        (menos vacaciones y feriados), redondeado hacia arriba. Los feriados de
        Perú 🇵🇪 ya vienen precargados; si fuiste un feriado, márcalo y contará.
      </Text>

      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelected(null)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selected ? `Día ${fromISO(selected).getDate()}` : ''}
            </Text>
            {selected && peruHolidayName(selected) ? (
              <Text style={styles.modalSubtitle}>
                🇵🇪 {peruHolidayName(selected)}
              </Text>
            ) : null}
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.modalOption, { borderColor: opt.color }]}
                onPress={() => {
                  if (selected) onSetDay(selected, opt.status);
                  setSelected(null);
                }}
              >
                <Text style={[styles.modalOptionText, { color: opt.color }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
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
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 3,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: 12,
    color: colors.gray,
  },
  hint: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.purple,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 12,
  },
  modalOption: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
