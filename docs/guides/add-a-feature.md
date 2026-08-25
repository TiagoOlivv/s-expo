# Adding a feature

A worked example: a `profile` feature with a screen, a query and a store.

## 1. Branch

```bash
git checkout main && git pull
git checkout -b feat/profile
```

## 2. Test first

```bash
mkdir -p src/features/profile/components
```

```tsx
// src/features/profile/profile-screen.test.tsx
import { render, screen } from '@/lib/test-utils';
import { ProfileScreen } from './profile-screen';

describe('profileScreen', () => {
  it('shows the screen title', () => {
    render(<ProfileScreen />);
    expect(screen.getByTestId('profile-title')).toBeOnTheScreen();
  });
});
```

Run it and watch it fail on the missing module. That failure is the proof the test is wired to the thing you are about to write.

```bash
./node_modules/.bin/jest src/features/profile --forceExit
```

## 3. Screen

```tsx
// src/features/profile/profile-screen.tsx
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

export function ProfileScreen() {
  return (
    <>
      <FocusAwareStatusBar />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-6">
          <Text testID="profile-title" className="text-3xl font-bold">
            {translate('profile.title')}
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
```

## 4. Translations

Add the key to **every** file in `src/translations/`, alphabetically. `pnpm lint:translations` compares each locale against `en-us.json` and fails on a key present in one and missing in another.

```json
{ "profile": { "title": "Profile" } }
```

## 5. Route

```tsx
// src/app/profile.tsx
export { ProfileScreen as default } from '@/features/profile/profile-screen';
```

One line. No logic in `src/app/`.

## 6. Data, when the screen needs it

```ts
// src/features/profile/api.ts
import type { AxiosError } from 'axios';
import { createQuery } from 'react-query-kit';
import { client } from '@/lib/api';

type Profile = { id: string; name: string };

export const useProfile = createQuery<Profile, void, AxiosError>({
  queryKey: ['profile'],
  fetcher: () => client.get('me').then(response => response.data),
});
```

Test it by mocking `@/lib/api`, not the network. [../reference/removed-patterns.md](../reference/removed-patterns.md) has a complete example.

## 7. State, when it outlives the screen

```ts
// src/features/profile/use-profile-store.tsx
import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';

const _useProfileStore = create<ProfileState>(set => ({ /* … */ }));
export const useProfileStore = createSelectors(_useProfileStore);
```

Server data stays in TanStack Query. A store is for client state — a draft, a filter, a session.

## 8. Verify and open a pull request

```bash
pnpm check-all
git push -u origin feat/profile
```

## The checklist

- [ ] Test written before the implementation, and seen failing
- [ ] Screen is `<feature>-screen.tsx`, named export
- [ ] Route is a one-line re-export
- [ ] No import from another feature
- [ ] No `index.ts` barrel inside the feature
- [ ] Every string goes through `translate`, and every locale has the key
- [ ] Styling is Tailwind classes; new colours are `@theme` tokens
- [ ] `pnpm check-all` green
