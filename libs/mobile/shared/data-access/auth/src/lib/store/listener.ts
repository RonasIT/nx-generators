import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import {
  onRequestRefreshTokenInterceptor,
  onResponseRefreshTokenInterceptor,
  RefreshTokenInterceptorOptions,
  tokenInterceptor,
} from '@ronas-it/axios-api-client';
import { storeActions } from '@ronas-it/rtkq-entity-api';
import { authApi, profileApi, LogInResponse } from '@ronas-it/mobile/shared/data-access/api';
import { apiService, configuration } from '@ronas-it/mobile/shared/data-access/api-client';
import { AppStorageValue, storage } from '@ronas-it/mobile/shared/data-access/storage';
import { authActions, authReducerPath, authSelectors, AuthState } from './slice';

export const authListenerMiddleware = createListenerMiddleware<{
  [authReducerPath]: AuthState;
}>();

authListenerMiddleware.startListening({
  actionCreator: storeActions.init,
  effect: (_, { dispatch }) => {
    const token = storage.getString(AppStorageValue.TOKEN);
    dispatch(authActions.setIsAuthenticated(Boolean(token)));

    apiService.useInterceptors({
      request: [[tokenInterceptor({ getToken: () => storage.getString(AppStorageValue.TOKEN) ?? '' })]],
    });

    dispatch(authActions.setIsAppReady(true));

    if (token) {
      dispatch(profileApi.endpoints.getProfile.initiate());
    }
  },
});

authListenerMiddleware.startListening({
  matcher: authApi.internalActions.middlewareRegistered.match,
  effect: (_, { dispatch, getState }) => {
    const options: RefreshTokenInterceptorOptions = {
      configuration: configuration.auth,
      getIsAuthenticated: () => authSelectors.isAuthenticated(getState()),
      runTokenRefreshRequest: async () => {
        const { token } = await dispatch(authApi.endpoints.refreshToken.initiate()).unwrap();
        storage.set(AppStorageValue.TOKEN, token);

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
  effect: ({ payload: { token } }: { payload: LogInResponse }, { dispatch }) => {
    storage.set(AppStorageValue.TOKEN, token);
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
    storage.delete(AppStorageValue.TOKEN);
    dispatch(authActions.setIsAuthenticated(false));

    dispatch(profileApi.util.resetApiState());
  },
});
