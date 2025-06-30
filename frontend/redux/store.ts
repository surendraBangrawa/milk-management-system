import { configureStore } from "@reduxjs/toolkit";
// Import the reducer from your transactions slice
import transactionsReducer from "./slice/transactions/transactionsSlice";
// Import subscription API
import subscriptionApi from "./slice/subscription/subscriptionApi";
// Assuming your slice file is in a 'slices' directory within your redux folder

export const store = configureStore({
  reducer: {
    // Add your reducers here
    transactions: transactionsReducer,
    // Add subscription API reducer
    [subscriptionApi.reducerPath]: subscriptionApi.reducer,
    // If you have other slices, add their reducers here as well:
    // users: usersReducer,
    // products: productsReducer,
  },
  // Add subscription API middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(subscriptionApi.middleware),
  // middleware can be customized here if needed,
  // but configureStore includes helpful defaults like Redux Thunk and immutability checks
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(myCustomMiddleware),
  // devTools: process.env.NODE_ENV !== 'production', // Enable DevTools in non-production environments
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {transactions: TransactionsState, users: UsersState, ...}
export type AppDispatch = typeof store.dispatch;

// You will wrap your root component (e.g., App.tsx or your root layout)
// with the Provider component from react-redux and pass this store to it.
