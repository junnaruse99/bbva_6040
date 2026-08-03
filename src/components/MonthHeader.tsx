import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface Props {
  year: number;
  month: number; // 1-12
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthHeader({ year, month, onPrev, onNext }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPrev} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title}>
        {MONTH_NAMES[month - 1]} {year}
      </Text>
      <TouchableOpacity onPress={onNext} style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  arrow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  arrowText: {
    fontSize: 28,
    color: colors.blue,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
});
