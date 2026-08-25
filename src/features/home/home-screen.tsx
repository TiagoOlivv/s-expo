import Env from 'env';
import * as React from 'react';

import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { PreferencesBar } from './components/preferences-bar';

export function HomeScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <PreferencesBar />

        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text
            testID="home-title"
            className="text-center text-2xl font-bold"
          >
            {`${Env.EXPO_PUBLIC_NAME} Starter`}
          </Text>
          <Text
            testID="home-description"
            tx="home.description"
            className="text-center text-xs text-neutral-600 dark:text-neutral-400"
          />
        </View>
      </SafeAreaView>
    </>
  );
}
