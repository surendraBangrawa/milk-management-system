import React from "react";
import { View, Button, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem("user-language", lng);
  };

  return (
    <View style={styles.container}>
      <Button title="English" onPress={() => changeLanguage("en")} />
      <Button title="हिंदी" onPress={() => changeLanguage("hi")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    width: "80%",
  },
});

export default LanguageSelector;
