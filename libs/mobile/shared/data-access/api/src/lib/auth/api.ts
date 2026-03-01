import { prepareRequestParams } from '@ronas-it/rtkq-entity-api';
import { plainToInstance } from 'class-transformer';
import { createAppApi } from '@ronas-it/mobile/shared/data-access/api-client';
import { LoginRequest, LogInResponse, RefreshTokenRequest, RefreshTokenResponse } from './models';

export const authApi = createAppApi({
  reducerPath: 'auth',
  endpoints: (builder) => ({
    login: builder.mutation<LogInResponse, LoginRequest>({
      query: (params) => {
        const request = prepareRequestParams(params, LoginRequest);

        return {
          method: 'POST',
          url: '/auth/login',
          data: request,
        };
      },
      transformResponse: (response) => plainToInstance(LogInResponse, response),
      transformErrorResponse: (response) => ({ ...response, skipToast: true }),
    }),
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (params) => {
        const request = prepareRequestParams(params, RefreshTokenRequest);

        return {
          method: 'POST',
          url: '/auth/refresh',
          data: request,
        };
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        method: 'POST',
        url: '/auth/logout',
      }),
    }),
  }),
});
