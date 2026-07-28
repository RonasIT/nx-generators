import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { CookieService } from '@ronas-it/web/shared/data-access/cookie';

export interface AuthState {
  isAuthenticated: boolean | null;
}

const initialState: AuthState = {
  isAuthenticated: CookieService.get('isAuthenticated') === 'true',
};

const authSlice = createSlice({
  name: 'authState',
  initialState,
  reducers: {
    setIsAuthenticated(state, { payload }: PayloadAction<boolean>) {
      state.isAuthenticated = payload;
    },
    unauthorize(state) {
      state.isAuthenticated = false;
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
