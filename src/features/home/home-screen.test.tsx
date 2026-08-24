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

  it('shows the settings sections', () => {
    render(<HomeScreen />);

    expect(screen.getByText('General')).toBeOnTheScreen();
    expect(screen.getByText('About')).toBeOnTheScreen();
    expect(screen.getByText('Language')).toBeOnTheScreen();
    expect(screen.getByText('Theme')).toBeOnTheScreen();
  });

  it('shows the style guide sections', () => {
    render(<HomeScreen />);

    expect(screen.getByText('Typography')).toBeOnTheScreen();
    expect(screen.getByText('Colors')).toBeOnTheScreen();
    expect(screen.getByText('Buttons')).toBeOnTheScreen();
    expect(screen.getByText('Form')).toBeOnTheScreen();
  });
});
