import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  deleteCustomerTransactionApi,
  getCustomerSummaryApi,
  getCustomerTransactionApi,
} from "@/redux/slice/transactions/transactionApi"; // Assuming you have delete API here

interface Transaction {
  id: string | number; // Assuming transaction ID is string or number
  type: "milk" | "expense"; // Or more specific types like 'MILK' | 'EXPENSE'
  amount: number;
  added_at: string; // Date string from backend (ISO format)
  custom_date: string; // Custom date string used in add/edit
  running_balance: number;
  total_till_record: number;
  expense_detail?: string | null; // For expense transactions
  milk_detail?: string | null; // For milk transactions
  rate?: number | null; // For milk transactions
  quantity?: number | null; // For milk transactions
  snf?: number | null; // For milk transactions
  fat?: number | null; // For milk transactions
  seller_mobile: string;
  [key: string]: any; // Allow other properties
}

// Define the type for the seller summary items (used in CustomerScreen)
interface SellerSummary {
  mobile: string;
  name: string;
  date?: string | null; // Date of last transaction?
  balance: number; // Current balance
  avatar?: string | null;
  [key: string]: any;
}

interface TransactionsState {
  // State for seller summaries list (used in CustomerScreen)
  sellerSummaries: SellerSummary[];
  sellerSummariesLoading: boolean;
  sellerSummariesError: string | null;

  // State for a specific seller's transactions (used in TransactionScreen)
  sellerTransactions: Transaction[];
  sellerTransactionsLoading: boolean;
  sellerTransactionsError: string | null;

  // Add state for deleting a transaction if needed (e.g., isDeleting, deleteError)
  isDeletingTransaction: boolean;
  deleteTransactionError: string | null;
}

const initialState: TransactionsState = {
  sellerSummaries: [],
  sellerSummariesLoading: false,
  sellerSummariesError: null,

  sellerTransactions: [],
  sellerTransactionsLoading: false,
  sellerTransactionsError: null,

  isDeletingTransaction: false,
  deleteTransactionError: null,
};

