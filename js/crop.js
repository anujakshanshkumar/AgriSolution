// for crop section

// Kharif / Rabi paragraph section
const kharifPara = document.getElementById('kharif_para');
const rabiPara = document.getElementById('rabi_para');

const kharifSection = document.getElementById('kharifSection');
const rabiSection = document.getElementById('rabiSection');

const CROPS = {
  /* KHARIF (15) */
  paddy: {
    name: 'Paddy (Rice-Chawal/Dhan)',

    seed: [
      '<b> Early Duration (120–135 Days): </b> MTU- 1010 , IR- 36, Mahamaya Rajeshwari.',
      '<b> Medium & Long Duration: </b> Swarna , Swarna sub-1 (flood  tolerant), PR-113.',
      'Seed Rate: 20-25 kg/acre (nursery for transplanting).',
      'High quality certified seeds (e.g., MTU series).',],


    irrigation: [
      ' Mostly rain-fed (monsoon).',
      'Light irrigation is good 40-50 days after sowing and during flowering if no rain.',
      'Methods: Dry Sowing (Khurra Boni), Wet Sowing (Lai Chopi), Transplanting (Rupa).',
    ],

    soil: [
      '<b> Best : </b> Red-Yellow soils with good clay and water-holding capacity (found in Bilaspur, Raipur, Durg areas).',
      '<b> Also Grows In: </b> Alluvial, Black, Laterite soils.',
    ],


    fertilizer: [
      '<b>  NPK & Urea: </b> Essential for good growth; balanced use is key.',
      '<b>  Organic </b> Farm Yard Manure (FYM) helps soil health.',
      '<b> Bio-fertilizers: </b>  Promoted for better nutrient use.',
    ],

    medicose: 'Use Tricyclazole for blast; follow local advisories for pests.',

    sowing: 'Transplanting: June–July (direct sowing also in monsoon).',

    harvest: 'September–October-November'
  },

  maize: {
    name: 'Maize',
    seed: 'Certified hybrid seeds (1.5–2 kg/acre for high-yield hybrids vary).',
    irrigation: 'Irrigate at knee-stage and grain-filling; generally 2–4 irrigations.',
    soil: 'Well-drained loamy soil.',
    fertilizer: 'Apply NPK; base application + top dressing of nitrogen.',
    medicose: 'Control stem borer and fall armyworm as per extension advisories.',
    sowing: 'June–July',
    harvest: 'October–November'
  },

  soyabean: {
    name: 'Soyabean',
    seed: 'Certified soybean varieties (seed rate ~80–100 kg/ha).',
    irrigation: 'Rainfed in many areas; one or two irrigations if dry.',
    soil: 'Well-drained fertile loam/clay loam.',
    fertilizer: 'Fertilizer recommendations depend on soil test (usually modest NPK).',
    medicose: 'Watch for pod borer and rust; follow local spray schedule.',
    sowing: 'June–July',
    harvest: 'October–November'
  },

  groundnut: {
    name: 'Groundnut',
    seed: 'Use high-quality bold-seeded varieties; seed rate ~100–125 kg/ha.',
    irrigation: 'Requires timely irrigation; pod-filling stage critical.',
    soil: 'Sandy loam to loam with good drainage.',
    fertilizer: 'Apply rock phosphate and balanced NPK as per soil test.',
    medicose: 'Manage leaf spot and aphids as per advisory.',
    sowing: 'June–July',
    harvest: 'October–November'
  },

  cotton: {
    name: 'Cotton',
    seed: 'Bt / hybrid cotton varieties as per region.',
    irrigation: 'Irrigate during boll development; water stress tolerance varies.',
    soil: 'Deep loamy soils with good drainage.',
    fertilizer: 'Apply N and K based on soil tests; split doses.',
    medicose: 'Control bollworm and jassids; use IPM.',
    sowing: 'June–July',
    harvest: 'Oct–Dec (depends on region)'
  },

  kodo: {
    name: 'Kodo Millet',
    seed: 'Local/ improved varieties; seed rate ~4–8 kg/ha.',
    irrigation: 'Low water requirement; typically rainfed.',
    soil: 'Poor soils tolerant; sandy loam acceptable.',
    fertilizer: 'Minimal fertilization; small dose of N if needed.',
    medicose: 'Generally pest-resistant; monitor aphids.',
    sowing: 'June–July',
    harvest: 'Sept–Oct'
  },

  bajra: {
    name: 'Bajra (Pearl Millet)',
    seed: 'Hybid/local varieties; seed rate ~4–6 kg/ha.',
    irrigation: 'Drought tolerant; needs moisture at flowering.',
    soil: 'Sandy to loamy soils.',
    fertilizer: 'Light N and P; avoid over-fertilizing.',
    medicose: 'Monitor blast and smut; local sprays.',
    sowing: 'June–July',
    harvest: 'Sept–Oct'
  },

  jowar: {
    name: 'Jowar (Sorghum)',
    seed: 'Certified varieties; seed rate ~8–10 kg/ha.',
    irrigation: 'Moderate; tolerant to dry spells.',
    soil: 'Loamy soils preferred.',
    fertilizer: 'Apply NPK per soil test.',
    medicose: 'Control shoot fly and stem borer.',
    sowing: 'June–July',
    harvest: 'Sept–Oct'
  },

  arhar: {
    name: 'Arhar (Pigeon Pea)',
    seed: 'Use good quality seeds; seed rate ~12–15 kg/ha.',
    irrigation: 'Mostly rainfed; light irrigation if dry.',
    soil: 'Well-drained loam.',
    fertilizer: 'Requires little fertilizer; basal P beneficial.',
    medicose: 'Watch for pod borers.',
    sowing: 'June–July',
    harvest: 'Nov–Dec'
  },

  urad: {
    name: 'Urad (Black Gram)',
    seed: 'Certified seeds; seed rate ~20–25 kg/ha.',
    irrigation: 'Mostly rainfed; light irrigation helps.',
    soil: 'Loamy soils preferred.',
    fertilizer: 'Low fertilizer requirement; small N and P.',
    medicose: 'Protect from bacterial blight.',
    sowing: 'June–July',
    harvest: 'Sept–Oct'
  },

  moong: {
    name: 'Moong (Green Gram)',
    seed: 'Good quality short-duration seeds.',
    irrigation: 'Minimal; rainfed or light irrigation.',
    soil: 'Well-drained soils.',
    fertilizer: 'Low requirement; small P may help.',
    medicose: 'Control aphids and stem fly.',
    sowing: 'June–July',
    harvest: 'Sept–Oct'
  },

  sesamum: {
    name: 'Sesamum (Til)',
    seed: 'High-quality seed; seed rate ~4–6 kg/ha.',
    irrigation: 'Low water needs; tolerant to drought.',
    soil: 'Light, well-drained soils.',
    fertilizer: 'Light N and P.',
    medicose: 'Manage wilt with seed treatment.',
    sowing: 'June–July',
    harvest: 'Sept–Oct'
  },

  sugarcane: {
    name: 'Sugarcane',
    seed: 'Setts (seed pieces) from healthy canes.',
    irrigation: 'High water demand; regular irrigation needed.',
    soil: 'Deep loamy soils with good drainage.',
    fertilizer: 'High N and K requirements.',
    medicose: 'Control top-borer and ratoon pests.',
    sowing: 'Planting: Feb–Mar or as per local season',
    harvest: '10–12 months after planting (varies)'
  },

  sunflower: {
    name: 'Sunflower',
    seed: 'Hybrid oilseed varieties (seed rate ~6–8 kg/ha).',
    irrigation: 'Moderate; critical at flowering.',
    soil: 'Well-drained loamy soils.',
    fertilizer: 'Balanced NPK; phosphorus important.',
    medicose: 'Control bird damage and fungal diseases.',
    sowing: 'June–July',
    harvest: 'Oct–Nov'
  },

  castor: {
    name: 'Castor',
    seed: 'Certified castor seeds; seed rate ~6–10 kg/ha.',
    irrigation: 'Low to moderate; drought tolerant.',
    soil: 'Sandy loam to loam soils.',
    fertilizer: 'Apply P and K as needed.',
    medicose: 'Control jassids and pests.',
    sowing: 'June–July',
    harvest: 'Oct–Nov'
  },

  /* RABI (10) */
  wheat: {
    name: 'Wheat',
    seed: 'Use good varieties (e.g., HD series); seed rate ~100–125 kg/ha.',
    irrigation: 'First irrigation 20–25 days after sowing; critical at grain filling.',
    soil: 'Loamy fertile soils.',
    fertilizer: 'Apply NPK; split nitrogen doses.',
    medicose: 'Manage rust and aphids as per advisory.',
    sowing: 'Oct–Nov',
    harvest: 'March–April'
  },

  gram_rabi: {
    name: 'Gram (Chana)',
    seed: 'Certified seed; seed rate ~80–100 kg/ha.',
    irrigation: 'Mostly rainfed; supplement irrigation increases yield.',
    soil: 'Well-drained loam to black soils.',
    fertilizer: 'Basal P and small N if needed.',
    medicose: 'Protect from pod borer.',
    sowing: 'Oct–Nov',
    harvest: 'Feb–Mar'
  },

  mustard: {
    name: 'Mustard',
    seed: 'Certified varieties; seed rate ~5–6 kg/ha.',
    irrigation: 'Requires moisture at sowing; limited irrigations.',
    soil: 'Loam to clay loam soils.',
    fertilizer: 'Apply NPK; sulfur often beneficial.',
    medicose: 'Control aphids and white rust.',
    sowing: 'Oct–Nov',
    harvest: 'Feb–Mar'
  },

  linseed: {
    name: 'Linseed',
    seed: 'Use recommended varieties; seed rate ~20–30 kg/ha.',
    irrigation: 'Low water requirement; one or two irrigations if dry.',
    soil: 'Well-drained soils.',
    fertilizer: 'Light N and P application.',
    medicose: 'Manage rust and wilt as required.',
    sowing: 'Oct–Nov',
    harvest: 'Feb–Mar'
  },

  peas: {
    name: 'Peas',
    seed: 'Certified garden pea seeds for best germination.',
    irrigation: 'Frequent light irrigations in early growth.',
    soil: 'Loamy soils with organic matter.',
    fertilizer: 'Nitrogen fixed by crop; basal P helps.',
    medicose: 'Protect from powdery mildew and aphids.',
    sowing: 'Oct–Nov',
    harvest: 'Jan–Mar'
  },

  masoor: {
    name: 'Masoor (Lentil)',
    seed: 'Quality seeds; seed rate ~40–50 kg/ha.',
    irrigation: 'Mostly rainfed; light irrigation if required.',
    soil: 'Loam to black soils.',
    fertilizer: 'Low fertilizer use; P recommended.',
    medicose: 'Protect from stem nematodes.',
    sowing: 'Oct–Nov',
    harvest: 'Feb–Mar'
  },

  barley: {
    name: 'Barley',
    seed: 'Use recommended barley varieties.',
    irrigation: 'Moderate irrigation at tillering and grain filling.',
    soil: 'Well-drained loamy soils.',
    fertilizer: 'Apply NPK as per test.',
    medicose: 'Control fungal diseases.',
    sowing: 'Oct–Nov',
    harvest: 'Feb–Mar'
  },

  rapeseed: {
    name: 'Rapeseed',
    seed: 'Certified varieties; seed rate ~4–6 kg/ha.',
    irrigation: 'Limited irrigations required.',
    soil: 'Loamy soils preferred.',
    fertilizer: 'NPK with sulfur if available.',
    medicose: 'Control aphids and white rust.',
    sowing: 'Oct–Nov',
    harvest: 'Feb–Mar'
  },

  onion: {
    name: 'Onion',
    seed: 'Use bulb sets or seed as per local practice.',
    irrigation: 'Frequent shallow irrigations required.',
    soil: 'Well-drained loam.',
    fertilizer: 'Higher potassium for bulb formation.',
    medicose: 'Manage thrips and fungal rots.',
    sowing: 'Oct–Nov (sets) depending on crop',
    harvest: 'Feb–Apr (varies)'
  }
};

