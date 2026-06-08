import { PH_LOCALE, PH_TIMEZONE } from "../config.js";

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PH_DATE_TIME_OPTIONS = {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: PH_TIMEZONE,
};

function formatPhilippineDateTime(date) {
  return date.toLocaleString(PH_LOCALE, PH_DATE_TIME_OPTIONS);
}

export function formatDateTime(timestamp) {
  return formatPhilippineDateTime(new Date(timestamp));
}

export function formatNewsDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatPhilippineDateTime(date);
}
