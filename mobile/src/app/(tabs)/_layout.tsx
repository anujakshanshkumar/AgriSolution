import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "../../config/theme";
import { usePortal } from "../../hooks/PortalProvider";
export default function TabsLayout() {
  const { t } = usePortal();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: "#ffffffb8",
        headerTintColor: colors.white,
        tabBarActiveBackgroundColor: "#004d40",
        tabBarStyle: {
          backgroundColor: colors.green,
          borderTopColor: "#ffffff24",
          height: 62,
          paddingTop: 5,
          paddingBottom: 5,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {[
        ["index", "Home", "⌂"],
        ["crops", "Crops", "♧"],
        ["weather", "Weather", "☀"],
        ["tokens", "Vikray Token", "▤"],
        ["account", "Profile", "○"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(title),
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: 22 }}>{icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