const allSeasons = document.getElementById('allSeasons');
const kharifRadio = document.getElementById('kharif');
const rabiRadio = document.getElementById('rabi');
const cropDetails = document.getElementById('cropDetails');
const cropDetailsTitle = document.getElementById('cropDetailsTitle');
const cropDetailsContent = document.getElementById('cropDetailsContent');
const closeCropDetails = document.getElementById('closeCropDetails');

const CHHATTISGARH_CROP_AREAS = {
  paddy: [3893000, 215000],
  maize: [224000, 122620],
  kodo: [161000, 0],
  bajra: [2100, 0],
  jowar: [4100, 0],
  ragi: [11000, 0],
  soyabean: [136000, 0],
  groundnut: [45000, 18000],
  sesamum: [15900, 0],
  niger: [65000, 0],
  sunflower: [1200, 6800],
  arhar: [63245, 0],
  urad: [125000, 12000],
  moong: [25000, 8500],
  kulthi: [22000, 0],
  cotton: [12000, 0],
  sugarcane: [35000, 0],
  wheat: [0, 267040],
  barley: [0, 4200],
  gram_rabi: [0, 335025],
  tiwada: [0, 310000],
  masoor: [0, 22000],
  peas: [0, 26000],
  mustard: [0, 105000],
  linseed: [0, 37000],
  rapeseed: [0, 6000],
  castor: [0, 1200],
  onion: [8500, 43500],
  potato: [0, 46000],
  tomato: [18000, 48000],
  chilli: [12000, 24000]
};

