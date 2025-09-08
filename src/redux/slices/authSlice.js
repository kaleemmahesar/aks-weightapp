import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.login(credentials);
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify({
        loggedIn: true,
        role: response.role
      }));
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    loggedIn: false,
    role: null,
    loading: false,
    error: null
  },
  reducers: {
    restoreUserSession: (state, action) => {
      state.loggedIn = action.payload.loggedIn;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.loggedIn = false;
      state.role = null;
      localStorage.removeItem('user');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.loggedIn = true;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { restoreUserSession, logout } = authSlice.actions;

export default authSlice.reducer;