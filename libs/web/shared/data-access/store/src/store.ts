import { Middleware, Reducer } from '@reduxjs/toolkit';
import { AppStateFromRootReducer, createStoreInitializer } from '@ronas-it/rtkq-entity-api';
import { authApi, profileApi } from '@ronas-it/shared/data-access/api';
import { authListenerMiddleware, authReducer, authReducerPath } from '@ronas-it/web/shared/data-access/auth';

export type AppState = AppStateFromRootReducer<typeof rootReducer>;

const rootReducer = {
  [authApi.reducerPath]: authApi.reducer,
  [authReducerPath]: authReducer,
  [profileApi.reducerPath]: profileApi.reducer,
};

const middlewares: Array<Middleware> = [authApi.middleware, authListenerMiddleware.middleware, profileApi.middleware];

const initStore = createStoreInitializer({
  rootReducer: rootReducer as unknown as Reducer<AppState>,
  middlewares,
});

export const store = initStore();
