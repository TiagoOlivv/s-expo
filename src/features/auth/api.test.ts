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
