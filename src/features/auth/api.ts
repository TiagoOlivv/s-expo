import type { AxiosError } from 'axios';
import type { TokenType } from '@/lib/auth/utils';
import { createMutation } from 'react-query-kit';
import { client } from '@/lib/api';

type LoginResponse = TokenType;
type LoginVariables = { email: string; password: string };

export const useLogin = createMutation<LoginResponse, LoginVariables, AxiosError>({
  mutationFn: async variables =>
    client({
      url: 'auth/login',
      method: 'POST',
      data: variables,
    }).then(response => response.data),
});
