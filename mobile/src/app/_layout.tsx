import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortalProvider } from "../hooks/PortalProvider";
import { colors } from "../config/theme";
export default function Layout() {
  return (
    <PortalProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.white,
          headerStyle: { backgroundColor: colors.green },
          headerTitleStyle: { color: colors.white, fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Farmer account" }} />
        <Stack.Screen name="crop/[id]" options={{ title: "Crop guide" }} />
        <Stack.Screen
          name="schemes"
          options={{ title: "Schemes & Subsidies" }}
        />
        <Stack.Screen
          name="districts"
          options={{ title: "District information" }}
        />
        <Stack.Screen
          name="centres"
          options={{ title: "Procurement centres" }}
        />
        <Stack.Screen name="notices" options={{ title: "Notice board" }} />
        <Stack.Screen name="chat" options={{ title: "Farming assistant" }} />
        <Stack.Screen name="about" options={{ title: "About Agri-Solution" }} />
      </Stack>
    </PortalProvider>
  );
}
