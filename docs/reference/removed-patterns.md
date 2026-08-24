# Removed reference patterns

This template was trimmed down to a single screen showing a title and a
description. Everything below was working code in this repository before that
trim. It is kept here verbatim so the conventions it demonstrates can be written
up properly in `docs/` and re-introduced when the first real feature lands.

Nothing here is wired into the app. Every snippet is recoverable from git:

| Pattern | Commit | Command |
| --- | --- | --- |
| Feed feature, onboarding | `142bb4e` | `git show 142bb4e:src/features/feed/api.ts` |
| Auth feature, login form | `6e8caa4` | `git show 6e8caa4:src/features/auth/components/login-form.tsx` |
| Settings rows, style guide | `9adc04e` | `git show 9adc04e:src/features/home/components/theme-item.tsx` |

---

## Data fetching


### Queries and mutations with react-query-kit

The canonical shape for a feature's `api.ts`: typed response and variables, `createQuery` for reads, `createMutation` for writes, all going through the shared axios `client` in `src/lib/api`. Errors are typed as `AxiosError` so callers can narrow them.

Source: `src/features/feed/api.ts`

```ts
import type { AxiosError } from 'axios';
import { createMutation, createQuery } from 'react-query-kit';
import { client } from '@/lib/api';

// Types
export type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

// Hooks
type PostsResponse = Post[];
type PostsVariables = void;

export const usePosts = createQuery<PostsResponse, PostsVariables, AxiosError>({
  queryKey: ['posts'],
  fetcher: () => {
    return client.get(`posts`).then(response => response.data.posts);
  },
});

type PostResponse = Post;
type PostVariables = { id: string };

export const usePost = createQuery<PostResponse, PostVariables, AxiosError>({
  queryKey: ['posts'],
  fetcher: (variables) => {
    return client
      .get(`posts/${variables.id}`)
      .then(response => response.data);
  },
});

type AddPostResponse = Post;
type AddPostVariables = { title: string; body: string; userId: number };

export const useAddPost = createMutation<AddPostResponse, AddPostVariables, AxiosError>({
  mutationFn: async variables =>
    client({
      url: 'posts/add',
      method: 'POST',
      data: variables,
    }).then(response => response.data),
});
```

### Testing a query hook

Mocks the axios client rather than the network, wraps the hook in a `QueryClientProvider` with retries disabled, and asserts both the request shape and the resolved data.

Source: `src/features/auth/api.test.ts`

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import * as React from 'react';
import { client } from '@/lib/api';
import { useLogin } from './api';

jest.mock('@/lib/api', () => ({
  client: jest.fn(),
}));

