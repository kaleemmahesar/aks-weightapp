import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { extractRecordsFromResponse, extractRecordFromResponse, normalizeRecord } from '../../utils/dataUtils';

// Async thunks
export const fetchRecords = createAsyncThunk(
  'records/fetchRecords',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getRecords();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch records');
    }
  }
);

export const saveFirstWeightRecord = createAsyncThunk(
  'records/saveFirstWeight',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.saveFirstWeight(recordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to save first weight');
    }
  }
);

export const saveSecondWeightRecord = createAsyncThunk(
  'records/saveSecondWeight',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.saveSecondWeight(recordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to save second weight');
    }
  }
);

export const saveFinalWeightRecord = createAsyncThunk(
  'records/saveFinalWeight',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.saveFinalWeight(recordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to save final weight');
    }
  }
);

export const updateRecordData = createAsyncThunk(
  'records/updateRecord',
  async (recordData, { rejectWithValue }) => {
    try {
      const response = await api.updateRecord(recordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update record');
    }
  }
);

const recordsSlice = createSlice({
  name: 'records',
  initialState: {
    records: [],
    selectedRecord: null,
    loading: false,
    error: null,
    todayTotal: 0
  },
  reducers: {
    setSelectedRecord: (state, action) => {
      state.selectedRecord = action.payload;
    },
    clearSelectedRecord: (state) => {
      state.selectedRecord = null;
    },
    calculateTodayTotal: (state) => {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // ✅ BUSINESS RULE: Daily totals are based on FIRST WEIGHT DATE only
      state.todayTotal = state.records.reduce((total, record) => {
        // ✅ Record belongs to the date when FIRST WEIGHT was recorded
        // ✅ Second weight can happen days later but doesn't affect which day this record belongs to
        if (!record.first_weight_time && !record.firstTime) return total;
        
        const firstWeightDateStr = record.first_weight_time || record.firstTime;
        const recordDate = new Date(firstWeightDateStr).toISOString().split('T')[0];
        
        // ✅ CORE LOGIC: Only count records where FIRST WEIGHT was done TODAY
        // ✅ Example: First weight today, second weight tomorrow → Still counts in TODAY's total
        if (recordDate === today && record.total_price) {
          return total + parseFloat(record.total_price || record.price || 0);
        }
        return total;
      }, 0);
    },
    calculateTodaysVehicles: (state) => {
  const today = new Date().toISOString().split("T")[0];

  state.totalVehiclesToday = state.records.reduce((count, record) => {
    const firstWeightDateStr = record.first_weight_time || record.firstTime;
    if (!firstWeightDateStr) return count;
    const recordDate = firstWeightDateStr.substring(0, 10);
    return recordDate === today ? count + 1 : count;
  }, 0);
}


  },
  extraReducers: (builder) => {
    builder
      // Fetch Records
      .addCase(fetchRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.loading = false;
        const rawRecords = extractRecordsFromResponse(action.payload);
        // Normalize all records to ensure consistent field names
        state.records = rawRecords.map(record => normalizeRecord(record)).filter(Boolean);
        state.error = null;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save First Weight
      .addCase(saveFirstWeightRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveFirstWeightRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const rawRecord = extractRecordFromResponse(action.payload);
        const normalizedRecord = normalizeRecord(rawRecord);
        // Add the new record to the beginning of the records array
        if (normalizedRecord) {
          state.records = [normalizedRecord, ...state.records];
        }
      })
      .addCase(saveFirstWeightRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save Second Weight
      .addCase(saveSecondWeightRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSecondWeightRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // ✅ BUSINESS RULE: Second weight only updates weight data, NOT the record's date
        // ✅ The record stays in the original first_weight_time date for daily totals
        // ✅ Only second_weight, net_weight, and second_weight_time are updated
        const updatedRecord = action.payload.record || action.payload;
        state.records = state.records.map(record => 
          record.id === updatedRecord.id ? updatedRecord : record
        );
        // Set the selected record for printing
        state.selectedRecord = updatedRecord;
      })
      .addCase(saveSecondWeightRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save Final Weight
      .addCase(saveFinalWeightRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveFinalWeightRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Add the new record to the beginning of the records array
        const newRecord = action.payload.record || action.payload;
        state.records = [newRecord, ...state.records];
        // Set the selected record for printing
        state.selectedRecord = newRecord;
      })
      .addCase(saveFinalWeightRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Record
      .addCase(updateRecordData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRecordData.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the record in the records array
        const updatedRecord = action.payload.record || action.payload;
        state.records = state.records.map(record => 
          record.id === updatedRecord.id ? updatedRecord : record
        );
      })
      .addCase(updateRecordData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});


export const { setSelectedRecord, clearSelectedRecord, calculateTodayTotal, calculateTodaysVehicles } = recordsSlice.actions;

export default recordsSlice.reducer;