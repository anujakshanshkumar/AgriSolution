import { useState } from "react";
import { ContentScreen } from "../components/ContentScreen";
import { Button, Card, Chips, Copy, Field } from "../components/ui";
export default function Centres() {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [centre, setCentre] = useState("");
  return (
    <ContentScreen>
      {(content) => {
        const districts = Object.keys(content.centres).filter((name) =>
          name.toLowerCase().includes(query.toLowerCase()),
        );
        const areas = Object.keys(content.centres[district] || {}).filter(
          (name) => !["PHP", "SQL"].includes(name),
        );
        return (
          <>
            <Copy title>Find a procurement centre</Copy>
            <Copy muted>
              The portal contains demonstration centre names, not a verified
              directory or live market prices. Confirm availability with your
              local procurement office before visiting.
            </Copy>
            <Field
              label="Search district"
              value={query}
              onChangeText={setQuery}
            />
            <Chips
              options={districts}
              value={district}
              onChange={(value) => {
                setDistrict(value);
                setArea("");
                setCentre("");
              }}
            />
            {!!district && <Copy title>{district}</Copy>}
            {district && !areas.length && (
              <Copy>
                Verified area and centre information is not available for this
                district.
              </Copy>
            )}
            {!!areas.length && (
              <>
                <Copy>Select an area</Copy>
                <Chips
                  options={areas}
                  value={area}
                  onChange={(value) => {
                    setArea(value);
                    setCentre("");
                  }}
                />
              </>
            )}
            {area && (
              <>
                <Copy>Select a centre</Copy>
                {content.centres[district][area].map((value) => (
                  <Button
                    secondary
                    key={value}
                    label={value}
                    onPress={() => setCentre(value)}
                  />
                ))}
              </>
            )}
            {centre && (
              <Card>
                <Copy title>{centre}</Copy>
                <Copy>{`${area} · ${district}`}</Copy>
                <Copy>
                  Confirm the location and availability with your local
                  procurement office before visiting.
                </Copy>
              </Card>
            )}
          </>
        );
      }}
    </ContentScreen>
  );
}
