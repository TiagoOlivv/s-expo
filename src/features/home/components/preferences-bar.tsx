import type { OptionType } from '@/components/ui';
import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import type { Language } from '@/lib/i18n/resources';

import * as React from 'react';
import { Options, Pressable, Text, useModal, View } from '@/components/ui';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { translate, useSelectedLanguage } from '@/lib/i18n';

/**
 * Compact theme and language switchers, anchored to the top-left of the screen.
 * Each chip shows the active value and opens its own bottom sheet.
 */
export function PreferencesBar() {
  return (
    <View className="flex-row items-center gap-2 px-6 pt-2">
      <ThemeChip />
      <LanguageChip />
    </View>
  );
}

function ThemeChip() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const modal = useModal();

  const options = React.useMemo(
    () => [
      { label: `🌙 ${translate('preferences.theme.dark')}`, value: 'dark' },
      { label: `🌞 ${translate('preferences.theme.light')}`, value: 'light' },
      { label: `⚙️ ${translate('preferences.theme.system')}`, value: 'system' },
    ],
    [],
  );

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setSelectedTheme(option.value as ColorSchemeType);
      modal.dismiss();
    },
    [setSelectedTheme, modal],
  );

  const selected = options.find(option => option.value === selectedTheme);

  return (
    <>
      <Chip
        testID="theme-button"
        label={selected?.label ?? selectedTheme}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={options}
        onSelect={onSelect}
        value={selectedTheme}
      />
    </>
  );
}

function LanguageChip() {
  const { language, setLanguage } = useSelectedLanguage();
  const modal = useModal();

  const options = React.useMemo(
    () => [
      { label: translate('preferences.english'), value: 'en-US' },
      { label: translate('preferences.portuguese'), value: 'pt-BR' },
    ],
    [],
  );

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );

  const selected = options.find(option => option.value === language);

  return (
    <>
      <Chip
        testID="language-button"
        label={selected?.value ?? 'en-US'}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={options}
        onSelect={onSelect}
        value={language}
      />
    </>
  );
}

type ChipProps = {
  testID: string;
  label: string;
  onPress: () => void;
};

function Chip({ testID, label, onPress }: ChipProps) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="rounded-full border border-neutral-300 px-3 py-1.5 dark:border-charcoal-700 dark:bg-charcoal-850"
    >
      <Text className="text-sm text-neutral-700 dark:text-neutral-200">
        {label}
      </Text>
    </Pressable>
  );
}
