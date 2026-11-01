import { useCallback, useState } from "react";
import * as Location from "expo-location";
import {
  Button,
  Card,
  Chips,
  Copy,
  Feedback,
  Photo,
  Screen,
} from "../../components/ui";
import { usePortal } from "../../hooks/PortalProvider";
import { useResource } from "../../hooks/useResource";
import { conditions, getWeather } from "../../services/weather";
import { Place } from "../../types";
const raipur: Place = { name: "Raipur", latitude: 21.2506, longitude: 81.6348 };
export default function WeatherScreen() {
  const { content } = usePortal();
  const [place, setPlace] = useState<Place>(raipur);
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const weather = useResource(useCallback(() => getWeather(place), [place]));
  async function locate() {
    setLocating(true);
    setLocationError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error(
          "Location permission was declined. Choose a city instead.",
        );
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPlace({
        name: "Your location",
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
      });
    } catch (err) {
      setLocationError(
        err instanceof Error ? err.message : "Location unavailable.",
      );
    } finally {
      setLocating(false);
    }
  }
  const data = weather.data;
  const hour = data
    ? Math.max(
        0,
        data.hourly.time.findIndex(
          (time) => time.slice(0, 13) === data.current.time.slice(0, 13),
        ),
      )
    : 0;
  return (
    <Screen refreshing={weather.loading} onRefresh={weather.refresh}>
      <Copy title>Weather & soil insights</Copy>
      <Copy>
        Plan irrigation, field work, and crop care with local information.
      </Copy>
      <Chips
        options={(content.data?.locations || [raipur]).map((p) => p.name)}
        value={place.name}
        onChange={(name) =>
          setPlace(
            content.data?.locations.find((p) => p.name === name) || raipur,
          )
        }
      />
      <Button
        label="Use my location"
        secondary
        onPress={locate}
        disabled={locating}
      />
      <Copy muted>
        Precise location is used only when you request it, and sent to
        Open-Meteo for the forecast.
      </Copy>
      <Feedback
        error={locationError || weather.error}
        loading={locating || (weather.loading && !data)}
        retry={weather.refresh}
      />
      {data && (
        <>
          <Card>
            <Copy muted>{`Today in ${data.location.name}`}</Copy>
            <Copy
              title
            >{`${Math.round(data.current.temperature_2m)}°C · ${conditions(data.current.weather_code)}`}</Copy>
            <Copy>{`Feels like ${data.current.apparent_temperature}°C`}</Copy>
            <Copy>{`Humidity ${data.current.relative_humidity_2m}% · Wind ${data.current.wind_speed_10m} km/h`}</Copy>
            <Copy
              muted
            >{`Updated ${data.current.time.replace("T", " ")}`}</Copy>
          </Card>
          <Copy title>7-day forecast</Copy>
          {data.daily.time.map((date, i) => (
            <Card key={date}>
              <Copy>{`${date} · ${conditions(data.daily.weather_code[i])}`}</Copy>
              <Copy>{`${data.daily.temperature_2m_min[i]}–${data.daily.temperature_2m_max[i]}°C · Rain chance ${data.daily.precipitation_probability_max[i]}%`}</Copy>
            </Card>
          ))}
          <Card>
            <Copy title>Local soil conditions</Copy>
            <Copy>{`Topsoil moisture: ${data.hourly.soil_moisture_0_to_1cm[hour] ?? "Unavailable"} m³/m³`}</Copy>
            <Copy>{`Soil temperature: ${data.hourly.soil_temperature_0cm[hour] ?? "Unavailable"}°C`}</Copy>
            <Copy muted>Regional model estimate, not a field soil test.</Copy>
          </Card>
          <Copy muted>
            Forecast: Open-Meteo. Use as a planning aid alongside field
            observations and official advisories.
          </Copy>
        </>
      )}
      <Copy title>Soil profile of Chhattisgarh</Copy>
      <Feedback error={content.error} retry={content.refresh} />
      {content.data?.soils.map((soil) => (
        <Card key={soil.title}>
          <Photo path={soil.image} />
          <Copy title>{soil.title}</Copy>
          <Copy muted>{soil.category}</Copy>
          <Copy>{soil.summary}</Copy>
        </Card>
      ))}
      <Copy muted>
        For crop selection and fertilizer application, use a current soil-health
        test and advice from your local agriculture office or Krishi Vigyan
        Kendra.
      </Copy>
    </Screen>
  );
}
