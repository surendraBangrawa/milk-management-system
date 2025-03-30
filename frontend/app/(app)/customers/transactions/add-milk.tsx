import { View, Text } from "react-native";
import React from "react";

// Quantity - kg
// Fat - Numeric
// SNF - Numeric
// Note - Text
// Date - Automatic populate present or manual date
// Shift - Auto populate (3AM-3PM Morning) else Evening based on time or manual shift dropdown (M,E)
// Rate - Fetch to get rate from api also allow manually
// Submit -  Send this data to backend
const AddMilk = () => {
  return (
    <View>
      <Text>Add Milk</Text>
    </View>
  );
};

export default AddMilk;
