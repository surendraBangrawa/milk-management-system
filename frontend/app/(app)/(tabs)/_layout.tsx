import { Tabs } from "expo-router";
import React from "react";
import { TabBarIcon } from "@/components/TabbarIcon";
import useTheme from "@/context/theme/useTheme";

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tabs.Screen
        name="(home)/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)/index"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={
                focused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"
              }
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
