import React, { useEffect } from "react";
import { View, Text, Button } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  setTransactions,
  setLoading,
  setError,
} from "../store/slices/transactionSlice";
import axios from "axios";
import { RootState } from "../store/store";

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { transactions, loading, error } = useSelector(
    (state: RootState) => state.transactions
  );

  useEffect(() => {
    dispatch(setLoading(true));
    axios
      .get("http://your-backend-url/transactions") // Update with your FastAPI backend URL
      .then((response) => {
        dispatch(setTransactions(response.data));
        dispatch(setLoading(false));
      })
      .catch((err) => {
        dispatch(setError("Failed to load transactions"));
        dispatch(setLoading(false));
      });
  }, [dispatch]);

  return (
    <View style={{ padding: 20 }}>
      <Text>Your Transactions</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <View>
          {transactions.map((transaction) => (
            <View key={transaction.id}>
              <Text>
                {transaction.description}: ₹{transaction.amount}
              </Text>
            </View>
          ))}
        </View>
      )}
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      <Button
        title="View Transactions"
        onPress={() => navigation.navigate("Transactions")}
      />
    </View>
  );
};

export default HomeScreen;