// Async Thunk to fetch seller summaries (for CustomerScreen)
export const fetchSellerSummaries = createAsyncThunk(
  "transactions/fetchSellerSummaries",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCustomerSummaryApi();
      if (
        res.status === 200 &&
        res?.data?.seller_details &&
        Array.isArray(res.data.seller_details)
      ) {
        const sortedData = res.data.seller_details.sort((a: any, b: any) => {
          const dateA = a.date ? new Date(a.date) : null;
          const dateB = b.date ? new Date(b.date) : null;
          if (!dateA || isNaN(dateA.getTime())) return 1;
          if (!dateB || isNaN(dateB.getTime())) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        return sortedData as SellerSummary[];
      } else {
        return rejectWithValue(
          "API returned unexpected data structure for summaries."
        );
      }
    } catch (err: any) {
      // Handle different error response structures
      let errorMessage = "Failed to fetch seller summaries.";

      if (err?.response?.data?.detail) {
        // If detail is an object with message property
        if (
          typeof err.response.data.detail === "object" &&
          err.response.data.detail.message
        ) {
          errorMessage = err.response.data.detail.message;
        } else if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        }
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchSellerTransactionsById = createAsyncThunk(
  "transactions/fetchSellerTransactionsById",
  async (sellerId: string, { rejectWithValue }) => {
    try {
      const res = await getCustomerTransactionApi(sellerId);
      if (res.status === 200 && res?.data && Array.isArray(res.data)) {
        const sortedData = res.data.sort((a: any, b: any) => {
          const dateA = a.added_at ? new Date(a.added_at) : null;
          const dateB = b.added_at ? new Date(b.added_at) : null;
          if (!dateA || isNaN(dateA.getTime())) return 1;
          if (!dateB || isNaN(dateB.getTime())) return -1;
          return dateB.getTime() - dateA.getTime();
        });
        return sortedData as Transaction[]; // Return the sorted transactions
      } else {
        // Return an error if the API call was successful but data was malformed
        return rejectWithValue(
          "API returned unexpected data structure for transactions."
        );
      }
    } catch (err: any) {
      // Handle different error response structures
      let errorMessage = `Failed to fetch transactions for seller ${sellerId}.`;

      if (err?.response?.data?.detail) {
        // If detail is an object with message property
        if (
          typeof err.response.data.detail === "object" &&
          err.response.data.detail.message
        ) {
          errorMessage = err.response.data.detail.message;
        } else if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        }
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  "transactions/deleteTransaction",
  async (
    {
      record_id,
      record_type,
      seller_mobile,
    }: {
      record_id: string | number;
      record_type: string;
      seller_mobile: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Ensure required parameters are present
      if (
        record_id === undefined ||
        record_type === undefined ||
        seller_mobile === undefined
      ) {
        return rejectWithValue("Missing transaction details for deletion.");
      }
      const res = await deleteCustomerTransactionApi({
        record_id,
        record_type,
        seller_mobile,
      });
      if (res.status === 200) {
        return record_id; // Return the ID of the deleted record on success
      } else {
        // Handle non-200 status codes
        const errorMsg =
          res?.data?.detail || `Failed to delete transaction ${record_id}.`;
        return rejectWithValue(errorMsg);
      }
    } catch (err: any) {
      // Handle different error response structures
      let errorMessage = `Failed to delete transaction ${record_id}.`;

      if (err?.response?.data?.detail) {
        // If detail is an object with message property
        if (
          typeof err.response.data.detail === "object" &&
          err.response.data.detail.message
        ) {
          errorMessage = err.response.data.detail.message;
        } else if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        }
      }

      return rejectWithValue(errorMessage);
    }
  }
);

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    // Reducer to clear specific seller transactions when leaving the screen (optional but good for cleanup)
    clearSellerTransactions: (state) => {
      state.sellerTransactions = [];
      state.sellerTransactionsLoading = false;
      state.sellerTransactionsError = null;
    },
    // Reducer to remove a deleted transaction from the state immediately (optimistic update or after successful delete)
    removeTransaction: (state, action: PayloadAction<string | number>) => {
      state.sellerTransactions = state.sellerTransactions.filter(
        (transaction) => transaction.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Reducers for fetchSellerSummaries thunk (already existed)
    builder
      .addCase(fetchSellerSummaries.pending, (state) => {
        state.sellerSummariesLoading = true;
        state.sellerSummariesError = null;
      })
      .addCase(
        fetchSellerSummaries.fulfilled,
        (state, action: PayloadAction<SellerSummary[]>) => {
          state.sellerSummariesLoading = false;
          state.sellerSummaries = action.payload;
        }
      )
      .addCase(fetchSellerSummaries.rejected, (state, action) => {
        state.sellerSummariesLoading = false;
        state.sellerSummariesError =
          (action.payload as string) || "Failed to fetch seller summaries";
      });

    // Reducers for fetchSellerTransactionsById thunk
    builder
      .addCase(fetchSellerTransactionsById.pending, (state) => {
        state.sellerTransactionsLoading = true;
        state.sellerTransactionsError = null; // Clear previous errors on new fetch
      })
      .addCase(
        fetchSellerTransactionsById.fulfilled,
        (state, action: PayloadAction<Transaction[]>) => {
          state.sellerTransactionsLoading = false;
          state.sellerTransactions = action.payload; // Store fetched transactions
        }
      )
      .addCase(fetchSellerTransactionsById.rejected, (state, action) => {
        state.sellerTransactionsLoading = false;
        state.sellerTransactionsError =
          (action.payload as string) || "Failed to fetch seller transactions";
        state.sellerTransactions = []; // Clear transactions on error
      });

    // Reducers for deleteTransaction thunk (optional)
    builder
      .addCase(deleteTransaction.pending, (state) => {
        state.isDeletingTransaction = true;
        state.deleteTransactionError = null;
      })
      .addCase(
        deleteTransaction.fulfilled,
        (state, action: PayloadAction<string | number>) => {
          state.isDeletingTransaction = false;
          // Optionally remove the transaction from the state after successful deletion
          state.sellerTransactions = state.sellerTransactions.filter(
            (transaction) => transaction.id !== action.payload
          );
          // Or dispatch a separate removeTransaction action here
        }
      )
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.isDeletingTransaction = false;
        state.deleteTransactionError =
          (action.payload as string) || "Failed to delete transaction";
        // Optionally show a toast or handle error in the component
      });
  },
});

// Export the new thunk and reducer actions
export const { clearSellerTransactions, removeTransaction } =
  transactionsSlice.actions;
export default transactionsSlice.reducer;

// Export the Transaction and SellerSummary types for use in components
export type { Transaction, SellerSummary };