const mockedClient = client as unknown as jest.Mock;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useLogin', () => {
  beforeEach(() => {
    mockedClient.mockReset();
  });

  it('posts the credentials to the login endpoint', async () => {
    mockedClient.mockResolvedValue({
      data: { access: 'access-token', refresh: 'refresh-token' },
    });

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    result.current.mutate({ email: 'user@test.com', password: 'password' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedClient).toHaveBeenCalledWith({
      url: 'auth/login',
      method: 'POST',
      data: { email: 'user@test.com', password: 'password' },
    });
    expect(result.current.data).toEqual({
      access: 'access-token',
      refresh: 'refresh-token',
    });
  });

  it('surfaces the error when the request fails', async () => {
    mockedClient.mockRejectedValue(new Error('Invalid credentials'));

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    result.current.mutate({ email: 'user@test.com', password: 'wrong' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

---

## Client state

### Zustand store with generated selectors

`createSelectors` wraps the store so consumers subscribe to one slice at a time (`useAuthStore.use.status()`) instead of re-rendering on every change. The plain `signIn` / `signOut` / `hydrate` exports let non-React code drive the store — `hydrateAuth()` runs once at module scope in the root layout.

Source: `src/features/auth/use-auth-store.tsx`

```tsx
import type { TokenType } from '@/lib/auth/utils';

import { create } from 'zustand';
import { getToken, removeToken, setToken } from '@/lib/auth/utils';
import { createSelectors } from '@/lib/utils';

type AuthState = {
  token: TokenType | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: TokenType) => void;
  signOut: () => void;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  signIn: (token) => {
    setToken(token);
    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeToken();
    set({ status: 'signOut', token: null });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      if (userToken !== null) {
        get().signIn(userToken);
      }
      else {
        get().signOut();
      }
    }
    catch (e) {
      // only to remove eslint error, handle the error properly
      console.error(e);
      // catch error here
      // Maybe sign_out user!
    }
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut();
export const signIn = (token: TokenType) => _useAuthStore.getState().signIn(token);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
```

---

## Forms

### TanStack Form with a Zod schema

One Zod schema is both the validator and the source of the form's TypeScript type (`z.infer`). `form.Field` renders each input, `getFieldError` adapts field state to the design system's `error` prop, and `form.Subscribe` isolates the submit button so typing does not re-render the whole form.

Source: `src/features/auth/components/login-form.tsx`

```tsx
import { useForm } from '@tanstack/react-form';

import * as React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import * as z from 'zod';

import { Button, Input, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';

const schema = z.object({
  name: z.string().optional(),
  email: z
    .string({
      message: 'Email is required',
    })
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string({
      message: 'Password is required',
    })
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type FormType = z.infer<typeof schema>;

export type LoginFormProps = {
  onSubmit?: (data: FormType) => void;
};

export function LoginForm({ onSubmit = () => {} }: LoginFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },

    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={10}
    >
      <View className="flex-1 justify-center p-4">
        <View className="items-center justify-center">
          <Text
            testID="form-title"
            className="pb-6 text-center text-4xl font-bold"
          >
            Sign In
          </Text>

          <Text className="mb-6 max-w-xs text-center text-gray-500">
            Welcome! 👋 This is a demo login screen! Feel free to use any email
            and password to sign in and try it out.
          </Text>
        </View>

        <form.Field
          name="name"
          children={field => (
            <Input
              testID="name"
              label="Name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Field
          name="email"
          children={field => (
            <Input
              testID="email-input"
              label="Email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Field
          name="password"
          children={field => (
            <Input
              testID="password-input"
              label="Password"
              placeholder="***"
              secureTextEntry={true}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              error={getFieldError(field)}
            />
          )}
        />

        <form.Subscribe
          selector={state => [state.isSubmitting]}
          children={([isSubmitting]) => (
            <Button
              testID="login-button"
              label="Login"
              onPress={form.handleSubmit}
              loading={isSubmitting}
            />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

## Settings rows

### Section container

Groups rows in a bordered card. `title` is typed as `TxKeyPath`, so an unknown translation key is a compile error rather than a missing string at runtime.

Source: `src/features/home/components/settings-container.tsx`

```tsx
import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Text, View } from '@/components/ui';

type Props = {
  children: React.ReactNode;
  title?: TxKeyPath;
};

export function SettingsContainer({ children, title }: Props) {
  return (
    <>
      {title && <Text className="pt-4 pb-2 text-lg" tx={title} />}
      <View className="rounded-md border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800">
        {children}
      </View>
    </>
  );
}
```

### Row

One row: optional leading icon, translated label, trailing value, and a chevron that only appears when the row is pressable. `pointerEvents` is switched off for read-only rows so they do not swallow touches.

Source: `src/features/home/components/settings-item.tsx`

```tsx
import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Pressable, Text, View } from '@/components/ui';
import { ArrowRight } from '@/components/ui/icons';

type ItemProps = {
  text: TxKeyPath;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export function SettingsItem({ text, value, icon, onPress }: ItemProps) {
  const isPressable = onPress !== undefined;
  return (
    <Pressable
      onPress={onPress}
      pointerEvents={isPressable ? 'auto' : 'none'}
      className="flex-1 flex-row items-center justify-between px-4 py-2"
    >
      <View className="flex-row items-center">
        {icon && <View className="pr-2">{icon}</View>}
        <Text tx={text} />
      </View>
      <View className="flex-row items-center">
        <Text className="text-neutral-600 dark:text-white">{value}</Text>
        {isPressable && (
          <View className="pl-2">
            <ArrowRight />
          </View>
        )}
      </View>
    </Pressable>
  );
}
```

### Language picker

Bottom-sheet picker bound to `useSelectedLanguage`. Selecting a language writes it to MMKV and reloads the app, because changing text direction requires a native restart.

Source: `src/features/home/components/language-item.tsx`

```tsx
import type { OptionType } from '@/components/ui';

import type { Language } from '@/lib/i18n/resources';
import * as React from 'react';
import { Options, useModal } from '@/components/ui';
import { translate, useSelectedLanguage } from '@/lib/i18n';

import { SettingsItem } from './settings-item';

export function LanguageItem() {
  const { language, setLanguage } = useSelectedLanguage();
  const modal = useModal();
  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );

  const langs = React.useMemo(
    () => [
      { label: translate('settings.english'), value: 'en' },
      { label: translate('settings.portuguese'), value: 'pt-BR' },
    ],
    [],
  );

  const selectedLanguage = React.useMemo(
    () => langs.find(lang => lang.value === language),
    [language, langs],
  );

  return (
    <>
      <SettingsItem
        text="settings.language"
        value={selectedLanguage?.label}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={langs}
        onSelect={onSelect}
        value={selectedLanguage?.value}
      />
    </>
  );
}
```

### Theme picker

Same shape as the language picker but bound to `useSelectedTheme`. The selected theme is read back at startup by `loadSelectedTheme()` in the root layout.

Source: `src/features/home/components/theme-item.tsx`

```tsx
import type { OptionType } from '@/components/ui';

import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import * as React from 'react';
import { Options, useModal } from '@/components/ui';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { translate } from '@/lib/i18n';

import { SettingsItem } from './settings-item';

export function ThemeItem() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const modal = useModal();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setSelectedTheme(option.value as ColorSchemeType);
      modal.dismiss();
    },
    [setSelectedTheme, modal],
  );

  const themes = React.useMemo(
    () => [
      { label: `${translate('settings.theme.dark')} 🌙`, value: 'dark' },
      { label: `${translate('settings.theme.light')} 🌞`, value: 'light' },
      { label: `${translate('settings.theme.system')} ⚙️`, value: 'system' },
    ],
    [],
  );

  const theme = React.useMemo(
    () => themes.find(t => t.value === selectedTheme),
    [selectedTheme, themes],
  );

  return (
    <>
      <SettingsItem
        text="settings.theme.title"
        value={theme?.label}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={themes}
        onSelect={onSelect}
        value={theme?.value}
      />
    </>
  );
}
```

---

## Design-system showcase

### Section heading

Shared heading used by every showcase block: a label followed by a rule that fills the remaining width.

Source: `src/features/home/components/title.tsx`

```tsx
import * as React from 'react';

