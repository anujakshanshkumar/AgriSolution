import { useState } from "react";
import { router } from "expo-router";
import { Button, Card, Copy, Feedback, Field, Screen } from "../components/ui";
import { api } from "../services/api";
import { usePortal } from "../hooks/PortalProvider";
export default function Login() {
  const { login } = usePortal();
  const [register, setRegister] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setError("");
    setMessage("");
    if (
      !mobile.trim() ||
      mobile.trim().length > 32 ||
      !password ||
      password.length > 1024 ||
      (register && !name.trim())
    ) {
      setError("Enter your mobile number, password and required name.");
      return;
    }
    setBusy(true);
    try {
      if (register) {
        await api("auth/register", {
          mobile: mobile.trim(),
          password,
          name: name.trim(),
          district: district.trim(),
        });
        setRegister(false);
        setPassword("");
        setMessage("Registration complete. Please log in.");
      } else {
        await login(mobile, password);
        setPassword("");
        router.replace("/(tabs)/account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Copy title>{register ? "Farmer Registration" : "Welcome back"}</Copy>
      <Copy>Use the same account as the Agri-Solution website.</Copy>
      <Card>
        {register && (
          <>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={120}
            />
            <Field
              label="District"
              value={district}
              onChangeText={setDistrict}
              autoCapitalize="words"
              maxLength={120}
            />
          </>
        )}
        <Field
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={32}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={register ? "new-password" : "current-password"}
          maxLength={1024}
        />
        <Feedback error={error} loading={busy} />
        {!!message && <Copy>{message}</Copy>}
        <Button
          label={register ? "Register" : "Login"}
          disabled={busy}
          onPress={submit}
        />
        <Button
          secondary
          label={register ? "Already registered? Login" : "Create an account"}
          disabled={busy}
          onPress={() => {
            setRegister(!register);
            setError("");
            setMessage("");
          }}
        />
      </Card>
      <Copy muted>
        Password recovery is not available on this portal. Contact the portal
        administrator if you cannot sign in.
      </Copy>
    </Screen>
  );
}
