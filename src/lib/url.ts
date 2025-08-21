import { api } from "../api";
export function toAbsolute(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "http://localhost:4000";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}
export function toAbsoluteUrl(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "http://localhost:4000";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}