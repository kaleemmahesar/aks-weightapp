import { configureStore } from '@reduxjs/toolkit';
import recordsReducer from './slices/recordsSlice';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import weightReducer from "./slices/weightSlice";

const store = configureStore({
  reducer: {
    records: recordsReducer,
    auth: authReducer,
    settings: settingsReducer,
    weight: weightReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;