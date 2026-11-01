import * as SecureStore from "expo-secure-store";
import { fetchJson, validateBaseUrl } from "./http";

function baseUrl(): string {
  return validateBaseUrl(
    process.env.EXPO_PUBLIC_API_URL || "",
    __DEV__,
  );
}

let unauthorizedHandler: (() => void) | undefined;
let tokenStorageQueue: Promise<void> = Promise.resolve();

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

function withTokenStorage<T>(operation: () => Promise<T>): Promise<T> {
  const result = tokenStorageQueue.then(operation, operation);
  tokenStorageQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function restoreToken(): Promise<boolean> {
  const token = await withTokenStorage(() =>
    SecureStore.getItemAsync("agri_access_token"),
  );
  return Boolean(token);
}

export async function saveToken(token: string | null): Promise<void> {
  await withTokenStorage(async () => {
    if (token) {
      await SecureStore.setItemAsync("agri_access_token", token);
    } else {
      await SecureStore.deleteItemAsync("agri_access_token");
    }
  });
}

function isUnauthorized(error: unknown): error is Error & { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 401 &&
    "message" in error &&
    typeof error.message === "string"
  );
}

async function clearExpiredToken(requestToken: string | null): Promise<void> {
  const cleared = await withTokenStorage(async () => {
    const storedToken = await SecureStore.getItemAsync("agri_access_token");
    if (storedToken !== requestToken) return false;
    await SecureStore.deleteItemAsync("agri_access_token");
    return true;
  });
  if (cleared) unauthorizedHandler?.();
}

export function assetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl()}/${path.replace(/^\/+/, "")}`;
}

export async function api<T = { success: boolean }>(
  endpoint: string,
  body?: unknown,
  authenticated = false,
): Promise<T> {
  const token = authenticated
    ? await withTokenStorage(() =>
        SecureStore.getItemAsync("agri_access_token"),
      )
    : null;
  const path = endpoint.replace(/^\/+/, "");

  try {
    return await fetchJson<T>(
      `${baseUrl()}/api/v1/${path}`,
      {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          ...(body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined
          ? {}
          : { body: JSON.stringify(body) }),
      },
    );
  } catch (error) {
    if (isUnauthorized(error)) {
      const invalidPassword =
        path === "password" &&
        /incorrect password/i.test(error.message);
      if (authenticated && token && !invalidPassword) {
        await clearExpiredToken(token);
      }
    }

    throw error;
  }
}