import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.login(credentials);
      console.log('Login API Response:', response); // Debug log
      
      // Check if login was successful
      if (response.success) {
        // Ensure role is properly set
        const role = response.role || null;
        if (!role) {
          return rejectWithValue({ message: 'Login successful but role not found. Please contact administrator.' });
        }
        
        // Store user data in localStorage
        const userData = {
          loggedIn: true,
          role: role
        };
        console.log('Storing user data:', userData); // Debug log
        localStorage.setItem('user', JSON.stringify(userData));
        return response;
      } else {
        // If login failed, return the error message
        return rejectWithValue({ message: response.message || 'Invalid credentials' });
      }
    } catch (error) {
      console.log('Login API Error:', error); // Debug log
      return rejectWithValue(error.response?.data || { message: 'Login failed. Please check your credentials.' });
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
      console.log('Restoring user session:', action.payload); // Debug log
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
        state.role = action.payload.role || null;
        state.error = null;
        console.log('Login fulfilled, role:', state.role); // Debug log
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      });
  }
});

export const { restoreUserSession, logout } = authSlice.actions;

export default authSlice.reducer;