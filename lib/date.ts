// All game times are displayed in Israel time regardless of where the
// server actually runs. This matters because these are pages rendered on
// the SERVER (Server Components) — without an explicit timeZone,
// toLocaleString() uses the server machine's local clock, which on most
// hosts (Vercel etc.) defaults to UTC, not the timezone of the people
// actually using this league's app. Hardcoding it here means the display
// is correct no matter where the app is deployed.
const TIME_ZONE = "Asia/Jerusalem";
const LOCALE = "he-IL";

export function formatGameDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  });
}

export function formatGameTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

export function formatGameDateTime(value: string | Date): string {
  return new Date(value).toLocaleString(LOCALE, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}
