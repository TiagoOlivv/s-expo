import * as React from 'react';

import {
  FocusAwareStatusBar,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { translate } from '@/lib/i18n';

export function HomeScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="px-4">
        <SafeAreaView className="flex-1 gap-2">
          <Text className="text-xl font-bold">{translate('home.title')}</Text>
          <Text className="text-neutral-600 dark:text-neutral-400">
            {translate('home.description')}
          </Text>
          <View testID="home-screen" />
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
