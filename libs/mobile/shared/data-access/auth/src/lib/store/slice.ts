import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean | null;
  isAppReady: boolean;
}

const initialState: AuthState = {
  isAuthenticated: null,
  isAppReady: false,
};

const authSlice = createSlice({
  name: 'authState',
  initialState,
  reducers: {
    setIsAuthenticated(state, { payload }: PayloadAction<boolean>) {
      state.isAuthenticated = payload;
    },
    setIsAppReady(state, { payload }: PayloadAction<boolean>) {
      state.isAppReady = payload;
    },
  },
  selectors: {
    isAuthenticated: (state) => state.isAuthenticated,
    isAppReady: (state) => state.isAppReady,
  },
});

export const authReducer = authSlice.reducer;
export const authReducerPath = authSlice.name;
export const authSelectors = authSlice.selectors;
export const authActions = authSlice.actions;
