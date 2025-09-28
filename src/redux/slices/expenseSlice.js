import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for expense operations
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getExpenses();
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await api.addExpense(expenseData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await api.updateExpense(expenseData);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (expenseId, { rejectWithValue }) => {
    try {
      await api.deleteExpense(expenseId);
      return expenseId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    expenses: [],
    loading: false,
    error: null,
    totalExpenses: 0
  },
  reducers: {
    calculateTotalExpenses: (state) => {
      state.totalExpenses = state.expenses.reduce((total, expense) => {
        return total + parseFloat(expense.amount || 0);
      }, 0);
    },
    calculateTodayExpenses: (state) => {
      const today = new Date().toISOString().split('T')[0];
      state.todayExpenses = state.expenses.reduce((total, expense) => {
        if (expense.date === today) {
          return total + parseFloat(expense.amount || 0);
        }
        return total;
      }, 0);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        // Debug: Log the actual response structure
        console.log('Backend response for fetchExpenses:', action.payload);
        // Handle different response structures from backend
        let expensesData = [];
        if (Array.isArray(action.payload)) {
          expensesData = action.payload;
        } else if (action.payload && action.payload.data && Array.isArray(action.payload.data)) {
          expensesData = action.payload.data;
        } else if (action.payload && action.payload.expenses && Array.isArray(action.payload.expenses)) {
          expensesData = action.payload.expenses;
        } else if (action.payload && typeof action.payload === 'object') {
          // If it's an object, try to find any array property
          const keys = Object.keys(action.payload);
          for (const key of keys) {
            if (Array.isArray(action.payload[key])) {
              expensesData = action.payload[key];
              break;
            }
          }
        }
        console.log('Processed expenses data:', expensesData);
        state.expenses = expensesData;
        // Auto-calculate total when expenses are loaded
        state.totalExpenses = expensesData.reduce((total, expense) => {
          return total + parseFloat(expense.amount || 0);
        }, 0);
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Expense
      .addCase(addExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.loading = false;
        // Debug: Log the actual response structure
        console.log('Backend response for addExpense:', action.payload);
        // Handle different response structures from backend
        const newExpense = action.payload.data || action.payload;
        console.log('Processed new expense:', newExpense);
        state.expenses.push(newExpense);
        // Recalculate total
        state.totalExpenses = state.expenses.reduce((total, expense) => {
          return total + parseFloat(expense.amount || 0);
        }, 0);
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Expense
      .addCase(updateExpense.fulfilled, (state, action) => {
        // Handle different response structures from backend
        const updatedExpense = action.payload.data || action.payload;
        const index = state.expenses.findIndex(exp => exp.id === updatedExpense.id);
        if (index !== -1) {
          state.expenses[index] = updatedExpense;
          // Recalculate total
          state.totalExpenses = state.expenses.reduce((total, expense) => {
            return total + parseFloat(expense.amount || 0);
          }, 0);
        }
      })
      
      // Delete Expense
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(exp => exp.id !== action.payload);
        // Recalculate total
        state.totalExpenses = state.expenses.reduce((total, expense) => {
          return total + parseFloat(expense.amount || 0);
        }, 0);
      });
  }
});

export const { calculateTotalExpenses, calculateTodayExpenses, clearError } = expenseSlice.actions;

export default expenseSlice.reducer;