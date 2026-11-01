import { useState } from "react";
import { Share } from "react-native";
import { ContentScreen } from "../components/ContentScreen";
import {
  Button,
  Card,
  Chips,
  Copy,
  Feedback,
  Field,
  Listen,
  openLink,
} from "../components/ui";
export default function Notices() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");
  return (
    <ContentScreen>
      {(content) => {
        const notices = content.notices.filter(
          (n) =>
            `${n.title} ${n.summary}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (category === "All" || n.category === category),
        );
        return (
          <>
            <Copy title>Notice board</Copy>
            <Copy muted>
              Portal notices. Open the official source to confirm the latest
              information.
            </Copy>
            <Field
              label="Search notices"
              value={query}
              onChangeText={setQuery}
            />
            <Chips
              options={[
                "All",
                ...new Set(content.notices.map((n) => n.category)),
              ]}
              value={category}
              onChange={setCategory}
            />
            <Feedback error={error} />
            {!notices.length && <Copy>No notices match your search.</Copy>}
            {notices.map((n) => (
              <Card key={n.id}>
                <Copy muted>{`${n.category} · ${n.dateLabel}`}</Copy>
                <Copy title>{n.title}</Copy>
                <Copy>{n.summary}</Copy>
                <Copy muted>{n.sourceName}</Copy>
                <Button
                  label="Open official source"
                  onPress={() => openLink(n.sourceUrl)}
                />
                <Listen text={`${n.title}. ${n.summary}`} />
                <Button
                  secondary
                  label="Share notice"
                  onPress={async () => {
                    try {
                      await Share.share({
                        message: `${n.title}\n${n.summary}\n${n.sourceUrl}`,
                      });
                    } catch {
                      setError("Unable to share notice.");
                    }
                  }}
                />
              </Card>
            ))}
          </>
        );
      }}
    </ContentScreen>
  );
}
