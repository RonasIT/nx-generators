import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  onRequestRefreshTokenInterceptor,
  onResponseRefreshTokenInterceptor,
  RefreshTokenInterceptorOptions,
  tokenInterceptor,
  unauthorizedInterceptor,
} from '@ronas-it/axios-api-client';
import { authApi, profileApi, LogInResponse } from '@ronas-it/shared/data-access/api';
import { apiService, configuration } from '@ronas-it/shared/data-access/api-client';
import { CookieService } from '@ronas-it/web/shared/data-access/cookie';
import { authActions, authReducerPath, authSelectors, AuthState } from './slice';

export const authListenerMiddleware = createListenerMiddleware<{ [authReducerPath]: AuthState }>();

authListenerMiddleware.startListening({
  matcher: authApi.internalActions.middlewareRegistered.match,
  effect: (_, { dispatch, getState }) => {
    const options: RefreshTokenInterceptorOptions = {
      configuration: configuration.auth,
      getIsAuthenticated: () => authSelectors.isAuthenticated(getState()),
      runTokenRefreshRequest: async () => {
        const refreshToken = CookieService.get('refreshToken');

        const { accessToken, refreshToken: newRefreshToken } = await dispatch(
          authApi.endpoints.refreshToken.initiate({ refreshToken }),
        ).unwrap();

        CookieService.set({ accessToken, refreshToken: newRefreshToken });

        return accessToken;
      },
      onError: () => dispatch(authApi.endpoints.logout.initiate()).unwrap(),
    };

    apiService.useInterceptors({
      request: [
        [onRequestRefreshTokenInterceptor(options)],
        [tokenInterceptor({ getToken: () => CookieService.get('accessToken') })],
      ],
      response: [
        [null, onResponseRefreshTokenInterceptor(options)],
        [
          null,
          unauthorizedInterceptor({
            publicEndpoints: configuration.auth.unauthorizedRoutes,
            onError: () => dispatch(authActions.unauthorize()),
          }),
        ],
      ],
    });
  },
});

authListenerMiddleware.startListening({
  matcher: authApi.endpoints.login.matchFulfilled,
  effect: ({ payload: { accessToken, refreshToken } }: { payload: LogInResponse }, { dispatch }) => {
    CookieService.set({ accessToken, refreshToken, isAuthenticated: 'true' });
    dispatch(authActions.setIsAuthenticated(true));
  },
});

authListenerMiddleware.startListening({
  matcher: isAnyOf(
    authApi.endpoints.logout.matchFulfilled,
    authApi.endpoints.logout.matchRejected,
    profileApi.endpoints.deleteProfile.matchFulfilled,
  ),
  effect: (_, { dispatch }) => {
    dispatch(authActions.unauthorize());
  },
});

authListenerMiddleware.startListening({
  actionCreator: authActions.unauthorize,
  effect: (_, { dispatch }) => {
    CookieService.remove(['accessToken', 'refreshToken', 'isAuthenticated']);
    dispatch(authActions.setIsAuthenticated(false));

    dispatch(profileApi.util.resetApiState());
  },
});
