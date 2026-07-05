import { addDays, formatISODate } from "../../utils/dates.js";

const weekdays = new Map([
  ["sunday", 0],
  ["ravivar", 0],
  ["monday", 1],
  ["somvar", 1],
  ["tuesday", 2],
  ["mangalvar", 2],
  ["wednesday", 3],
  ["budhvar", 3],
  ["thursday", 4],
  ["guruvar", 4],
  ["friday", 5],
  ["shukravar", 5],
  ["saturday", 6],
  ["shanivar", 6]
]);

function normalizeReference(referenceDate = new Date()) {
  const date = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function nextWeekday(referenceDate, weekday) {
  const current = referenceDate.getUTCDay();
  let delta = weekday - current;
  if (delta <= 0) {
    delta += 7;
  }
  return addDays(referenceDate, delta);
}

export function resolveRelativeDate(message, referenceDate = new Date()) {
  const normalized = message.toLowerCase();
  const base = normalizeReference(referenceDate);

  if (/\b(aaj|today)\b/.test(normalized)) {
    return formatISODate(base);
  }

  if (/\b(kal|tomorrow)\b/.test(normalized)) {
    return formatISODate(addDays(base, 1));
  }

  if (/\b(parso|day after tomorrow)\b/.test(normalized)) {
    return formatISODate(addDays(base, 2));
  }

  for (const [name, index] of weekdays.entries()) {
    if (new RegExp(`\\b(agle|next)?\\s*${name}\\b`, "i").test(normalized)) {
      return formatISODate(nextWeekday(base, index));
    }
  }

  const iso = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) {
    return iso[1];
  }

  return null;
}
