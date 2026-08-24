import * as React from 'react';

import { render, screen } from '@/lib/test-utils';
import { HomeScreen } from './home-screen';

describe('homeScreen', () => {
  it('shows the app name followed by Starter as the title', () => {
    render(<HomeScreen />);

    expect(screen.getByTestId('home-title')).toHaveTextContent(
      'MyAppTemplate Starter',
    );
  });

  it('shows the description below the title', () => {
    render(<HomeScreen />);

    expect(screen.getByTestId('home-description')).toBeOnTheScreen();
  });
});
