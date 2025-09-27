import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock data for expenses (will be replaced with API calls later)
const mockExpenses = [
  {
    id: 1,
    description: 'Fuel for generator',
    amount: 500,
    category: 'Chae Pani',
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    description: 'Maintenance of weighbridge',
    amount: 15000,
    category: 'Chae Pani',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    description: 'Office supplies',
    amount: 2500,
    category: 'Other',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 4,
    description: 'Seth Waseem',
    amount: 47350,
    category: 'Deposit to Owner',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

// Async thunks for expense operations (using mock data for now)
export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockExpenses;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newExpense = {
        id: Date.now(), // Simple ID generation for mock
        ...expenseData,
        created_at: new Date().toISOString()
      };
      
      return newExpense;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return expenseData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (expenseId, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return expenseId;
    } catch (error) {
      return rejectWithValue(error.message);
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
        state.expenses = action.payload;
        // Auto-calculate total when expenses are loaded
        state.totalExpenses = action.payload.reduce((total, expense) => {
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
        state.expenses.push(action.payload);
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
        const index = state.expenses.findIndex(exp => exp.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
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