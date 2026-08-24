import type { ResolvedTheme } from './toggle-preferences';
import * as React from 'react';

import { useUniwind } from 'uniwind';
import { Pressable, Text, View } from '@/components/ui';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { useSelectedLanguage } from '@/lib/i18n';
import { nextLanguage, nextTheme } from './toggle-preferences';

/**
 * Theme and language toggles, anchored to the top-right of the screen.
 * Each one flips straight to the other value — no picker, no bottom sheet.
 */
export function PreferencesBar() {
  return (
    <View className="flex-row items-center justify-end gap-2 px-6 pt-2">
      <ThemeToggle />
      <LanguageToggle />
    </View>
  );
}

function ThemeToggle() {
  const { theme } = useUniwind();
  const { setSelectedTheme } = useSelectedTheme();
  const resolved = theme as ResolvedTheme;

  return (
    <Toggle
      testID="theme-button"
      accessibilityLabel={`Switch to ${nextTheme(resolved)} theme`}
      label={resolved === 'dark' ? '🌙' : '🌞'}
      onPress={() => setSelectedTheme(nextTheme(resolved))}
    />
  );
}

function LanguageToggle() {
  const { language, setLanguage } = useSelectedLanguage();

  return (
    <Toggle
      testID="language-button"
      accessibilityLabel={`Switch to ${nextLanguage(language)}`}
      label={language === 'pt-BR' ? 'PT' : 'EN'}
      onPress={() => setLanguage(nextLanguage(language))}
    />
  );
}

type ToggleProps = {
  testID: string;
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
};

function Toggle({ testID, accessibilityLabel, label, onPress }: ToggleProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="size-10 items-center justify-center rounded-full border border-neutral-300 dark:border-charcoal-700 dark:bg-charcoal-850"
    >
      <Text className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        {label}
      </Text>
    </Pressable>
  );
}
