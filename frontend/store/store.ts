import { configureStore } from "@reduxjs/toolkit";
import transactionReducer from "./slices/transactionSlice";

export const store = configureStore({
  reducer: {
    transactions: transactionReducer,
  },
});

// Export the RootState and AppDispatch types for use in other parts of the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
