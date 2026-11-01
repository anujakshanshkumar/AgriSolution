// The website remains the editorial source for native screens.
const fs = require("fs/promises");
const path = require("path");
const vm = require("vm");
const cheerio = require("cheerio");
const { cropsByKey } = require("../../../models/cropModel");
const root = path.resolve(__dirname, "../../..");
const clean = (value) => value.replace(/\s+/g, " ").trim();
async function read(file) {
  return fs.readFile(path.join(root, file), "utf8");
}
function literal(source, assignment, closing) {
  const start = source.indexOf(assignment);
  if (start < 0) throw new Error(`Missing public content: ${assignment}`);
  const rest = source.slice(start + assignment.length);
  const end = rest.indexOf(closing);
  if (end < 0) throw new Error("Public content terminator missing");
  // Repository-owned literal expressions only; never request-supplied scripts.
  return JSON.parse(
    JSON.stringify(
      vm.runInNewContext(
        `(${rest.slice(0, end + closing.indexOf("}") + 1)})`,
        Object.create(null),
        { timeout: 100 },
      ),
    ),
  );
}
async function getContent() {
  const [
    schemesHtml,
    soilHtml,
    aboutHtml,
    dealerJs,
    districtJs,
    noticeJs,
    weatherJs,
    hindiJs,
    cropJs,
    cropDetailJs,
  ] = await Promise.all(
    [
      "schemes.html",
      "soil.html",
      "about.html",
      "js/del.js",
      "js/maya.js",
      "js/government-notices.js",
      "js/soil-weather.js",
      "js/hindi-translations.js",
      "js/crop.js",
      "js/crop-details.js",
    ].map(read),
  );
  const $ = cheerio.load(schemesHtml);
  const schemes = $(".schemes-card")
    .toArray()
    .map((el, index) => {
      const card = $(el);
      return {
        id: String(index + 1),
        title: clean(card.find(".main-title").text()),
        summary: clean(card.find(".scheme-para").text()),
        image: card.find("img").first().attr("src"),
        url: card.find(".apply-btn").attr("href"),
        jurisdiction: card.attr("data-jurisdiction"),
        categories: (card.attr("data-categories") || "").split(/\s+/),
        farmerTypes: (card.attr("data-farmer-types") || "").split(/\s+/),
        details: card
          .find(".scheme-detail")
          .toArray()
          .map((section) => ({
            title: clean($(section).find("h3").text()),
            text: clean($(section).find("li,p").text()),
          })),
      };
    });
  const soil = cheerio.load(soilHtml);
  const soils = soil(".soilbox")
    .toArray()
    .map((el) => ({
      title: clean(soil(el).find("h3").text()),
      summary: clean(soil(el).find("p").text()),
      category: clean(soil(el).find(".soil-tag").text()),
      image: soil(el).find("img").attr("src"),
    }));
  const about = cheerio.load(aboutHtml);
  const aboutSections = about("main h2, main h3, main p")
    .toArray()
    .map((el) => ({
      heading: /^h/.test(el.tagName),
      text: clean(about(el).text()),
    }))
    .filter((item) => item.text);
  const noticeContext = { window: {} };
  vm.runInNewContext(noticeJs, noticeContext, { timeout: 100 });
  const districtImages = literal(
    districtJs,
    "const districtCropImages =",
    "\n};",
  );
  const growing = literal(cropJs, "const CROPS =", "\n};");
  const additional = literal(cropJs, "const ADDITIONAL_CROP_CARDS =", "\n};");
  const areas = literal(cropJs, "const CHHATTISGARH_CROP_AREAS =", "\n};");
  const varieties = literal(cropDetailJs, "const cropVarieties =", "\n};");
  const fields = [
    ["seed", "Seed"],
    ["irrigation", "Irrigation"],
    ["soil", "Soil type"],
    ["fertilizer", "Fertilizer"],
    ["medicose", "Crop protection"],
    ["sowing", "Sowing"],
    ["harvest", "Harvest"],
  ];
  const plainText = (value) =>
    clean(
      cheerio
        .load(`<div>${Array.isArray(value) ? value.join("\n") : value}</div>`)(
          "div",
        )
        .text(),
    );
  return {
    crops: [...cropsByKey].map(([id, crop]) => ({
      id,
      ...crop,
      details: growing[id]
        ? fields
            .filter(([key]) => growing[id][key])
            .map(([key, title]) => ({
              title,
              text: plainText(growing[id][key]),
            }))
        : [
            {
              title: "Description",
              text: additional[id]?.description || crop.overview,
            },
          ],
      varieties: (varieties[id] || []).map(([name, description, type]) => ({
        name,
        description,
        type,
      })),
      areaHectares: areas[id] || null,
    })),
    schemes,
    soils,
    about: aboutSections,
    centres: literal(dealerJs, "var districtObject =", "\n}"),
    districts: Object.entries(
      literal(districtJs, "const districtInformationDatabase =", "\n};"),
    ).map(([id, value]) => ({
      id,
      ...value,
      districtImage: decodeURIComponent(
        districtImages[id]?.[0] || "/images/rice1.jpg",
      ),
    })),
    locations: Object.values(
      literal(weatherJs, "const locations =", "\n    };"),
    ),
    notices: noticeContext.window.governmentNotices,
    translations: literal(hindiJs, "window.AGRI_HINDI =", "\n};"),
    disclaimer:
      "This is an unofficial student project for educational and demonstration purposes. It is not a Government of Chhattisgarh service.",
  };
}
async function getDistrictMap() {
  const $ = cheerio.load(await read("Chhattisgarh_districts_map.svg"), {
    xmlMode: true,
  });
  const districts = literal(
    await read("js/maya.js"),
    "const districtInformationDatabase =",
    "\n};",
  );
  return {
    viewBox: $("svg").attr("viewBox"),
    paths: $("path")
      .toArray()
      .filter((el) => districts[$(el).attr("id")])
      .map((el) => ({
        id: $(el).attr("id"),
        d: $(el).attr("d"),
        outline: districts[$(el).attr("id")].districtName === "Chhattisgarh",
        transform: [
          ...$(el)
            .parents("g")
            .toArray()
            .reverse()
            .map((parent) => $(parent).attr("transform")),
          $(el).attr("transform"),
        ]
          .filter(Boolean)
          .join(" "),
      })),
  };
}
module.exports = { getContent, getDistrictMap };
