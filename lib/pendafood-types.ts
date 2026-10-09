/** Numeric daily measurements used by the trends dashboard. */
export type TrendLog = {
  log_date: string;
  pain_score: number | null;
  urgency_score: number | null;
  bloating_score: number | null;
  cramping_score: number | null;
  energy_score: number | null;
  water_glasses: number | null;
  stool_count: number | null;
  blood_seen: boolean | null;
  mucus_seen: boolean | null;
};
