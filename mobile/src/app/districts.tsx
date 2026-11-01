import { useState } from "react";
import { ContentScreen } from "../components/ContentScreen";
import { Button, Card, Copy, Field, Photo } from "../components/ui";
import { DistrictMap } from "../components/DistrictMap";
export default function Districts() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  return (
    <ContentScreen>
      {(content) => {
        const districts = content.districts.filter(
          (d) =>
            (!selected || selected === d.id) &&
            d.districtName.toLowerCase().includes(query.toLowerCase()),
        );
        return (
          <>
            <Copy title>Chhattisgarh District Map</Copy>
            <Copy>
              Select a district to view agricultural information and local
              highlights.
            </Copy>
            <DistrictMap
              selected={selected}
              onSelect={(id) => {
                setSelected(id);
                setQuery("");
              }}
            />
            <Field
              label="Search district"
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelected("");
              }}
            />
            {selected && (
              <Button
                secondary
                label="Show all districts"
                onPress={() => setSelected("")}
              />
            )}
            {!districts.length && <Copy>No districts match your search.</Copy>}
            {districts.map((d) => (
              <Card key={d.id}>
                <Photo path={d.districtImage} />
                <Copy title>{d.districtName}</Copy>
                <Copy>{`Major crops: ${d.populationNumber}`}</Copy>
                <Copy>{`Other produce: ${d.areaSize}`}</Copy>
                <Copy>{`District headquarters: ${d.capitalCity}`}</Copy>
                <Copy>{d.aboutDistrict}</Copy>
              </Card>
            ))}
          </>
        );
      }}
    </ContentScreen>
  );
}
