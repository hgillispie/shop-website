// "Date written" is a pure calendar date (from an <input type="date">, no
// time-of-day meaning), but it's stored in a `timestamp` column as UTC
// midnight for that date — a plain "YYYY-MM-DD" string coerces to UTC
// midnight via the native Date parser, not local midnight. Displaying that
// instant with the default (local-timezone) toLocaleDateString() shifts it
// back a day for any timezone behind UTC. Forcing timeZone: "UTC" here
// reads back the same calendar date that was typed in, regardless of the
// server's or viewer's own timezone.
export function formatDateWritten(date: Date): string {
  return date.toLocaleDateString(undefined, { timeZone: "UTC" });
}
