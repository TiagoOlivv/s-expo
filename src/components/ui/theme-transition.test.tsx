import * as React from 'react';
import { Text } from 'react-native';

import { render, screen } from '@/lib/test-utils';
import { ThemeTransition } from './theme-transition';

describe('themeTransition', () => {
  it('renders whatever it wraps', () => {
    render(
      <ThemeTransition>
        <Text>wrapped content</Text>
      </ThemeTransition>,
    );

    expect(screen.getByText('wrapped content')).toBeOnTheScreen();
  });
});
