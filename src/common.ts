export type Lang = "en" | "es";
export interface L { en: string; es: string }
export const l = (en: string, es: string): L => ({ en, es });
export const t = (x: L, lang: Lang): string => x[lang];
/** Escape text for a markdown table cell. */
export const cell = (s: string): string => s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