const ADDITIONAL_CROP_CARDS = {
  ragi: {
    title: 'Ragi (Finger Millet)',
    image: '/JAGGU CROP/kodo.webp',
    category: 'Cereals/Grains',
    description: 'A traditional small millet grown during the Kharif season. Its grain is used as food and is valued for its nutritional content.'
  },
  niger: {
    title: 'Nigerseed (Ramtil)',
    image: '/JAGGU CROP/safflower2.jpg',
    category: 'Oilseeds',
    description: 'A Kharif oilseed crop grown in parts of Chhattisgarh, particularly in rainfed and tribal farming areas.'
  },
  tiwada: {
    title: 'Tiwada (Lathyrus / Khesari)',
    image: '/JAGGU CROP/masoor.webp',
    category: 'Pulses',
    description: 'A Rabi pulse commonly grown as a relay crop after rice in Chhattisgarh. Follow local food-safety guidance when consuming it.'
  },
  castor: {
    title: 'Castor (Arandi)',
    image: '/JAGGU CROP/field crop.jpg',
    category: 'Oilseeds',
    description: 'A hardy oilseed crop grown for its seeds, which are processed to produce castor oil.'
  },
  potato: {
    title: 'Potato',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables',
    description: 'A cool-season vegetable crop grown in Chhattisgarh during the Rabi season.'
  },
  tomato: {
    title: 'Tomato',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables',
    description: 'A widely cultivated vegetable used fresh and in cooking. It can be grown in more than one season.'
  },
  chilli: {
    title: 'Chilli',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Spices',
    description: 'A spice crop grown in both Kharif and Rabi seasons in Chhattisgarh.'
  }
};

