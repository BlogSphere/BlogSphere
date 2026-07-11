import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

const initialState: AuthState = {
  user,
  token: null,
  isAuthenticated: !!user,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<{ token?: string; user: any }>) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = null;
      state.user = action.payload.user;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateCurrentUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('user');
    },
    updateFollows: (state, action: PayloadAction<any[]>) => {
      if (state.user) {
        state.user.following = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  updateCurrentUser,
  logoutUser,
  updateFollows
} = authSlice.actions;

export default authSlice.reducer;
