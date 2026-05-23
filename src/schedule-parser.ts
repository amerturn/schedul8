/**
 * Parses human-readable schedule definitions into cron expressions.
 * Supports formats like:
 *   - "every 5 minutes"
 *   - "every hour"
 *   - "every day at 9am"
 *   - "every monday at 8:30am"
 *   - "every weekday at noon"
 */

const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const NAMED_TIMES: Record<string, string> = {
  midnight: "0:00",
  noon: "12:00",
  "9am": "9:00",
  "10am": "10:00",
  "11am": "11:00",
  "12pm": "12:00",
  "1pm": "13:00",
  "6pm": "18:00",
};

function parseTime(timeStr: string): { hour: number; minute: number } {
  const resolved = NAMED_TIMES[timeStr.toLowerCase()] ?? timeStr;
  const match = resolved.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid time format: "${timeStr}"`);
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23) throw new Error(`Invalid hour in: "${timeStr}"`);
  if (minute < 0 || minute > 59) throw new Error(`Invalid minute in: "${timeStr}"`);
  return { hour, minute };
}

export function parseSchedule(expression: string): string {
  const expr = expression.trim().toLowerCase();

  // "every N minutes"
  const minutesMatch = expr.match(/^every (\d+) minutes?$/);
  if (minutesMatch) {
    const n = parseInt(minutesMatch[1], 10);
    if (n < 1 || n > 59) throw new Error(`Minute interval out of range: ${n}`);
    return `*/${n} * * * *`;
  }

  // "every N hours"
  const hoursMatch = expr.match(/^every (\d+) hours?$/);
  if (hoursMatch) {
    const n = parseInt(hoursMatch[1], 10);
    if (n < 1 || n > 23) throw new Error(`Hour interval out of range: ${n}`);
    return `0 */${n} * * *`;
  }

  // "every hour"
  if (expr === "every hour") return "0 * * * *";

  // "every day at <time>"
  const dailyMatch = expr.match(/^every day at (.+)$/);
  if (dailyMatch) {
    const { hour, minute } = parseTime(dailyMatch[1].trim());
    return `${minute} ${hour} * * *`;
  }

  // "every weekday at <time>"
  const weekdayMatch = expr.match(/^every weekday at (.+)$/);
  if (weekdayMatch) {
    const { hour, minute } = parseTime(weekdayMatch[1].trim());
    return `${minute} ${hour} * * 1-5`;
  }

  // "every <day> at <time>"
  const namedDayMatch = expr.match(/^every (\w+) at (.+)$/);
  if (namedDayMatch) {
    const dayNum = DAYS_OF_WEEK[namedDayMatch[1]];
    if (dayNum === undefined) throw new Error(`Unknown day: "${namedDayMatch[1]}"`);
    const { hour, minute } = parseTime(namedDayMatch[2].trim());
    return `${minute} ${hour} * * ${dayNum}`;
  }

  throw new Error(`Unrecognized schedule expression: "${expression}"`);
}

/**
 * Describes a cron expression in human-readable form.
 * Useful for confirming that a parsed schedule matches the original intent.
 *
 * @param cron - A cron expression string (5 fields)
 * @returns A plain-English description of the schedule
 */
export function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Expected 5-field cron expression, got: "${cron}"`);
  const [minute, hour, , , weekday] = parts;

  if (minute.startsWith("*/")) return `Every ${minute.slice(2)} minute(s)`;
  if (hour.startsWith("*/")) return `Every ${hour.slice(2)} hour(s) at minute 0`;
  if (hour === "*") return "Every hour";

  const timeLabel = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  if (weekday === "1-5") return `Every weekday at ${timeLabel}`;
  if (weekday === "*") return `Every day at ${timeLabel}`;

  const dayName = Object.keys(DAYS_OF_WEEK).find((d) => DAYS_OF_WEEK[d] === parseInt(weekday, 10));
  return `Every ${dayName ?? `weekday ${weekday}`} at ${timeLabel}`;
}
