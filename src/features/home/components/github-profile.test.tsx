import { cleanup, render, screen } from '@/lib/test-utils';

import { GITHUB_HANDLE, GithubProfile } from './github-profile';

afterEach(cleanup);

describe('githubProfile', () => {
  it('renders the avatar served by GitHub for the handle', () => {
    render(<GithubProfile />);

    expect(screen.getByTestId('home-avatar').props.source).toEqual({
      uri: `https://github.com/${GITHUB_HANDLE}.png`,
    });
  });

  it('renders the handle', () => {
    render(<GithubProfile />);

    expect(screen.getByTestId('home-handle')).toHaveTextContent(
      `@${GITHUB_HANDLE}`,
    );
  });

  it('describes the avatar for screen readers', () => {
    render(<GithubProfile />);

    // The image carries the only visual identity on the screen, so it needs a
    // label of its own - "image" is what a screen reader announces otherwise.
    expect(screen.getByTestId('home-avatar').props.accessibilityLabel).toBe(
      `${GITHUB_HANDLE} on GitHub`,
    );
  });
});
