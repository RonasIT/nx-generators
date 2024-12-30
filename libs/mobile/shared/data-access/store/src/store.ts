import { Reducer } from '@reduxjs/toolkit';
import { setupReactotron } from '@ronas-it/react-native-common-modules';
import { AppStateFromRootReducer, createStoreInitializer } from '@ronas-it/rtkq-entity-api';
import { authApi, profileApi } from '@ronas-it/mobile/shared/data-access/api';
import { authListenerMiddleware, authReducer, authReducerPath } from '@ronas-it/mobile/shared/data-access/auth';

export type AppState = AppStateFromRootReducer<typeof rootReducer>;

const rootReducer = {
  [authApi.reducerPath]: authApi.reducer,
  [authReducerPath]: authReducer,
  [profileApi.reducerPath]: profileApi.reducer
};

const middlewares = [authApi.middleware, authListenerMiddleware.middleware, profileApi.middleware];

const reactotron = setupReactotron('my-app');
const enhancers = reactotron ? [reactotron.createEnhancer()] : [];

const initStore = createStoreInitializer({
  rootReducer: rootReducer as unknown as Reducer<AppState>,
  middlewares,
  enhancers
});

export const store = initStore();
