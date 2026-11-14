/**
 * Computes Indian Income Tax Assessment Year (AY) based on date.
 * If month >= April (4), AY starts in the current year.
 * Else (Jan-Mar), AY starts in the previous year.
 * e.g., Nov 2026 -> "2026-27"; Jan 2027 -> "2026-27"; Apr 2027 -> "2027-28"
 */
export function getCurrentAssessmentYear(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const start = month >= 4 ? year : year - 1;
  const end = (start + 1) % 100;
  return `${start}-${end.toString().padStart(2, '0')}`;
}

export const CURRENT_ASSESSMENT_YEAR = getCurrentAssessmentYear();
