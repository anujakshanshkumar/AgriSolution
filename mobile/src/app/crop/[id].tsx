import { useLocalSearchParams } from "expo-router";
import { ContentScreen } from "../../components/ContentScreen";
import { Card, Copy, Listen, Photo } from "../../components/ui";
export default function CropDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ContentScreen>
      {(content) => {
        const crop = content.crops.find((item) => item.id === id);
        if (!crop) return <Copy>Crop not found.</Copy>;
        return (
          <>
            <Photo hero path={crop.image} />
            <Copy title>{crop.name}</Copy>
            <Copy muted>{`${crop.season} · ${crop.category}`}</Copy>
            <Copy>{crop.overview}</Copy>
            <Card>
              <Copy title>Sowing period</Copy>
              <Copy>{crop.sowing}</Copy>
              <Copy title>Harvest period</Copy>
              <Copy>{crop.harvest}</Copy>
            </Card>
            <Copy>
              Use healthy, locally recommended seed and prepare well-drained
              soil before sowing. Monitor moisture, weeds and pests regularly,
              and follow advice from your local agriculture department for
              fertilizer and plant-protection decisions.
            </Copy>
            <Copy title>Growing essentials</Copy>
            {crop.details?.map((detail) => (
              <Card key={detail.title}>
                <Copy title>{detail.title}</Copy>
                <Copy>{detail.text}</Copy>
                <Listen text={detail.text} />
              </Card>
            ))}
            <Copy muted>
              These notes reproduce the portal growing guide. Follow current
              local agriculture advisories and product labels for final
              crop-protection decisions.
            </Copy>
            {crop.varieties?.length > 0 && (
              <Copy title>Types and varieties</Copy>
            )}
            {crop.varieties?.map((variety) => (
              <Card key={variety.name}>
                <Copy title>{variety.name}</Copy>
                <Copy muted>{variety.type}</Copy>
                <Copy>{variety.description}</Copy>
              </Card>
            ))}
            {crop.areaHectares && (
              <Card>
                <Copy title>Crop area in Chhattisgarh</Copy>
                <Copy>{`Kharif: ${crop.areaHectares[0].toLocaleString()} ha · Rabi: ${crop.areaHectares[1].toLocaleString()} ha`}</Copy>
                <Copy muted>
                  Figures from the portal static dataset; not a live acreage
                  survey.
                </Copy>
              </Card>
            )}
            <Listen text={crop.overview} />
          </>
        );
      }}
    </ContentScreen>
  );
}
