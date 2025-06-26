import React from "react";
import { Text, StyleSheet, View } from "react-native";
import useTheme from "@/context/theme/useTheme";

export const Heading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.heading, { color: colors.textPrimary }]}>
      {children}
    </Text>
  );
};

export const Paragraph: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
};

export const Section: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <View style={styles.section}>{children}</View>;
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
});
