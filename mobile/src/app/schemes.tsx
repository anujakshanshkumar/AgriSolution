import { useState } from "react";
import { ContentScreen } from "../components/ContentScreen";
import {
  Button,
  Card,
  Chips,
  Copy,
  Field,
  Photo,
  openLink,
} from "../components/ui";
export default function Schemes() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [government, setGovernment] = useState("All");
  const [farmer, setFarmer] = useState("All");
  const [expanded, setExpanded] = useState("");
  return (
    <ContentScreen>
      {(content) => {
        const schemes = content.schemes.filter(
          (s) =>
            `${s.title} ${s.summary} ${s.details.map((d) => d.text).join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (category === "All" || s.categories.includes(category)) &&
            (government === "All" || government === s.jurisdiction) &&
            (farmer === "All" || s.farmerTypes.includes(farmer)),
        );
        return (
          <>
            <Copy title>Schemes for you</Copy>
            <Field
              label="Search Schemes..."
              value={query}
              onChangeText={setQuery}
            />
            <Copy muted>Support type</Copy>
            <Chips
              options={[
                "All",
                ...new Set(content.schemes.flatMap((s) => s.categories)),
              ]}
              value={category}
              onChange={setCategory}
            />
            <Copy muted>Government</Copy>
            <Chips
              options={["All", "central", "state"]}
              value={government}
              onChange={setGovernment}
            />
            <Copy muted>Farmer situation</Copy>
            <Chips
              options={[
                "All",
                ...new Set(content.schemes.flatMap((s) => s.farmerTypes)),
              ]}
              value={farmer}
              onChange={setFarmer}
            />
            <Button
              label="Clear filters"
              secondary
              onPress={() => {
                setQuery("");
                setCategory("All");
                setGovernment("All");
                setFarmer("All");
              }}
            />
            <Copy muted>
              Filters help you explore relevant options; they do not determine
              eligibility.
            </Copy>
            <Copy muted>
              Confirm current rules, benefit amounts, and application dates with
              the official department.
            </Copy>
            <Copy>{`${schemes.length} schemes`}</Copy>
            {!schemes.length && <Copy>No schemes match your filters.</Copy>}
            {schemes.map((s) => (
              <Card key={s.id}>
                <Photo path={s.image} />
                <Copy title>{s.title}</Copy>
                <Copy>{s.summary}</Copy>
                <Button
                  secondary
                  label={
                    expanded === s.id
                      ? "Hide details"
                      : "Eligibility, benefits & documents"
                  }
                  onPress={() => setExpanded(expanded === s.id ? "" : s.id)}
                />
                {expanded === s.id &&
                  s.details.map((detail, i) => (
                    <Card key={i}>
                      <Copy title>{detail.title}</Copy>
                      <Copy>{detail.text}</Copy>
                    </Card>
                  ))}
                {s.url && (
                  <Button
                    label="Apply on official website"
                    onPress={() => openLink(s.url!)}
                  />
                )}
              </Card>
            ))}
          </>
        );
      }}
    </ContentScreen>
  );
}
