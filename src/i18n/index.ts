import { useCallback } from 'react';
import { STRINGS } from './strings';
import { useLanguageStore, type Lang } from '@/stores/languageStore';

// Numerals stay Western (0-9) on both sides per product decision. These are
// kept as no-ops so call sites don't need to change.
export function toFaDigits(input: string | number): string {
  return String(input);
}

export function localizeDigits(input: string | number, _lang: Lang): string {
  return String(input);
}

type Params = Record<string, string | number>;

function format(template: string, params: Params | undefined, lang: Lang): string {
  let out = template;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return lang === 'fa' ? toFaDigits(out) : out;
}

export interface I18n {
  lang: Lang;
  isRTL: boolean;
  /** Translate a key, with optional {placeholder} params. Digits localized for fa. */
  t: (key: string, params?: Params) => string;
  /** Translate a dynamic value via the `opt.` / `focus.` namespace, fallback to raw. */
  tv: (prefix: string, value: string) => string;
  /** Localize a number/string of digits only (no translation). */
  d: (n: string | number) => string;
}

export function useI18n(): I18n {
  const lang = useLanguageStore((s) => s.lang);

  const t = useCallback(
    (key: string, params?: Params): string => {
      const table = STRINGS[lang] ?? STRINGS.en;
      const fallback = STRINGS.en[key];
      const template = table[key] ?? fallback ?? key;
      return format(template, params, lang);
    },
    [lang],
  );

  const tv = useCallback(
    (prefix: string, value: string): string => {
      const key = `${prefix}.${value}`;
      const table = STRINGS[lang] ?? STRINGS.en;
      return table[key] ?? STRINGS.en[key] ?? value;
    },
    [lang],
  );

  const d = useCallback((n: string | number): string => localizeDigits(n, lang), [lang]);

  return { lang, isRTL: lang === 'fa', t, tv, d };
}

// Non-hook helpers for pure modules (e.g. lib/* generators).
export function tStatic(lang: Lang, key: string, params?: Params): string {
  const table = STRINGS[lang] ?? STRINGS.en;
  const template = table[key] ?? STRINGS.en[key] ?? key;
  return format(template, params, lang);
}

export function tvStatic(lang: Lang, prefix: string, value: string): string {
  const key = `${prefix}.${value}`;
  const table = STRINGS[lang] ?? STRINGS.en;
  return table[key] ?? STRINGS.en[key] ?? value;
}
