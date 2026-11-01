import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Feedback,
  Field,
  Screen,
} from "../../components/ui";
import { api } from "../../services/api";
import { usePortal } from "../../hooks/PortalProvider";
export default function Account() {
  const {
    user,
    restoring,
    sessionError,
    logout,
    refreshUser,
    clearSession,
    language,
    setLanguage,
  } = usePortal();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update account.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function changePassword() {
    if (!current || !password || password !== confirm)
      throw new Error(
        "Enter your current password and matching new passwords.",
      );
    await api(
      "password",
      { currentPassword: current, newPassword: password },
      true,
    );
    await clearSession();
    setCurrent("");
    setPassword("");
    setConfirm("");
    router.replace("/login");
  }
  return (
    <Screen
      onRefresh={user ? () => run(refreshUser) : undefined}
      refreshing={busy}
    >
      <Feedback error={error || sessionError} loading={restoring || busy} />
      {user ? (
        <>
          <Copy title>{`Welcome, ${user.name}`}</Copy>
          <Card>
            <Copy title>Profile</Copy>
            <Copy>{user.name}</Copy>
            <Copy>{user.mobile}</Copy>
            <Copy>{user.district || "District not provided"}</Copy>
            <Copy muted>
              Your profile is fetched from the same database as the website.
            </Copy>
          </Card>
          <Button
            label="Your Vikray tokens"
            onPress={() => router.push("/(tabs)/tokens")}
          />
          <Card>
            <Copy title>Change Password</Copy>
            <Field
              label="Current password"
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              maxLength={1024}
            />
            <Field
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              maxLength={1024}
            />
            <Field
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              maxLength={1024}
            />
            <Copy muted>Changing your password signs out all devices.</Copy>
            <Button
              label="Change password"
              disabled={busy}
              onPress={() => run(changePassword)}
            />
          </Card>
          <Button label="Logout" disabled={busy} onPress={() => run(logout)} />
        </>
      ) : (
        !restoring && (
          <>
            <Copy title>Farmer account</Copy>
            <Button
              label="Login / Register"
              onPress={() => router.push("/login")}
            />
          </>
        )
      )}
      <Button
        secondary
        label={language === "en" ? "हिन्दी" : "English"}
        onPress={() => setLanguage(language === "en" ? "hi" : "en")}
      />
    </Screen>
  );
}
