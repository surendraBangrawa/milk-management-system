import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { type IconProps } from "@expo/vector-icons/build/createIconSet";
import { type ComponentProps } from "react";

export function TabBarIcon({
  style,
  ...rest
}: ComponentProps<typeof Ionicons> & { style?: any }) {
  return <Ionicons size={28} style={[{ marginBottom: -3 }, style]} {...rest} />;
}
