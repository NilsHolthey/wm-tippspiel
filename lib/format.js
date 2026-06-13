import { KO_HEADERS, KO_SHORT } from "./constants";

export function formatDate(iso) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }) +
    " · " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
  );
}

export function dayLabel(d) {
  return KO_HEADERS[d] ?? `Spieltag ${d}`;
}

export function matchdayShort(d) {
  return d <= 17 ? `T${d}` : (KO_SHORT[d] ?? `T${d}`);
}
