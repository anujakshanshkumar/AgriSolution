import { useState } from "react";
import { router } from "expo-router";
import { ContentScreen } from "../../components/ContentScreen";
import { Button, Card, Chips, Copy, Field, Photo } from "../../components/ui";
export default function Crops() {
  const [query, setQuery] = useState("");
  const [season, setSeason] = useState("All");
  return (
    <ContentScreen>
      {(content) => {
        const crops = content.crops.filter(
          (crop) =>
            `${crop.name} ${crop.category}`
              .toLowerCase()
              .includes(query.toLowerCase()) &&
            (season === "All" ||
              crop.season === season ||
              crop.season === "Both"),
        );
        return (
          <>
            <Copy title>Chhattisgarh crop guide</Copy>
            <Field label="Search crops" value={query} onChangeText={setQuery} />
            <Chips
              options={["All", "Kharif", "Rabi"]}
              value={season}
              onChange={setSeason}
            />
            <Copy muted>{`${crops.length} crops`}</Copy>
            {!crops.length && <Copy>No crops match your search.</Copy>}
            {crops.map((crop) => (
              <Card key={crop.id}>
                <Photo path={crop.image} />
                <Copy title>{crop.name}</Copy>
                <Copy muted>{`${crop.season} · ${crop.category}`}</Copy>
                <Copy>{crop.overview}</Copy>
                <Button
                  label="View crop guide"
                  onPress={() =>
                    router.push({
                      pathname: "/crop/[id]",
                      params: { id: crop.id },
                    })
                  }
                />
              </Card>
            ))}
          </>
        );
      }}
    </ContentScreen>
  );
}
