import { useEffect, useState } from "react";
import * as Speech from "expo-speech";
import {
  Button,
  Card,
  Copy,
  Feedback,
  Field,
  Listen,
  Screen,
} from "../components/ui";
import { api } from "../services/api";
import { usePortal } from "../hooks/PortalProvider";
import { ChatMessage } from "../types";
export default function Chat() {
  const { language } = usePortal();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(
    () => () => {
      void Speech.stop();
    },
    [],
  );
  async function send() {
    if (!text.trim()) return;
    const question: ChatMessage = { role: "user", text: text.trim() };
    const history = [...messages, question].slice(-10);
    while (
      history.reduce((total, m) => total + m.text.length, 0) > 7500 &&
      history.length > 1
    )
      history.shift();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ text: string }>("chatbot/message", {
        language,
        messages: history,
      });
      if (!result.text?.trim())
        throw new Error("The assistant returned an empty response.");
      setMessages([
        ...messages,
        question,
        { role: "model", text: result.text },
      ]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant unavailable.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Copy title>Farming assistant</Copy>
      <Copy muted>
        General guidance. Confirm official policies and crop-treatment decisions
        with your local agriculture office.
      </Copy>
      {!messages.length && (
        <Copy>Ask a question about your crops, soil or farming resources.</Copy>
      )}
      {messages.map((message, i) => (
        <Card key={i}>
          <Copy muted>{message.role === "user" ? "You" : "Agri-Solution"}</Copy>
          <Copy>{message.text}</Copy>
          {message.role === "model" && <Listen text={message.text} />}
        </Card>
      ))}
      <Feedback error={error} loading={busy} />
      <Field
        label="Your question"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
      />
      <Button label="Send" disabled={busy || !text.trim()} onPress={send} />
      <Button
        secondary
        label="Clear conversation"
        disabled={busy}
        onPress={() => {
          setMessages([]);
          setError("");
          void Speech.stop();
        }}
      />
    </Screen>
  );
}
