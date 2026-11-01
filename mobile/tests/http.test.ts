import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, fetchJson, validateBaseUrl } from "../src/services/http";
const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
test("production refuses HTTP and embedded credentials; LAN works only when enabled", () => {
  assert.throws(
    () => validateBaseUrl("http://192.168.1.10:3000", false),
    /HTTPS/,
  );
  assert.equal(
    validateBaseUrl("http://192.168.1.10:3000/", true),
    "http://192.168.1.10:3000",
  );
  assert.throws(
    () => validateBaseUrl("https://user:password@example.com", false),
    /credentials/,
  );
  assert.throws(() => validateBaseUrl("", false), /EXPO_PUBLIC_API_URL/);
});
test("preserves authorization and validation status without logging secrets", async () => {
  global.fetch = async () =>
    new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
  await assert.rejects(
    fetchJson("https://example.com"),
    (err) =>
      err instanceof ApiError &&
      err.status === 401 &&
      err.message === "Session expired",
  );
});
test("rejects malformed JSON", async () => {
  global.fetch = async () =>
    new Response("<html>Error</html>", { status: 200 });
  await assert.rejects(fetchJson("https://example.com"), /unreadable/);
});
test("reports offline failures and timeouts distinctly", async () => {
  global.fetch = async () => {
    throw new TypeError("network failed");
  };
  await assert.rejects(fetchJson("https://example.com"), /internet connection/);
  global.fetch = async (_url, options) =>
    new Promise((_resolve, reject) =>
      options?.signal?.addEventListener("abort", () =>
        reject(new Error("aborted")),
      ),
    );
  await assert.rejects(fetchJson("https://example.com", {}, 5), /timed out/);
});
test("sends JSON payloads and parses successful responses", async () => {
  global.fetch = async (_url, options) => {
    assert.equal(options?.body, JSON.stringify({ quantity: 20 }));
    return new Response(JSON.stringify({ number: "AG-test" }));
  };
  assert.deepEqual(
    await fetchJson("https://example.com", {
      method: "POST",
      body: JSON.stringify({ quantity: 20 }),
    }),
    { number: "AG-test" },
  );
});
