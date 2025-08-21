import { api } from "../api";
export function toAbsolute(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "https://timetrackerbackendapi-production.up.railway.app/";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}
export function toAbsoluteUrl(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "https://timetrackerbackendapi-production.up.railway.app/";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}