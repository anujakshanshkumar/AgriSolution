const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { MongoClient } = require("mongodb");
const config = require("../backend/src/config/environment");
const { validateToken } = require("../backend/src/services/token-service");
const { resolveRequestPath } = require("../models/pageModel");

test("private files and Windows path traversal cannot be served", () => {
  for (const path of [
    "/backend/.env",
    "/server.js",
    "/mobile/.env.local",
    "/.git/config",
    "/node_modules/express/index.js",
    "/images/%5c..%5cbackend%5cserver.js",
    "/images/../backend/server.js",
  ])
    assert.equal(resolveRequestPath(path), null, path);
  for (const path of [
    "/",
    "/notice-board.html",
    "/images/logo.jpg",
    "/js/token.js",
    "/style/style.css",
  ])
    assert.ok(resolveRequestPath(path), path);
});
test("token quantities require finite numbers and enforce acreage limit", () => {
  const requestId = crypto.randomUUID();
  for (const body of [
    { landArea: 0, quantity: 1 },
    { landArea: 1, quantity: 2101 },
    { landArea: 1, quantity: NaN },
    { landArea: "1", quantity: 5 },
  ])
    assert.throws(() => validateToken({ ...body, requestId }));
  assert.deepEqual(validateToken({ landArea: 2, quantity: 4200, requestId }), {
    landArea: 2,
    quantity: 4200,
    requestId,
  });
});
test("content is derived from the existing portal", async () => {
  const content =
    await require("../backend/src/services/content-service").getContent();
  assert.equal(content.crops.length, 31);
  assert.equal(content.schemes.length, 15);
  assert.equal(content.soils.length, 5);
  assert.equal(content.crops.find((c) => c.id === "paddy").details.length, 7);
  assert.equal(content.crops.find((c) => c.id === "paddy").varieties.length, 7);
  assert.ok(
    content.schemes.every((s) => s.title && s.summary && s.details.length),
  );
  assert.ok(content.districts.length >= 32);
  assert.ok(content.translations["Home"]);
  const map =
    await require("../backend/src/services/content-service").getDistrictMap();
  assert.equal(map.paths.length, 34);
  assert.ok(map.paths.every((path) => path.d));
});

