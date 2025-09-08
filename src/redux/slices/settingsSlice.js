import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getSettings();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch settings');
    }
  }
);

export const updateSettingsData = createAsyncThunk(
  'settings/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await api.updateSettings(settingsData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update settings');
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    settings: {},
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        // Handle PHP backend response structure
        state.settings = action.payload.data || action.payload.settings || action.payload || {};
        state.error = null;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Settings
      .addCase(updateSettingsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSettingsData.fulfilled, (state, action) => {
        state.loading = false;
        // Handle PHP backend response structure
        state.settings = action.payload.data || action.payload.settings || action.payload || {};
        state.error = null;
      })
      .addCase(updateSettingsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default settingsSlice.reducer;