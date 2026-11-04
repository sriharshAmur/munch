export const number = (n: number) =>
  new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(n);
export const euros = (cents: number, whole = false) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
export const percent = (share: number) => `${Math.round(share * 100)}%`;
export const date = (iso: string, long = false) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    ...(long
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { weekday: 'short', day: 'numeric', month: 'short' }),
  }).format(new Date(iso));
export const month = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
export const time = (hour: number) =>
  `${String(((hour % 24) + 24) % 24).padStart(2, '0')}:00`;
export const plural = (count: number, word: string) =>
  `${number(count)} ${word}${count === 1 ? '' : 's'}`;
/** Minutes after midnight as a 24-hour clock time. */
export const clock = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
export const monthName = (month: number) =>
  [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][month - 1] ?? '';
/** "2020-03" as "March 2020". */
export const monthKey = (key: string) =>
  `${monthName(Number(key.slice(5, 7)))} ${key.slice(0, 4)}`;
/** 1.19 as "19% more". */
export const more = (ratio: number) => `${Math.round((ratio - 1) * 100)}% more`;
/** "3 Oct", for axes and tight spaces. */
export const day = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short' }).format(
    new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso),
  );
/** How long ago, in the words a person would use: "today", "3 weeks ago". */
export function ago(iso: string, now: string) {
  const days = Math.floor((Date.parse(now) - Date.parse(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 730) return `${Math.round(days / 30.4)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}
/** "every 12 days", "every week", "about every 2 months". */
export function every(days: number) {
  if (days <= 1.5) return 'every day';
  if (days < 6) return `every ${Math.round(days)} days`;
  if (days < 9) return 'every week';
  if (days < 25) return `every ${Math.round(days)} days`;
  if (days < 45) return 'about once a month';
  return `about every ${Math.round(days / 30.4)} months`;
}
/** 0.17 as "1 in 6", for shares a person can picture. */
export function oneIn(share: number) {
  if (share <= 0) return 'none';
  if (share >= 0.5) return `${Math.round(share * 10)} in 10`;
  return `1 in ${Math.round(1 / share)}`;
}
