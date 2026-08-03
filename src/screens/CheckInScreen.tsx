import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fromISO } from '../logic/attendance';
import { colors } from '../theme';
import { MONTH_NAMES } from '../components/MonthHeader';

const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

interface Props {
  todayISO: string;
  onAttended: () => void;
  onAbsent: () => void;
  onSkip: () => void;
}

export default function CheckInScreen({
  todayISO,
  onAttended,
  onAbsent,
  onSkip,
}: Props) {
  const d = fromISO(todayISO);
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>6040</Text>
      <Text style={styles.date}>
        {DAY_NAMES[d.getDay()]} {d.getDate()} de {MONTH_NAMES[d.getMonth()]}
      </Text>
      <Text style={styles.question}>¿Fuiste hoy a la oficina?</Text>

      <TouchableOpacity
        style={[styles.button, styles.yes]}
        onPress={onAttended}
        accessibilityLabel="Sí fui a la oficina"
      >
        <Text style={styles.buttonEmoji}>🏢</Text>
        <Text style={styles.buttonText}>Sí, fui</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.no]}
        onPress={onAbsent}
        accessibilityLabel="No fui a la oficina"
      >
        <Text style={styles.buttonEmoji}>🏠</Text>
        <Text style={styles.buttonText}>No fui</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSkip} style={styles.skip}>
        <Text style={styles.skipText}>Saltar por ahora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.aqua,
    letterSpacing: 4,
  },
  date: {
    fontSize: 16,
    color: colors.lightBlue,
    marginTop: 8,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginVertical: 40,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  yes: {
    backgroundColor: colors.green,
  },
  no: {
    backgroundColor: colors.blue,
  },
  buttonEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  skip: {
    marginTop: 16,
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: colors.lightBlue,
    textDecorationLine: 'underline',
  },
});