// Opt-in integration uses the configured MongoDB, but ONLY uniquely prefixed test collections.
// It never reads, edits, or drops users, sessions, produceTokens or tokenCounters.
if (process.env.MOBILE_DB_TEST === "1") {
  const prefix = `mobile_test_${crypto.randomBytes(8).toString("hex")}_`;
  const client = new MongoClient(config.databaseUri, {
    serverSelectionTimeoutMS: 5000,
  });
  let db, server, origin;
  const used = new Set();
  const testDb = {
    collection(name) {
      const testName = prefix + name;
      used.add(testName);
      return db.collection(testName);
    },
  };
  before(async () => {
    await client.connect();
    db = client.db(config.databaseName);
    await testDb
      .collection("users")
      .createIndex({ mobile: 1 }, { unique: true });
    const repositoryPath = require.resolve(
      "../backend/src/infrastructure/user-repository",
    );
    require.cache[repositoryPath].exports = {
      getDatabase: async () => testDb,
      getUsersCollection: async () => testDb.collection("users"),
    };
    for (const name of [
      "../backend/src/services/token-service",
      "../backend/src/services/auth-service",
      "../backend/src/services/session-service",
    ])
      delete require.cache[require.resolve(name)];
    const app = require("../backend/server");
    const pages = require("../routes/pageRoutes");
    server = http.createServer((req, res) =>
      /^\/api(?:\/|\?|$)/.test(req.url)
        ? app(req, res)
        : pages.handleRequest(req, res),
    );
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    for (const name of used) {
      assert.ok(
        name.startsWith(prefix) &&
          /^mobile_test_[a-f0-9]{16}_[A-Za-z]+$/.test(name),
      );
      try {
        await db.collection(name).drop();
      } catch (error) {
        if (error.code !== 26) throw error;
      }
    }
    await client.close();
  });
  async function request(path, body, token) {
    const response = await fetch(origin + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  }
  test("live MongoDB: auth, ownership, atomic tokens, idempotency, password revocation and legacy compatibility", async () => {
    const a = {
      mobile: "mobile-test-a",
      password: "test-only-password-A",
      name: "Test Farmer A",
      district: "Raipur",
    };
    const b = {
      mobile: "mobile-test-b",
      password: "test-only-password-B",
      name: "Test Farmer B",
      district: "Durg",
    };
    assert.equal((await request("/api/register", a)).status, 200);
    assert.equal((await request("/api/v1/auth/register", b)).status, 200);
    assert.equal((await request("/api/register", a)).status, 409);
    assert.equal(
      (await request("/api/login", { mobile: a.mobile, password: "incorrect" }))
        .status,
      401,
    );
    const login = await request("/api/login", a);
    assert.equal(login.status, 200);
    assert.equal(login.body.name, a.name);
    const token = login.body.accessToken;
    const second = (await request("/api/v1/auth/login", b)).body.accessToken;
    assert.equal((await request("/api/v1/me")).status, 401);
    assert.equal(
      (await request("/api/v1/me", undefined, token)).body.name,
      a.name,
    );
    const stored = await testDb
      .collection("sessions")
      .findOne({
        userId: new (require("mongodb").ObjectId)(login.body.userId),
      });
    assert.notEqual(stored._id, token);
    assert.equal(stored._id.length, 64);
    assert.equal(
      (
        await request(
          "/api/v1/tokens",
          { landArea: 1, quantity: 2101, requestId: crypto.randomUUID() },
          token,
        )
      ).status,
      400,
    );
    const payload = {
      landArea: 2,
      quantity: 2000,
      requestId: crypto.randomUUID(),
    };
    const concurrent = await Promise.all(
      Array.from({ length: 4 }, () =>
        request("/api/v1/tokens", payload, token),
      ),
    );
    assert.ok(concurrent.every((r) => r.status === 201));
    assert.equal(new Set(concurrent.map((r) => r.body.number)).size, 1);
    assert.equal(
      (await request("/api/v1/tokens", { ...payload, quantity: 1000 }, token))
        .status,
      409,
    );
    const independent = await Promise.all(
      Array.from({ length: 4 }, () =>
        request(
          "/api/v1/tokens",
          { ...payload, requestId: crypto.randomUUID() },
          token,
        ),
      ),
    );
    assert.equal(new Set(independent.map((r) => r.body.number)).size, 4);
    assert.equal(
      (await request("/api/v1/tokens", undefined, second)).body.tokens.length,
      0,
    );
    assert.equal(
      (await request("/api/v1/tokens", undefined, token)).body.tokens.length,
      5,
    );
    assert.equal(
      (
        await request(
          "/api/v1/password",
          { currentPassword: a.password, newPassword: "updated-test-password" },
          token,
        )
      ).status,
      200,
    );
    assert.equal((await request("/api/v1/me", undefined, token)).status, 401);
    assert.equal((await request("/api/login", a)).status, 401);
    const updated = (
      await request("/api/login", {
        mobile: a.mobile,
        password: "updated-test-password",
      })
    ).body.accessToken;
    assert.equal((await request("/api/v1/logout", {}, updated)).status, 200);
    assert.equal((await request("/api/v1/me", undefined, updated)).status, 401);
    await testDb
      .collection("sessions")
      .updateMany(
        {
          userId: new (require("mongodb").ObjectId)(
            (await request("/api/v1/me", undefined, second)).body.userId,
          ),
        },
        { $set: { expiresAt: new Date(0) } },
      );
    assert.equal((await request("/api/v1/me", undefined, second)).status, 401);
  });
  test("existing HTML, EJS, assets and public API still work", async () => {
    for (const path of [
      "/",
      "/about.html",
      "/login.html",
      "/dashboard.html",
      "/token.html",
      "/crop.html",
      "/crop-details.html?crop=paddy",
      "/all-crops",
      "/crop/paddy",
      "/schemes.html",
      "/soil.html",
      "/del.html",
      "/distmap.html",
      "/notice-board.html",
      "/images/logo.jpg",
      "/js/login.js",
    ])
      assert.equal((await fetch(origin + path)).status, 200, path);
    assert.equal((await request("/api/v1/content")).status, 200);
    for (const path of ["/backend/.env", "/mobile/package.json", "/server.js"])
      assert.equal((await fetch(origin + path)).status, 403, path);
  });
}