window.CROP_DATA = { CROPS, CHHATTISGARH_CROP_AREAS, ADDITIONAL_CROP_CARDS };

if (kharifSection) {
const numberFormat = new Intl.NumberFormat('en-IN');

function createCropCard(key, info) {
  const card = document.createElement('div');
  card.className = 'crop-card';
  card.dataset.key = key;

  const image = document.createElement('img');
  image.src = info.image;
  image.alt = info.title;

  const title = document.createElement('h3');
  title.textContent = info.title;

  const description = document.createElement('p');
  const category = document.createElement('strong');
  category.textContent = `${info.category} `;
  description.append(category, document.createTextNode(info.description));

  const link = document.createElement('a');
  link.className = 'view-btn';
  link.href = '#';
  link.textContent = 'Read More';
  card.append(image, title, description, link);
  return card;
}

function arrangeCropCardsBySeason() {
  const templates = new Map();
  document.querySelectorAll('.crop-card[data-key]').forEach(card => {
    if (!templates.has(card.dataset.key)) {
      templates.set(card.dataset.key, card);
    }
  });

  const seasonSections = [kharifSection, rabiSection];
  seasonSections.forEach(section => section.replaceChildren());

  Object.entries(CHHATTISGARH_CROP_AREAS).forEach(([key, areas]) => {
    areas.forEach((area, seasonIndex) => {
      if (area === 0) {
        return;
      }
      const template = templates.get(key);
      const cardInfo = ADDITIONAL_CROP_CARDS[key];
      if (!template && !cardInfo) {
        throw new Error(`Missing crop card content for "${key}".`);
      }
      const card = template ? template.cloneNode(true) : createCropCard(key, cardInfo);
      card.dataset.key = key;
      seasonSections[seasonIndex].append(card);
    });
  });

  seasonSections.forEach((section, seasonIndex) => {
    const cards = [...section.querySelectorAll(':scope > .crop-card')];
    cards.sort((first, second) =>
      CHHATTISGARH_CROP_AREAS[second.dataset.key][seasonIndex] -
      CHHATTISGARH_CROP_AREAS[first.dataset.key][seasonIndex]
    );
    cards.forEach(card => section.append(card));
  });
}

function addCropAnalytics(card, seasonIndex) {
  const areas = CHHATTISGARH_CROP_AREAS[card.dataset.key];
  if (!areas || areas[seasonIndex] <= 0) {
    throw new Error(`Missing seasonal area data for "${card.dataset.key}".`);
  }

  const analytics = document.createElement('div');
  analytics.className = 'crop-card-analytics';
  const metric = document.createElement('div');
  metric.className = 'crop-card-metric';
  const label = document.createElement('span');
  label.textContent = `Area under crop — ${seasonIndex === 0 ? 'Kharif' : 'Rabi'}`;
  const value = document.createElement('strong');
  value.textContent = `${numberFormat.format(areas[seasonIndex])} ha`;
  metric.append(label, value);
  analytics.append(metric);
  card.querySelector('.view-btn').before(analytics);
}

function setupCropScrollPanel(section, seasonIndex) {
  section.querySelectorAll(':scope > .crop-card').forEach(card => {
    addCropAnalytics(card, seasonIndex);
    card.querySelector('.view-btn').href = `crop-details.html?crop=${encodeURIComponent(card.dataset.key)}`;
    if ('IntersectionObserver' in window) {
      card.classList.add('reveal-on-scroll');
    }
  });

  if (!('IntersectionObserver' in window)) {
    return;
  }

  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -24px 0px'
  });

  section.querySelectorAll('.crop-card.reveal-on-scroll').forEach(card => cardObserver.observe(card));
}

