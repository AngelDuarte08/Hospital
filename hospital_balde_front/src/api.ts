/** Base del backend. Vacío = rutas relativas (proxy de Vite en dev o mismo host en prod). */
export function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

export const jsonHeaders = {
  "Content-Type": "application/json",
} as const;
