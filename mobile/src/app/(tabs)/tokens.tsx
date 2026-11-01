import { useCallback, useRef, useState } from "react";
import { Share } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import {
  Button,
  Card,
  Copy,
  Feedback,
  Field,
  Screen,
} from "../../components/ui";
import { usePortal } from "../../hooks/PortalProvider";
import { api } from "../../services/api";
import { ProduceToken, TokenList } from "../../types";
export default function Tokens() {
  const { user, restoring } = usePortal();
  const [data, setData] = useState<TokenList>();
  const [land, setLand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<ProduceToken>();
  const requestId = useRef(Crypto.randomUUID());
  const generation = useRef(0);
  const reservationGeneration = useRef(0);
  const refresh = useCallback(async () => {
    if (!user) return;
    const id = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const result = await api<TokenList>("tokens", undefined, true);
      if (id === generation.current) setData(result);
    } catch (err) {
      if (id === generation.current)
        setError(err instanceof Error ? err.message : "Unable to load tokens.");
    } finally {
      if (id === generation.current) setBusy(false);
    }
  }, [user]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        generation.current++;
        reservationGeneration.current++;
        setData(undefined);
        setIssued(undefined);
      };
    }, [refresh]),
  );
  async function submit() {
    if (!user) return;
    if (
      !Number.isFinite(Number(land)) ||
      !Number.isFinite(Number(quantity)) ||
      Number(land) <= 0 ||
      Number(quantity) <= 0
    ) {
      setError("Enter a positive land area and quantity.");
      return;
    }
    setBusy(true);
    setError("");
    const id = ++reservationGeneration.current;
    try {
      const token = await api<ProduceToken>(
        "tokens",
        {
          landArea: Number(land),
          quantity: Number(quantity),
          requestId: requestId.current,
        },
        true,
      );
      if (id !== reservationGeneration.current) return;
      setIssued(token);
      requestId.current = Crypto.randomUUID();
      setLand("");
      setQuantity("");
      await refresh();
    } catch (err) {
      if (id === reservationGeneration.current)
        setError(err instanceof Error ? err.message : "Unable to reserve token.");
    } finally {
      if (id === reservationGeneration.current) setBusy(false);
    }
  }
  const share = async (token: ProduceToken) => {
    try {
      await Share.share({
        message: `${token.number}\n${token.farmerName}\n${token.address}\n${token.quantity} kg · ${token.landArea} acres\nAgri-Solution student portal record; not an official procurement authorization.`,
      });
    } catch {
      setError("Unable to share this token.");
    }
  };
  if (!user)
    return (
      <Screen>
        <Feedback loading={restoring} />
        <Copy title>Vikray Token</Copy>
        <Copy>Log in to reserve and view your produce tokens.</Copy>
        <Button label="Login" onPress={() => router.push("/login")} />
      </Screen>
    );
  return (
    <Screen onRefresh={refresh} refreshing={busy}>
      <Copy title>Vikray Token</Copy>
      <Copy>{`${user.name} · ${user.district || "District not provided"}`}</Copy>
      <Feedback error={error} retry={refresh} />
      <Card>
        <Copy muted>
          {data
            ? `${data.issuedCount} sequence numbers assigned today`
            : "Loading queue…"}
        </Copy>
        <Field
          label="Land area (acres)"
          value={land}
          onChangeText={(v) => {
            setLand(v);
            requestId.current = Crypto.randomUUID();
          }}
          keyboardType="decimal-pad"
        />
        <Field
          label="Produce quantity (kg)"
          value={quantity}
          onChangeText={(v) => {
            setQuantity(v);
            requestId.current = Crypto.randomUUID();
          }}
          keyboardType="decimal-pad"
        />
        <Copy muted>
          {data && Number(land) > 0
            ? `Maximum allowed: ${Number(land) * data.maxKgPerAcre} kg`
            : "Maximum allowed: 21 quintals per acre."}
        </Copy>
        <Button label="Reserve token" disabled={busy} onPress={submit} />
      </Card>
      {issued && (
        <Card>
          <Copy title>{issued.number}</Copy>
          <Copy>Token saved to your account.</Copy>
          <Button label="Share token" onPress={() => share(issued)} />
        </Card>
      )}
      <Copy muted>
        This student portal does not issue official procurement authorizations.
        Older browser-only tokens are not automatically imported.
      </Copy>
      <Copy title>Your saved tokens</Copy>
      {data?.tokens.length === 0 && <Copy>No tokens yet.</Copy>}
      {data?.tokens.map((token) => (
        <Card key={token.number}>
          <Copy title>{token.number}</Copy>
          <Copy>{`${token.quantity} kg · ${token.landArea} acres`}</Copy>
          <Copy muted>{new Date(token.createdAt).toLocaleString()}</Copy>
          <Button secondary label="Share token" onPress={() => share(token)} />
        </Card>
      ))}
    </Screen>
  );
}
