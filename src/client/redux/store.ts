import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import collectionReducer from './collectionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    collection: collectionReducer,
  },
});

export default store;
