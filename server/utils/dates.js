const INDIA_TIME_ZONE = "Asia/Kolkata";

export function formatISODate(date) {
  const value = date instanceof Date ? date : new Date(date);
  return value.toISOString().slice(0, 10);
}

export function indiaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day)
  };
}

export function indiaStartOfDay(date = new Date()) {
  const { year, month, day } = indiaDateParts(date);
  return new Date(Date.UTC(year, month - 1, day, -5, -30, 0, 0));
}

export function indiaEndOfDay(date = new Date()) {
  const start = indiaStartOfDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function monthStart(date = new Date()) {
  const { year, month } = indiaDateParts(date);
  return new Date(Date.UTC(year, month - 1, 1, -5, -30, 0, 0));
}

export function weekEndFrom(date = new Date()) {
  return new Date(indiaStartOfDay(date).getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}
