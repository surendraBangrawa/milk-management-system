import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the type for the transaction data
interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
}

// Define the type for the state
interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
};

// Create the transaction slice
const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setTransactions, addTransaction, setLoading, setError } =
  transactionSlice.actions;

export default transactionSlice.reducer;