arrangeCropCardsBySeason();
setupCropScrollPanel(kharifSection, 0);
setupCropScrollPanel(rabiSection, 1);

// Show crops from the selected season.
function showSeason(season) {
  allSeasons.checked = false;
  if (season === 'kharif') {
    kharifRadio.checked = true;
    rabiRadio.checked = false;
    kharifPara.style.display = 'block';
    rabiPara.style.display = 'none';
    kharifSection.style.display = 'grid';
    rabiSection.style.display = 'none';
  } else {
    kharifRadio.checked = false;
    rabiRadio.checked = true;
    kharifPara.style.display = 'none';
    rabiPara.style.display = 'block';
    kharifSection.style.display = 'none';
    rabiSection.style.display = 'grid';
  }
}

function showAllSeasonCrops() {
  kharifRadio.checked = false;
  rabiRadio.checked = false;
  kharifPara.style.display = 'block';
  rabiPara.style.display = 'block';
  kharifSection.style.display = 'grid';
  rabiSection.style.display = 'grid';
}

kharifRadio.addEventListener('change', () => showSeason('kharif'));
rabiRadio.addEventListener('change', () => showSeason('rabi'));
allSeasons.addEventListener('change', () => {
  if (allSeasons.checked) {
    showAllSeasonCrops();
  } else {
    showSeason('kharif');
  }
});

kharifRadio.checked = true;
showSeason('kharif');

var wel1 = new Audio();
wel1.src = "/audios/wel1.mp3";

var ab1 = new Audio();
ab1.src = "/audios/ab1.mp3";

var crop1 = new Audio();
crop1.src = "/audios/crop1.mp3";
}