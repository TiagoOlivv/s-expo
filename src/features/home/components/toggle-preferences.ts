import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import type { Language } from '@/lib/i18n/resources';

/** The theme actually on screen, after `system` has been resolved by Uniwind. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * The chip is a toggle, not a picker, so it flips whatever is currently on
 * screen. Taking the resolved theme rather than the stored preference keeps it
 * correct when the preference is `system`.
 */
export function nextTheme(resolved: ResolvedTheme): ColorSchemeType {
  return resolved === 'dark' ? 'light' : 'dark';
}

export function nextLanguage(current: Language | undefined): Language {
  return current === 'pt-BR' ? 'en-US' : 'pt-BR';
}
