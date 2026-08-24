import Env from 'env';
import * as React from 'react';

import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { Buttons } from './components/buttons-demo';
import { Colors } from './components/colors-demo';
import { Inputs } from './components/inputs-demo';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';
import { Typography } from './components/typography-demo';

export function HomeScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <View className="px-4 pt-4 pb-2">
          <Text testID="home-title" className="text-3xl font-bold">
            {`${Env.EXPO_PUBLIC_NAME} Starter`}
          </Text>
        </View>

        <ScrollView className="flex-1 px-4" testID="home-scroll">
          <SettingsContainer title="settings.general">
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SettingsContainer title="settings.about">
            <SettingsItem text="settings.app_name" value={Env.EXPO_PUBLIC_NAME} />
            <SettingsItem text="settings.version" value={Env.EXPO_PUBLIC_VERSION} />
          </SettingsContainer>

          <View className="pb-8">
            <Typography />
            <Colors />
            <Buttons />
            <Inputs />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
