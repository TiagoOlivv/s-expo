import Env from 'env';
import * as React from 'react';

import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { PreferencesBar } from './components/preferences-bar';

export function HomeScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <PreferencesBar />

        <View className="flex-1 justify-center gap-4 px-6">
          <Text testID="home-title" className="text-4xl font-bold">
            {`${Env.EXPO_PUBLIC_NAME} Starter`}
          </Text>
          <Text
            testID="home-description"
            className="text-base/6 text-neutral-600 dark:text-neutral-400"
          >
            {translate('home.description')}
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
