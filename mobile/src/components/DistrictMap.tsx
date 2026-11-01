import Svg, { Path } from "react-native-svg";
import { Platform } from "react-native";
import { api } from "../services/api";
import { useResource } from "../hooks/useResource";
import { Feedback } from "./ui";
interface MapData {
  viewBox: string;
  paths: { id: string; d: string; transform: string; outline: boolean }[];
}
const loadMap = () => api<MapData>("district-map");
export function DistrictMap({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { data, error, loading, refresh } = useResource(loadMap);
  const paths = [...(data?.paths || [])].sort(
    (a, b) => Number(b.outline) - Number(a.outline),
  );
  const fill = (path: MapData["paths"][number]) =>
    path.outline ? "none" : selected === path.id ? "#e3bb63" : "#b8d8bd";
  const label =
    "Chhattisgarh district map. Tap a district, or use the searchable list below.";
  // Browser previews use DOM click handlers to avoid SVG responder incompatibilities.
  return (
    <>
      <Feedback error={error} loading={loading} retry={refresh} />
      {data &&
        (Platform.OS === "web" ? (
          <svg
            viewBox={data.viewBox}
            width="100%"
            height={360}
            aria-label={label}
          >
            {paths.map((path) => (
              <path
                key={path.id}
                id={path.id}
                d={path.d}
                transform={path.transform}
                fill={fill(path)}
                stroke="#004d40"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                onClick={() => onSelect(path.id)}
              />
            ))}
          </svg>
        ) : (
          <Svg
            viewBox={data.viewBox}
            width="100%"
            height={360}
            accessibilityLabel={label}
          >
            {paths.map((path) => (
              <Path
                key={path.id}
                id={path.id}
                d={path.d}
                transform={path.transform}
                fill={fill(path)}
                stroke="#004d40"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                onPress={() => onSelect(path.id)}
              />
            ))}
          </Svg>
        ))}
    </>
  );
}
