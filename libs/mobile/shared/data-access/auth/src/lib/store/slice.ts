import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  isAuthenticated: boolean | null;
}

const initialState: AuthState = {
  isAuthenticated: null,
};

const authSlice = createSlice({
  name: 'authState',
  initialState,
  reducers: {
    setIsAuthenticated(state, { payload }: PayloadAction<boolean>) {
      state.isAuthenticated = payload;
    },
  },
  selectors: {
    isAuthenticated: (state) => state.isAuthenticated,
  },
});

export const authReducer = authSlice.reducer;
export const authReducerPath = authSlice.name;
export const authSelectors = authSlice.selectors;
export const authActions = authSlice.actions;
