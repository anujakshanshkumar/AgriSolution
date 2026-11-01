const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = process.env.MOBILE_PREVIEW_URL || "http://localhost:8088";
const backend = process.env.AGRI_TEST_URL || "http://127.0.0.1:3000";
(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Use the running test server, independent of the embedded LAN development address.
    await page.route("http://10.110.128.57:3000/**", async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        response: await page.request.fetch(backend + url.pathname + url.search),
      });
    });
    await page.goto(base, { waitUntil: "networkidle", timeout: 120000 });
    await page
      .getByText("Empowering farmers, enriching lives", { exact: true })
      .waitFor();
    await fs.mkdir("mobile/artifacts", { recursive: true });
    await page.screenshot({
      path: "mobile/artifacts/home.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Crop information  →", exact: true })
      .click();
    await page.getByLabel("Search crops", { exact: true }).fill("maize");
    await page.getByText("1 crops", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "View crop guide", exact: true })
      .click();
    await page.getByText("Sowing period", { exact: true }).waitFor();
    await page.getByText("Growing essentials", { exact: true }).waitFor();
    await page.getByText("Irrigation", { exact: true }).waitFor();
    await page.goto(base + "/schemes", { waitUntil: "networkidle" });
    await page
      .getByLabel("Search Schemes...", { exact: true })
      .fill("PM-KISAN");
    await page
      .getByRole("button", {
        name: "Eligibility, benefits & documents",
        exact: true,
      })
      .first()
      .click();
    await page
      .getByText("Eligibility Criteria", { exact: true })
      .first()
      .waitFor();
    await page.screenshot({
      path: "mobile/artifacts/schemes.png",
      fullPage: true,
    });
    await page.goto(base + "/districts", { waitUntil: "networkidle" });
    await page.getByLabel("Search district", { exact: true }).fill("Dhamtari");
    await page.getByText("Dhamtari", { exact: true }).first().waitFor();
    assert.equal(
      await page.locator('svg[viewBox="0 0 325.12 407.24664"] path').count(),
      34,
    );
    await page.locator("svg #path3325").dispatchEvent("click");
    await page.getByText("Balod", { exact: true }).first().waitFor();
    await page
      .getByRole("button", { name: "Show all districts", exact: true })
      .waitFor();
    await page.screenshot({
      path: "mobile/artifacts/districts.png",
      fullPage: true,
    });
    await page.goto(base + "/login", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await page
      .getByText("Enter your mobile number, password and required name.", {
        exact: true,
      })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: 390px browser preview: home, crop search/detail, scheme filter/details, native SVG map/list, login validation; no page exceptions. Not a native device test.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
