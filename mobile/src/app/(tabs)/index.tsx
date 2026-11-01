import { useCallback } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, Href } from "expo-router";
import { Button, Copy, Feedback, Screen } from "../../components/ui";
import { colors } from "../../config/theme";
import { usePortal } from "../../hooks/PortalProvider";
import { useResource } from "../../hooks/useResource";
import { conditions, getWeather } from "../../services/weather";
import { Place } from "../../types";

const raipur: Place = {
  name: "Raipur, Chhattisgarh",
  latitude: 21.2506,
  longitude: 81.6348,
};
const serviceLinks: {
  title: string;
  description: string;
  icon: string;
  path: Href;
}[] = [
  {
    title: "Farmer Registration",
    description: "Access your farmer account and services",
    icon: "♙",
    path: "/login",
  },
  {
    title: "Crop Information",
    description: "Explore crops, varieties and growing guidance",
    icon: "♧",
    path: "/(tabs)/crops",
  },
  {
    title: "Schemes and Subsidies",
    description: "Explore government programs and farmer support",
    icon: "▤",
    path: "/schemes",
  },
  {
    title: "Procurement Centres",
    description: "Find procurement centres and district services",
    icon: "⌖",
    path: "/centres",
  },
  {
    title: "District Map",
    description: "Explore districts and local information",
    icon: "⌖",
    path: "/districts",
  },
  {
    title: "Weather and Soil",
    description: "Check local forecasts and regional soil guidance",
    icon: "☼",
    path: "/(tabs)/weather",
  },
  {
    title: "Notice Board",
    description: "Read the latest portal and farming notices",
    icon: "◉",
    path: "/notices",
  },
  {
    title: "Farming Assistant",
    description: "Ask farming questions in English or Hindi",
    icon: "✳",
    path: "/chat",
  },
];

