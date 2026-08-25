import * as React from 'react';

import i18n from '@/lib/i18n';

import { screen, setup } from '@/lib/test-utils';
import { HomeScreen } from './home-screen';

describe('homeScreen', () => {
  // i18n is a module-level singleton, so a language switched in one test would
  // leak into the next one. Resetting before rather than after keeps the change
  // away from a mounted tree, which would otherwise warn about act().
  beforeEach(async () => {
    await i18n.changeLanguage('en-US');
  });

  it('shows the app name followed by Starter as the title', () => {
    setup(<HomeScreen />);

    expect(screen.getByTestId('home-title')).toHaveTextContent(
      'MyAppTemplate Starter',
    );
  });

  it('shows the description below the title', () => {
    setup(<HomeScreen />);

    expect(screen.getByTestId('home-description')).toBeOnTheScreen();
  });

  it('shows the theme and language controls', () => {
    setup(<HomeScreen />);

    expect(screen.getByTestId('theme-button')).toBeOnTheScreen();
    expect(screen.getByTestId('language-button')).toBeOnTheScreen();
  });

  it('re-renders the description when the language is toggled', async () => {
    const { user } = setup(<HomeScreen />);

    expect(screen.getByTestId('home-description')).toHaveTextContent(
      'Delete this screen, add your first feature, and ship.',
    );

    await user.press(screen.getByTestId('language-button'));

    expect(screen.getByTestId('home-description')).toHaveTextContent(
      'Apague esta tela, escreva sua primeira feature e publique.',
    );
  });
});
