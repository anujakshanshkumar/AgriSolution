import { fetchJson } from "./http";
import { Place } from "../types";
export interface Weather {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
  hourly: {
    time: string[];
    soil_temperature_0cm: number[];
    soil_moisture_0_to_1cm: number[];
  };
}
export async function getWeather(place: Place) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    hourly: "soil_temperature_0cm,soil_moisture_0_to_1cm",
    timezone: "auto",
    forecast_days: "7",
  });
  const data = await fetchJson<Weather>(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    {},
    20000,
  );
  if (
    !Number.isFinite(data.current?.temperature_2m) ||
    !Array.isArray(data.daily?.time) ||
    !Array.isArray(data.hourly?.time)
  )
    throw new Error("Weather service returned incomplete data.");
  return { ...data, location: place };
}
export function conditions(code: number) {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 95) return "Thunderstorm";
  if (code >= 71 && code <= 77) return "Snow";
  return "Rain";
}