export default function Home() {
  const { user, content, language, setLanguage } = usePortal();
  const weather = useResource(
    useCallback(() => getWeather(raipur), []),
  );
  return (
    <Screen
      refreshing={content.loading}
      onRefresh={content.refresh}
      flush
    >
      <View style={home.header}>
        <Image
          source={require("../../../assets/logo.jpg")}
          style={home.logo}
          resizeMode="contain"
        />
        <View style={home.brandCopy}>
          <Text style={home.brandName}>Agri-Solution</Text>
          <Text style={home.brandSubtitle}>One-Stop Solution</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setLanguage(language === "en" ? "hi" : "en")}
          style={home.languageButton}
        >
          <Text style={home.languageText}>
            {language === "en" ? "English  ▾" : "हिंदी  ▾"}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={home.navigation}
      >
        {[
          ["Home", "/(tabs)"],
          ["About", "/about"],
          ["Crop Information", "/(tabs)/crops"],
          ["Schemes", "/schemes"],
          ["Dealers", "/centres"],
          ["Weather & Soil", "/(tabs)/weather"],
          ["District Map", "/districts"],
        ].map(([label, path], index) => (
          <Pressable
            accessibilityRole="button"
            key={label}
            onPress={() => router.push(path as Href)}
            style={[home.navigationItem, index === 0 && home.activeNavigationItem]}
          >
            <Text
              style={[
                home.navigationText,
                index === 0 && home.activeNavigationText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/notices")}
        style={home.notice}
      >
        <Text style={home.noticeLabel}>◉  Latest notices</Text>
        <Text numberOfLines={1} style={home.noticeCopy}>
          New: seasonal crop information is available · Explore farmer schemes
        </Text>
        <Text style={home.noticeAction}>View all  ›</Text>
      </Pressable>
      <ImageBackground
        source={require("../../../assets/hero.png")}
        resizeMode="cover"
        style={home.hero}
        imageStyle={home.heroImage}
      >
        <View style={home.heroOverlay} />
        <View style={home.heroContent}>
          <Text style={home.heroTitle}>
            Growing a Healthier Tomorrow, Naturally
          </Text>
          <Text style={home.heroBody}>
            Farming is not just a job, it is our life. We work with farmers to
            grow safe and healthy crops using natural and sustainable methods.
            Our goal is to protect the soil, improve harvest quality, and ensure
            a better future for farmers and their families.
          </Text>
          <View style={home.heroActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/schemes")}
              style={home.heroOutlineButton}
            >
              <Text style={home.heroOutlineText}>View Schemes  ›</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(user ? "/(tabs)/account" : "/login")}
              style={home.heroGoldButton}
            >
              <Text style={home.heroGoldText}>
                {user ? "My Account  ›" : "Farmer Registration  ›"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
      <View style={home.services}>
        <View style={home.sectionHeading}>
          <Copy title>Essential Services and Information</Copy>
          <View style={home.headingRule} />
          <Text style={home.sectionSubtitle}>
            Helpful information and services for farmers across Chhattisgarh
          </Text>
        </View>
        <Feedback error={content.error} retry={content.refresh} />
        <View style={home.serviceGrid}>
          {serviceLinks.map((service, index) => (
            <Pressable
              accessibilityRole="button"
              key={service.title}
              onPress={() => router.push(service.path)}
              style={({ pressed }) => [
                home.serviceCard,
                pressed && home.pressedCard,
              ]}
            >
              <View
                style={[
                  home.serviceIcon,
                  index % 3 === 1 && home.goldIcon,
                  index % 3 === 2 && home.terracottaIcon,
                ]}
              >
                <Text style={home.serviceIconText}>{service.icon}</Text>
              </View>
              <Text style={home.serviceTitle}>{service.title}</Text>
              <Text style={home.serviceDescription}>{service.description}</Text>
              <View
                style={[
                  home.serviceAccent,
                  index % 2 === 1 && home.terracottaAccent,
                ]}
              />
            </Pressable>
          ))}
        </View>
        <View style={home.weatherCard}>
          <Text style={home.weatherEyebrow}>LOCAL WEATHER</Text>
          <Text style={home.weatherLocation}>{raipur.name}</Text>
          {weather.data ? (
            <>
              <Text style={home.weatherTemperature}>
                {Math.round(weather.data.current.temperature_2m)}°C
              </Text>
              <Text style={home.weatherCopy}>
                {conditions(weather.data.current.weather_code)} · Feels like{" "}
                {Math.round(weather.data.current.apparent_temperature)}°C
              </Text>
              <Text style={home.weatherUpdated}>
                Updated {weather.data.current.time.replace("T", " ")}
              </Text>
            </>
          ) : (
            <Text style={home.weatherCopy}>
              {weather.error ||
                (weather.loading
                  ? "Loading latest conditions…"
                  : "Current conditions are unavailable.")}
            </Text>
          )}
          <View style={home.weatherActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/(tabs)/weather")}
            >
              <Text style={home.weatherAction}>Full forecast  ›</Text>
            </Pressable>
            {!weather.data && !weather.loading && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void weather.refresh()}
              >
                <Text style={home.weatherAction}>Try again</Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={home.footer}>
          <Button
            secondary
            label="About Agri-Solution"
            onPress={() => router.push("/about")}
          />
          <Copy muted>
            {content.data?.disclaimer ||
              "An unofficial student project for educational and demonstration purposes."}
          </Copy>
        </View>
      </View>
    </Screen>
  );
}

const home = {
  header: {
    minHeight: 68,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 2,
  },
  logo: { width: 44, height: 44 },
  brandCopy: { flex: 1 },
  brandName: { color: colors.brand, fontSize: 19, fontWeight: "700" as const },
  brandSubtitle: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.3,
  },
  languageButton: {
    minHeight: 36,
    justifyContent: "center" as const,
    borderColor: "#cccccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 9,
  },
  languageText: { color: colors.text, fontSize: 12, fontWeight: "600" as const },
  navigation: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    minHeight: 46,
    alignItems: "center" as const,
  },
  navigationItem: {
    minHeight: 38,
    paddingHorizontal: 12,
    justifyContent: "center" as const,
    borderRadius: 5,
  },
  activeNavigationItem: { backgroundColor: "#ffffff1a" },
  navigationText: { color: colors.white, fontSize: 13, fontWeight: "500" as const },
  activeNavigationText: { color: "#8bc34a", fontWeight: "700" as const },
  notice: {
    minHeight: 48,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "#f3ecd9",
    borderBottomWidth: 1,
    borderBottomColor: "#e4dcc7",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  noticeLabel: { color: "#725b2e", fontSize: 11, fontWeight: "800" as const },
  noticeCopy: { flex: 1, color: "#39483b", fontSize: 11, fontWeight: "500" as const },
  noticeAction: { color: colors.green, fontSize: 12, fontWeight: "700" as const },
  hero: { minHeight: 480, justifyContent: "flex-end" as const, backgroundColor: "#173a28" },
  heroImage: { position: "absolute" as const, width: "100%" as const, height: "100%" as const },
  heroOverlay: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(8, 39, 26, 0.75)",
  },
  heroContent: { paddingHorizontal: 22, paddingTop: 50, paddingBottom: 56, gap: 14 },
  heroTitle: {
    color: colors.white,
    fontFamily: "Georgia",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "600" as const,
    letterSpacing: -0.8,
  },
  heroBody: { color: "#f5f5ef", fontSize: 14, lineHeight: 22 },
  heroActions: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10, paddingTop: 2 },
  heroOutlineButton: {
    minHeight: 44,
    justifyContent: "center" as const,
    borderColor: "#ffffffbf",
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: "#0f2a1d3d",
    paddingHorizontal: 16,
  },
  heroOutlineText: { color: colors.white, fontSize: 13, fontWeight: "600" as const },
  heroGoldButton: {
    minHeight: 44,
    justifyContent: "center" as const,
    borderColor: "#e7c36d",
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
  },
  heroGoldText: { color: "#203428", fontSize: 13, fontWeight: "700" as const },
  services: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 26,
    gap: 18,
  },
  sectionHeading: { alignItems: "center" as const, gap: 8, paddingBottom: 4 },
  headingRule: {
    width: 56,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.goldDark,
  },
  sectionSubtitle: { color: "#707b70", fontSize: 13, lineHeight: 19, textAlign: "center" as const },
  serviceGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 10 },
  serviceCard: {
    flexBasis: "48%" as const,
    flexGrow: 1,
    minWidth: 135,
    minHeight: 155,
    overflow: "hidden" as const,
    position: "relative" as const,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    gap: 8,
    shadowColor: "#1d3f2a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1,
  },
  pressedCard: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#edf3e8",
  },
  goldIcon: { backgroundColor: "#f7f0dc" },
  terracottaIcon: { backgroundColor: "#f7ebe5" },
  serviceIconText: { color: "#386344", fontSize: 25, fontWeight: "600" as const },
  serviceTitle: { color: "#254331", fontSize: 14, lineHeight: 19, fontWeight: "700" as const },
  serviceDescription: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  serviceAccent: {
    position: "absolute" as const,
    height: 4,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.goldDark,
  },
  terracottaAccent: { backgroundColor: colors.terracotta },
  weatherCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#346d4d",
    backgroundColor: "#174a34",
    padding: 20,
    gap: 8,
  },
  weatherEyebrow: { color: "#f0d28b", fontSize: 11, fontWeight: "800" as const, letterSpacing: 1.4 },
  weatherLocation: { color: colors.white, fontSize: 15, fontWeight: "600" as const },
  weatherTemperature: { color: "#f0d28b", fontSize: 36, lineHeight: 40, fontWeight: "700" as const },
  weatherCopy: { color: "#ffffffd9", fontSize: 14, lineHeight: 21 },
  weatherUpdated: { color: "#ffffffad", fontSize: 11 },
  weatherActions: { flexDirection: "row" as const, gap: 20, paddingTop: 5 },
  weatherAction: { color: "#f0d28b", fontSize: 14, fontWeight: "700" as const },
  footer: { gap: 14, paddingTop: 4 },
};
