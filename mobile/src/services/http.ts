export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
  }
}
export function validateBaseUrl(value: string, development: boolean) {
  if (!value)
    throw new ApiError(
      "Set EXPO_PUBLIC_API_URL to your portal address, then restart the app build.",
    );
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError("The portal address is invalid.");
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["http:", "https:"].includes(url.protocol)
  )
    throw new ApiError(
      "Use a portal URL without credentials, query parameters or fragments.",
    );
  if (!development && url.protocol !== "https:")
    throw new ApiError(
      "Installed production apps require an HTTPS portal address.",
    );
  return value.replace(/\/+$/, "");
}
export async function fetchJson<T>(
  url: string,
  options: RequestInit = {},
  timeout = 35000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new ApiError(
        "The server returned an unreadable response.",
        response.status,
      );
    }
    if (!response.ok)
      throw new ApiError(
        result.error || `Request failed (${response.status}).`,
        response.status,
      );
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted)
      throw new ApiError(
        "The request timed out. Check your connection and retry.",
      );
    throw new ApiError(
      "Cannot reach the server. Check your internet connection and portal address.",
    );
  } finally {
    clearTimeout(timer);
  }
}
