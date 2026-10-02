// All dates are shown in Toronto time, wherever the code runs (Vercel servers are UTC),
// so server and browser render the same text and an evening entry keeps its day.
export const TIME_ZONE = "America/Toronto";

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, ...opts });

const longDate = fmt({ dateStyle: "long" });
const mediumDate = fmt({ dateStyle: "medium" });
const dateTime = fmt({ dateStyle: "medium", timeStyle: "short" });
const monthYear = fmt({ month: "long", year: "numeric" });
const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

type D = string | Date;
const toDate = (d: D) => (typeof d === "string" ? new Date(d) : d);

export const formatLongDate = (d: D) => longDate.format(toDate(d));
export const formatDate = (d: D) => mediumDate.format(toDate(d));
export const formatDateTime = (d: D) => dateTime.format(toDate(d));
export const formatMonth = (d: D) => monthYear.format(toDate(d));

function wallClock(d: Date) {
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** Instant → "YYYY-MM-DDTHH:mm" in Toronto time, for <input type="datetime-local">. */
export function toTorontoInput(d: D) {
  const w = wallClock(toDate(d));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.y}-${pad(w.mo)}-${pad(w.d)}T${pad(w.h)}:${pad(w.mi)}`;
}

/** "YYYY-MM-DDTHH:mm" read as Toronto time → ISO instant. */
export function fromTorontoInput(value: string) {
  const [date, time] = value.split("T");
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const target = Date.UTC(y, mo - 1, d, h, mi);
  // Toronto's offset at an instant = its wall clock (read as UTC) minus the instant.
  const offsetAt = (t: number) => {
    const w = wallClock(new Date(t));
    return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi) - t;
  };
  let t = target - offsetAt(target);
  t = target - offsetAt(t); // second pass settles DST transitions
  return new Date(t).toISOString();
}
