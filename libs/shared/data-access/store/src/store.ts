import { Middleware, Reducer } from '@reduxjs/toolkit';
import {
  AppStateFromRootReducer,
  createStoreInitializer,
} from '@ronas-it/rtkq-entity-api';

export type AppState = AppStateFromRootReducer<typeof rootReducer>;

const rootReducer = {};

const middlewares = [] as Array<Middleware>;

const initStore = createStoreInitializer({
  rootReducer: rootReducer as unknown as Reducer<AppState>,
  middlewares,
});

export const store = initStore();
