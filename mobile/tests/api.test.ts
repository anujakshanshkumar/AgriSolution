import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { ApiError, validateBaseUrl } from "../src/services/http";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

// Run the real client with controllable native storage and network boundaries.
function clientHarness() {
  let stored: string | null = null;
  let invalidations = 0;
  let writeGate: ReturnType<typeof deferred<void>> | undefined;
  let writeEntered: ReturnType<typeof deferred<void>> | undefined;
  const responses: Promise<unknown>[] = [];
  const requests: RequestInit[] = [];
  const urls: string[] = [];
  const source = readFileSync(resolve(__dirname, "../src/services/api.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const module = { exports: {} as typeof import("../src/services/api") };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(name: string) {
      if (name === "react-native") return { Platform: { OS: "android" } };
      if (name === "expo-secure-store")
        return {
          WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
          getItemAsync: async () => stored,
          async setItemAsync(_key: string, value: string) {
            writeEntered?.resolve();
            if (writeGate) await writeGate.promise;
            stored = value;
          },
          async deleteItemAsync() {
            stored = null;
          },
        };
      if (name === "./http")
        return {
          ApiError,
          validateBaseUrl,
          async fetchJson(url: string, options: RequestInit) {
            urls.push(url);
            requests.push(options);
            return responses.shift() || {};
          },
        };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: { EXPO_PUBLIC_API_URL: "https://example.invalid" } },
    __DEV__: false,
  });
  const client = module.exports;
  client.onUnauthorized(() => invalidations++);
  return {
    client,
    responses,
    requests,
    urls,
    stored: () => stored,
    invalidations: () => invalidations,
    blockWrite() {
      writeGate = deferred<void>();
      writeEntered = deferred<void>();
      return { release: writeGate.resolve, entered: writeEntered.promise };
    },
  };
}

test("an expired active session clears storage and notifies the account", async () => {
  const harness = clientHarness();
  await harness.client.saveToken("expired-session");
  harness.responses.push(Promise.reject(new ApiError("Expired", 401)));
  await assert.rejects(harness.client.api("me", undefined, true), /Expired/);
  assert.equal(harness.urls[0], "https://example.invalid/api/v1/me");
  assert.equal(harness.stored(), null);
  assert.equal(harness.invalidations(), 1);
});

test("resolves portal assets from relative paths and preserves absolute URLs", () => {
  const harness = clientHarness();
  assert.equal(
    harness.client.assetUrl("/images/crop.jpg"),
    "https://example.invalid/images/crop.jpg",
  );
  assert.equal(
    harness.client.assetUrl("https://cdn.example.invalid/crop.jpg"),
    "https://cdn.example.invalid/crop.jpg",
  );
});

test("a late 401 from an older request preserves a subsequent login", async () => {
  const harness = clientHarness();
  await harness.client.saveToken("old-session");
  const response = deferred<unknown>();
  harness.responses.push(response.promise);
  const request = harness.client.api("me", undefined, true);
  const rejected = assert.rejects(request, /Expired/);
  await harness.client.saveToken("new-session");
  response.reject(new ApiError("Expired", 401));
  await rejected;
  assert.equal(harness.stored(), "new-session");
  assert.equal(harness.invalidations(), 0);
  await harness.client.api("me", undefined, true);
  assert.equal(
    (harness.requests.at(-1)?.headers as Record<string, string>).Authorization,
    "Bearer new-session",
  );
});

test("a late 401 cannot overtake an in-progress native session write", async () => {
  const harness = clientHarness();
  await harness.client.saveToken("old-session");
  const response = deferred<unknown>();
  harness.responses.push(response.promise);
  const rejected = assert.rejects(
    harness.client.api("me", undefined, true),
    /Expired/,
  );
  const gate = harness.blockWrite();
  const login = harness.client.saveToken("new-session");
  await gate.entered;
  response.reject(new ApiError("Expired", 401));
  // Let the failed request enqueue its invalidation while the write is pending.
  await new Promise<void>((resolve) => setImmediate(resolve));
  gate.release();
  await Promise.all([login, rejected]);
  assert.equal(harness.stored(), "new-session");
  assert.equal(harness.invalidations(), 0);
});

test("an incorrect current password does not invalidate the session", async () => {
  const harness = clientHarness();
  await harness.client.saveToken("current-session");
  harness.responses.push(Promise.reject(new ApiError("Incorrect password", 401)));
  await assert.rejects(harness.client.api("password", {}, true), /Incorrect/);
  assert.equal(harness.stored(), "current-session");
  assert.equal(harness.invalidations(), 0);
});
