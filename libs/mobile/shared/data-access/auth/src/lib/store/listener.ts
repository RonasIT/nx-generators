import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  onRequestRefreshTokenInterceptor,
  onResponseRefreshTokenInterceptor,
  RefreshTokenInterceptorOptions,
  tokenInterceptor,
} from '@ronas-it/axios-api-client';
import { storeActions } from '@ronas-it/rtkq-entity-api';
import { DateTime } from 'luxon';
import { authApi, profileApi, LogInResponse } from '@ronas-it/mobile/shared/data-access/api';
import { apiService, configuration } from '@ronas-it/mobile/shared/data-access/api-client';
import { appStorageService } from '@ronas-it/mobile/shared/data-access/storage';
import { authActions, authReducerPath, authSelectors, AuthState } from './slice';

export const authListenerMiddleware = createListenerMiddleware<{
  [authReducerPath]: AuthState;
}>();

authListenerMiddleware.startListening({
  actionCreator: storeActions.init,
  effect: async (_, { dispatch, getState }) => {
    const isAuthenticated = await appStorageService.isAuthenticated.get();
    const tokenExpiresAt = await appStorageService.tokenExpiresAt.get();
    const token = await appStorageService.token.get();

    dispatch(authActions.setIsAuthenticated(isAuthenticated === 'true'));
    dispatch(authActions.setTokenExpiresAt(tokenExpiresAt ? DateTime.fromISO(tokenExpiresAt) : null));
    dispatch(authActions.setToken(token ?? null));

    apiService.useInterceptors({
      request: [
        [
          tokenInterceptor({
            getToken: () => authSelectors.token(getState()) ?? '',
          }),
        ],
      ],
    });

    dispatch(authActions.setIsAppReady(true));
    isAuthenticated && dispatch(profileApi.endpoints.getProfile.initiate());
  },
});

authListenerMiddleware.startListening({
  matcher: authApi.internalActions.middlewareRegistered.match,
  effect: async (_, { dispatch, getState }) => {
    const options: RefreshTokenInterceptorOptions = {
      configuration: configuration.auth,
      getIsAuthenticated: () => authSelectors.isAuthenticated(getState()),
      runTokenRefreshRequest: async () => {
        const { token, ttl } = await dispatch(authApi.endpoints.refreshToken.initiate()).unwrap();
        dispatch(authActions.saveToken({ token, ttl }));

        return token;
      },
      onError: () => {
        return dispatch(authApi.endpoints.logout.initiate()).unwrap();
      },
    };

    apiService.useInterceptors({
      request: [[onRequestRefreshTokenInterceptor(options)]],
      response: [[null, onResponseRefreshTokenInterceptor(options)]],
    });
  },
});

authListenerMiddleware.startListening({
  matcher: isAnyOf(authApi.endpoints.login.matchFulfilled, authApi.endpoints.register.matchFulfilled),
  effect: async ({ payload: { token, ttl } }: { payload: LogInResponse }, { dispatch }) => {
    dispatch(authActions.saveToken({ token, ttl }));
    appStorageService.isAuthenticated.set('true');
    dispatch(authActions.setIsAuthenticated(true));
  },
});

authListenerMiddleware.startListening({
  matcher: isAnyOf(authApi.endpoints.logout.matchFulfilled, authApi.endpoints.logout.matchRejected),
  effect: async (_, { dispatch }) => {
    appStorageService.isAuthenticated.remove();
    appStorageService.tokenExpiresAt.remove();
    appStorageService.token.remove();

    dispatch(authActions.setIsAuthenticated(false));
    dispatch(authActions.setTokenExpiresAt(null));
    dispatch(authActions.setToken(null));

    dispatch(profileApi.util.resetApiState());
  },
});

authListenerMiddleware.startListening({
  actionCreator: authActions.saveToken,
  effect: async ({ payload: { token, ttl } }, { dispatch }) => {
    const tokenExpires = DateTime.local().plus({ minutes: ttl });

    appStorageService.tokenExpiresAt.set(tokenExpires.toISO());
    appStorageService.token.set(token);

    dispatch(authActions.setToken(token));
    dispatch(authActions.setTokenExpiresAt(tokenExpires));
  },
});
