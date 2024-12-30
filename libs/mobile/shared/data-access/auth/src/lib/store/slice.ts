import { PayloadAction, createSlice, createAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';

export interface AuthState {
  isAuthenticated: boolean | null;
  isAppReady: boolean;
  token: string | null;
  tokenExpiresAt: DateTime | null;
}

const initialState: AuthState = {
  isAuthenticated: null,
  isAppReady: false,
  token: null,
  tokenExpiresAt: null,
};

const authSlice = createSlice({
  name: 'authState',
  initialState,
  reducers: {
    setIsAuthenticated(state, { payload }: PayloadAction<boolean>) {
      state.isAuthenticated = payload;
    },
    setToken(state, { payload }: PayloadAction<string | null>) {
      state.token = payload;
    },
    setIsAppReady(state, { payload }: PayloadAction<boolean>) {
      state.isAppReady = payload;
    },
    setTokenExpiresAt(state, { payload }: PayloadAction<DateTime | null>) {
      state.tokenExpiresAt = payload;
    },
  },
  selectors: {
    isAuthenticated: (state) => state.isAuthenticated,
    isAppReady: (state) => state.isAppReady,
    token: (state) => state.token,
    tokenExpiresAt: (state) => state.tokenExpiresAt,
  },
});

export const authActions = {
  ...authSlice.actions,
  saveToken: createAction<{ token: string | null; ttl: number }>('authState/saveToken'),
};

export const authReducer = authSlice.reducer;
export const authReducerPath = authSlice.name;
export const authSelectors = authSlice.selectors;
