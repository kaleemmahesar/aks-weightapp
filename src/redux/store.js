import { configureStore } from '@reduxjs/toolkit';
import recordsReducer from './slices/recordsSlice';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import weightReducer from "./slices/weightSlice";
import expenseReducer from './slices/expenseSlice';

const store = configureStore({
  reducer: {
    records: recordsReducer,
    auth: authReducer,
    settings: settingsReducer,
    weight: weightReducer,
    expenses: expenseReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;