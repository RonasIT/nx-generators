import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  onRequestRefreshTokenInterceptor,
  onResponseRefreshTokenInterceptor,
  RefreshTokenInterceptorOptions,
  tokenInterceptor,
} from '@ronas-it/axios-api-client';
import { authApi, profileApi, LogInResponse } from '@ronas-it/mobile/shared/data-access/api';
import { apiService, configuration } from '@ronas-it/mobile/shared/data-access/api-client';
import { AppStorageValue, storage } from '@ronas-it/mobile/shared/data-access/storage';
import { authActions, authReducerPath, authSelectors, AuthState } from './slice';

export const authListenerMiddleware = createListenerMiddleware<{
  [authReducerPath]: AuthState;
}>();

authListenerMiddleware.startListening({
  matcher: authApi.internalActions.middlewareRegistered.match,
  effect: (_, { dispatch, getState }) => {
    const accessToken = storage.getString(AppStorageValue.ACCESS_TOKEN);

    dispatch(authActions.setIsAuthenticated(Boolean(accessToken)));

    const options: RefreshTokenInterceptorOptions = {
      configuration: configuration.auth,
      getIsAuthenticated: () => authSelectors.isAuthenticated(getState()),
      runTokenRefreshRequest: async () => {
        const refreshToken = storage.getString(AppStorageValue.REFRESH_TOKEN);

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await dispatch(
          authApi.endpoints.refreshToken.initiate({ refreshToken: refreshToken || '' }),
        ).unwrap();

        storage.set(AppStorageValue.ACCESS_TOKEN, newAccessToken);
        storage.set(AppStorageValue.REFRESH_TOKEN, newRefreshToken);

        return newAccessToken;
      },
      onError: () => {
        return dispatch(authApi.endpoints.logout.initiate()).unwrap();
      },
    };

    apiService.useInterceptors({
      request: [
        [onRequestRefreshTokenInterceptor(options)],
        [tokenInterceptor({ getToken: () => storage.getString(AppStorageValue.ACCESS_TOKEN) ?? '' })],
      ],
      response: [[null, onResponseRefreshTokenInterceptor(options)]],
    });

    dispatch(authActions.setIsAppReady(true));
  },
});

authListenerMiddleware.startListening({
  matcher: authApi.endpoints.login.matchFulfilled,
  effect: ({ payload: { accessToken, refreshToken } }: { payload: LogInResponse }, { dispatch }) => {
    storage.set(AppStorageValue.ACCESS_TOKEN, accessToken);
    storage.set(AppStorageValue.REFRESH_TOKEN, refreshToken);
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
    storage.delete(AppStorageValue.ACCESS_TOKEN);
    storage.delete(AppStorageValue.REFRESH_TOKEN);
    dispatch(authActions.setIsAuthenticated(false));

    dispatch(profileApi.util.resetApiState());
  },
});
