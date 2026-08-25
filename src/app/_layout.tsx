import type { ViewProps } from 'react-native';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useThemeConfig } from '@/components/ui/use-theme-config';

import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
// Import  global CSS file
import '../global.css';

export { ErrorBoundary } from 'expo-router';

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: 'index',
};

loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  const hasHiddenSplash = React.useRef(false);

  const onLayoutRootView = React.useCallback(() => {
    if (hasHiddenSplash.current) {
      return;
    }

    hasHiddenSplash.current = true;
    SplashScreen.hide();
  }, []);

  return (
    <Providers onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </Providers>
  );
}

function Providers({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout: ViewProps['onLayout'];
}) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      onLayout={onLayout}
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            {children}
            <FlashMessage position="top" />
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
