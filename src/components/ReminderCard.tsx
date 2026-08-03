import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import { ReminderConfig } from '../types';

interface Props {
  title: string;
  subtitle: string;
  config: ReminderConfig;
  onToggle: (enabled: boolean) => void;
  onChangeTime: (field: 'hour' | 'minute', delta: number) => void;
  onSaveTime: () => void;
}

export default function ReminderCard({
  title,
  subtitle,
  config,
  onToggle,
  onChangeTime,
  onSaveTime,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Switch
          value={config.enabled}
          onValueChange={onToggle}
          trackColor={{ true: colors.blue }}
        />
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.timeRow}>
        <TimeStepper value={config.hour} onChange={(d) => onChangeTime('hour', d)} />
        <Text style={styles.timeSeparator}>:</Text>
        <TimeStepper
          value={config.minute}
          onChange={(d) => onChangeTime('minute', d)}
        />
      </View>

      {config.enabled ? (
        <TouchableOpacity style={styles.saveButton} onPress={onSaveTime}>
          <Text style={styles.saveButtonText}>Guardar horario</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
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
  card: {
    backgroundColor: colors.grayLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    flexShrink: 1,
    paddingRight: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
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
    marginTop: 14,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
