export interface User {
  userId: string;
  name: string;
  mobile: string;
  district: string | null;
}
export interface LoginResponse extends User {
  accessToken: string;
  expiresAt: string;
}
export interface Crop {
  id: string;
  name: string;
  image: string;
  category: string;
  season: string;
  overview: string;
  sowing: string;
  harvest: string;
  details: { title: string; text: string }[];
  varieties: { name: string; description: string; type: string }[];
  areaHectares: [number, number] | null;
}
export interface Scheme {
  id: string;
  title: string;
  summary: string;
  image?: string;
  url?: string;
  jurisdiction: string;
  categories: string[];
  farmerTypes: string[];
  details: { title: string; text: string }[];
}
export interface Notice {
  id: string;
  title: string;
  summary: string;
  dateLabel: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  filter: string;
}
export interface District {
  id: string;
  districtName: string;
  populationNumber: string;
  areaSize: string;
  capitalCity: string;
  aboutDistrict: string;
  districtImage: string;
}
export interface Place {
  name: string;
  latitude: number;
  longitude: number;
}
export interface Content {
  crops: Crop[];
  schemes: Scheme[];
  notices: Notice[];
  districts: District[];
  centres: Record<string, Record<string, string[]>>;
  locations: Place[];
  soils: { title: string; category: string; summary: string; image: string }[];
  about: { heading: boolean; text: string }[];
  translations: Record<string, string>;
  disclaimer: string;
}
export interface ProduceToken {
  number: string;
  farmerName: string;
  address: string;
  landArea: number;
  quantity: number;
  createdAt: string;
}
export interface TokenList {
  tokens: ProduceToken[];
  issuedCount: number;
  maxKgPerAcre: number;
}
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}
