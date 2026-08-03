/** Estado de un día registrado por el usuario. */
export type DayStatus = 'attended' | 'absent' | 'vacation' | 'holiday';

/** Mapa fecha ISO (YYYY-MM-DD) -> estado del día. */
export type DayMap = Record<string, DayStatus>;

/** Días planificados: fecha ISO -> true. */
export type PlanMap = Record<string, true>;

export interface ReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface MonthStats {
  /** Días laborables (lun-vie) del mes. */
  workdays: number;
  /** Laborables descontando vacaciones y feriados. */
  baseDays: number;
  /** Días que hay que ir: ceil(baseDays * 0.6). */
  required: number;
  /** Días ya marcados como asistidos en el mes. */
  attended: number;
  /** Días que aún faltan para cumplir. */
  remaining: number;
  /** Días laborables disponibles de hoy (inclusive) a fin de mes. */
  available: number;
  /** false si ya no alcanzan los días del mes para cumplir. */
  achievable: boolean;
  /** true si ya se cumplió la meta. */
  completed: boolean;
}
