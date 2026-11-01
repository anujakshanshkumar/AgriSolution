import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { colors } from "../config/theme";
import { usePortal } from "../hooks/PortalProvider";
import { assetUrl } from "../services/api";
export function Copy({
  children,
  title = false,
  muted = false,
}: {
  children: string;
  title?: boolean;
  muted?: boolean;
}) {
  const { t } = usePortal();
  return (
    <Text style={[title ? styles.title : styles.text, muted && styles.muted]}>
      {t(children)}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const { t } = usePortal();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled) && { opacity: 0.55 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: colors.green }]}>
        {t(label)}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { t } = usePortal();
  return (
    <View style={{ gap: 6 }}>
      <Copy>{label}</Copy>
      <TextInput
        accessibilityLabel={t(label)}
        placeholderTextColor={colors.muted}
        style={styles.input}
        autoCapitalize="none"
        {...props}
      />
    </View>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Screen({
  children,
  refreshing = false,
  onRefresh,
  flush = false,
}: React.PropsWithChildren<{
  refreshing?: boolean;
  onRefresh?: () => void;
  flush?: boolean;
}>) {
  return (
    <SafeAreaView
      edges={
        flush
          ? ["top", "bottom", "left", "right"]
          : ["bottom", "left", "right"]
      }
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, flush && styles.flushContent]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.green}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Feedback({
  error,
  loading,
  retry,
}: {
  error?: string;
  loading?: boolean;
  retry?: () => void;
}) {
  return (
    <>
      {loading && (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={colors.green}
          size="large"
        />
      )}
      {!!error && (
        <Card>
          <Text accessibilityRole="alert" style={{ color: colors.error }}>
            {error}
          </Text>
          {retry && <Button label="Try again" onPress={retry} secondary />}
        </Card>
      )}
    </>
  );
}
export function Photo({
  path,
  hero = false,
}: {
  path?: string;
  hero?: boolean;
}) {
  const [failed, setFailed] = React.useState(false);
  let uri: string | undefined;
  try {
    if (path) uri = assetUrl(path);
  } catch {
    /* Show bundled artwork until configured. */
  }
  return (
    <Image
      accessibilityIgnoresInvertColors
      source={uri && !failed ? { uri } : require("../../assets/hero.png")}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: hero ? 220 : 160, borderRadius: 16 }}
      resizeMode="cover"
    />
  );
}
export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = usePortal();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option }}
          onPress={() => onChange(option)}
          style={[
            styles.chip,
            value === option && { backgroundColor: colors.green },
          ]}
        >
          <Text style={{ color: value === option ? "white" : colors.green }}>
            {t(option)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export async function openLink(url: string) {
  try {
    if (!/^(https?:|tel:|mailto:)/i.test(url))
      throw new Error("This link is unavailable.");
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert(
      "Unable to open link",
      error instanceof Error ? error.message : "Try again.",
    );
  }
}
export function Listen({ text }: { text: string }) {
  const { language, t } = usePortal();
  return (
    <Button
      secondary
      label="Listen"
      onPress={() => {
        void Speech.stop();
        Speech.speak(t(text), {
          language: language === "hi" ? "hi-IN" : "en-IN",
          onError: () =>
            Alert.alert(
              "Speech unavailable",
              "Install a voice for the selected language in device settings.",
            ),
        });
      }}
    />
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 20,
    gap: 18,
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    paddingBottom: 32,
  },
  flushContent: {
    maxWidth: "100%",
    padding: 0,
    paddingBottom: 0,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.heading,
    letterSpacing: -0.5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    fontFamily: Platform.select({
      ios: "System",
      android: "sans-serif",
      default: undefined,
    }),
  },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    padding: 16,
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#1d3f2a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  secondary: { backgroundColor: colors.light },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 13,
    color: colors.text,
    fontSize: 16,
  },
  chip: {
    padding: 13,
    minHeight: 46,
    borderRadius: 24,
    backgroundColor: colors.light,
  },
});