import { Text, View } from '@/components/ui';

type Props = {
  text: string;
};
export function Title({ text }: Props) {
  return (
    <View className="flex-row items-center justify-center py-4 pb-2">
      <Text className="pr-2 text-2xl">{text}</Text>
      <View className="h-[2px] flex-1 bg-neutral-300" />
    </View>
  );
}
```

### Typography specimen

The pattern each showcase block follows — a `Title`, then the components rendered at every variant they support. `colors-demo`, `buttons-demo` and `inputs-demo` had the same shape.

Source: `src/features/home/components/typography-demo.tsx`

```tsx
import * as React from 'react';

import { Text, View } from '@/components/ui';

import { Title } from './title';

export function Typography() {
  return (
    <>
      <Title text="Typography" />
      <View className="mb-4 flex-col">
        <Text className="text-3xl tracking-tight">
          H1: Lorem ipsum dolor sit
        </Text>
        <Text className="text-2xl">H2: Lorem ipsum dolor sit</Text>
        <Text className="text-xl">H3: Lorem ipsum dolor sit</Text>
        <Text className="text-lg">H4: Lorem ipsum dolor sit</Text>
        <Text className="text-base">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cumque quasi
          aut, expedita tempore ratione quidem in, corporis quia minus et
          dolorem sunt temporibus iusto consequatur culpa. Omnis sequi debitis
          recusandae?
        </Text>
      </View>
    </>
  );
}
```

---

## Translation keys these screens used

`en-us.json` was the reference locale that `i18n-json/identical-keys` compared every other
locale against. The trimmed app no longer needs these keys, but they show the nesting
convention: one top-level object per feature, sorted alphabetically, leaves are strings.

```json
{
  "settings": {
    "about": "About",
    "app_name": "App Name",
    "english": "English (US)",
    "general": "General",
    "language": "Language",
    "portuguese": "Portuguese (Brazil)",
    "theme": {
      "dark": "Dark",
      "light": "Light",
      "system": "System",
      "title": "Theme"
    },
    "version": "Version"
  }
}
```
