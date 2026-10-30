// Timekeeping helpers. Timestamps are unix ms UTC; show dates/times are IST local.

export const nowMs = () => Date.now()

const IST_OFFSET_MIN = 330 // Asia/Kolkata = UTC+5:30, no DST

/** Current IST wall-clock date as YYYY-MM-DD. */
export function todayLocalDate(at = nowMs()) {
  const ist = new Date(at + IST_OFFSET_MIN * 60_000)
  return ist.toISOString().slice(0, 10)
}

/** Which time band an "HH:mm" (IST) falls in. */
export function bandForTime(hhmm) {
  const [h] = hhmm.split(':').map(Number)
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 16) return 'afternoon'
  if (h >= 16 && h < 20) return 'evening'
  return 'night'
}

/** Does a show's start time satisfy the alert's requested band? */
export function timeMatchesBand(hhmm, band) {
  return band === 'any' || bandForTime(hhmm) === band
}

/** End-of-day (IST) for a show date, as unix ms — used for alert expiry. */
export function endOfShowDateMs(showDate) {
  // 23:59 IST on that date, converted back to UTC ms.
  const [y, m, d] = showDate.split('-').map(Number)
  const istMidnightUtc = Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET_MIN * 60_000
  return istMidnightUtc + 24 * 60 * 60_000 - 60_000
}
