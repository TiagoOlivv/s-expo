import * as React from 'react';

import { Image, Text, View } from '@/components/ui';

/**
 * The GitHub account the start screen introduces itself with.
 *
 * This is the one value to change when the template seeds a new app — the
 * avatar and the handle below are both derived from it, and GitHub serves
 * `https://github.com/<handle>.png` for any account without an API call or a
 * token.
 */
export const GITHUB_HANDLE = 'tiagoolivv';

/**
 * Avatar and handle for {@link GITHUB_HANDLE}, rendered above the title.
 *
 * The avatar is a remote image, so it arrives a frame or two after the rest of
 * the screen and never at all when the device is offline. The bordered circle
 * is drawn by the surrounding `View`, which keeps the layout the same size
 * either way instead of letting the text jump once the image lands.
 */
export function GithubProfile() {
  return (
    <View className="items-center gap-2">
      <View className="size-24 overflow-hidden rounded-full border border-neutral-300 dark:border-charcoal-700">
        <Image
          testID="home-avatar"
          source={{ uri: `https://github.com/${GITHUB_HANDLE}.png` }}
          accessibilityLabel={`${GITHUB_HANDLE} on GitHub`}
          className="size-full"
        />
      </View>

      <Text
        testID="home-handle"
        className="text-xs text-neutral-500 dark:text-neutral-400"
      >
        {`@${GITHUB_HANDLE}`}
      </Text>
    </View>
  );
}
