const data = window.CROP_DATA;
const query = new URLSearchParams(window.location.search);
const cropKey = query.get('crop');
const detailContainer = document.getElementById('cropDetail');
const relatedContainer = document.getElementById('relatedCrops');

const cropVarieties = {
  paddy: [
    ['MTU-1010', 'Early-duration variety that matures in about 120–135 days and is suitable for timely harvesting.', 'Early duration'],
    ['IR-36', 'Popular early rice variety with dependable yield under suitable irrigation and monsoon conditions.', 'Early duration'],
    ['Mahamaya', 'A Chhattisgarh variety suited to local growing conditions and commonly used for grain production.', 'Medium duration'],
    ['Swarna', 'Medium-to-long-duration variety with good grain quality and broad cultivation in the region.', 'Medium duration'],
    ['Swarna Sub-1', 'Flood-tolerant rice variety that can recover after temporary submergence.', 'Flood tolerant'],
    ['PR-113', 'High-yielding variety used where the season and water availability support a longer crop duration.', 'Long duration'],
    ['Basmati', 'A fragrant, long-grain rice type grown where climate, soil and market conditions are suitable.', 'Premium grain']
  ],
  maize: [
    ['Hybrid maize', 'High-yielding hybrid type used for food, feed and industrial purposes.', 'Hybrid'],
    ['Composite maize', 'Open-pollinated type suitable for local cultivation and seed saving practices.', 'Open pollinated']
  ],
  wheat: [
    ['HD varieties', 'Recommended wheat varieties with good grain production in suitable Rabi conditions.', 'Improved variety'],
    ['Lok-1', 'A commonly known wheat type suited to timely sowing and moderate irrigation.', 'Improved variety']
  ],
  soyabean: [
    ['JS 335', 'Popular soybean variety with good adaptation and oil-rich grain.', 'Improved variety'],
    ['JS 9560', 'Short-to-medium duration type selected for yield and regional suitability.', 'Improved variety']
  ],
  groundnut: [
    ['JL 24', 'Short-duration groundnut type with good pod development under well-drained soil.', 'Short duration'],
    ['TAG 24', 'High-performing type suitable for timely sowing and proper moisture management.', 'Improved variety']
  ],
  arhar: [
    ['Short-duration arhar', 'Matures earlier and fits well in areas with a shorter Kharif season.', 'Short duration'],
    ['Long-duration arhar', 'Needs a longer growing period and can provide a larger harvest under suitable conditions.', 'Long duration']
  ],
  cotton: [
    ['Bt cotton hybrid', 'Hybrid cotton type selected for boll production and protection against bollworm as advised locally.', 'Hybrid'],
    ['Desi cotton', 'Traditional cotton type known for hardiness and adaptation to local conditions.', 'Traditional type']
  ]
};

const categories = {
  cereals: ['paddy', 'maize', 'kodo', 'bajra', 'jowar', 'ragi', 'wheat', 'barley'],
  pulses: ['arhar', 'urad', 'moong', 'gram_rabi', 'tiwada', 'masoor', 'peas', 'kulthi'],
  oilseeds: ['soyabean', 'groundnut', 'sesamum', 'niger', 'sunflower', 'mustard', 'linseed', 'rapeseed', 'castor'],
  other: ['cotton', 'sugarcane', 'onion', 'potato', 'tomato', 'chilli']
};

const imageByCrop = {
  paddy: '/JAGGU CROP/paddy2.jpg', maize: '/JAGGU CROP/maize.jpg',
  wheat: '/JAGGU CROP/WHEAT1.jpg', soybean: '/JAGGU CROP/soyabin2.jpg',
  soyabean: '/JAGGU CROP/soyabin2.jpg', groundnut: '/JAGGU CROP/ground nut.jpg',
  moong: '/JAGGU CROP/mung.jpg', urad: '/JAGGU CROP/urad.jpg',
  gram_rabi: '/JAGGU CROP/chana.jpg', cotton: '/JAGGU CROP/cotton.webp'
};

function text(value) {
  return Array.isArray(value) ? value.join('<br>') : value || 'Information will be added soon.';
}

function getName(key) {
  return data.CROPS[key]?.name || data.ADDITIONAL_CROP_CARDS[key]?.title || key;
}

function getCategory(key) {
  return Object.entries(categories).find(([, keys]) => keys.includes(key))?.[0] || 'other';
}

function showCropDetails() {
  const info = data.CROPS[cropKey] || data.ADDITIONAL_CROP_CARDS[cropKey];
  if (!info) {
    detailContainer.innerHTML = '<h1>Crop not found</h1><p>Please return to the crop list and select a crop.</p>';
    return;
  }

  document.title = `${getName(cropKey)} Details | Mor Kisani`;
  const details = data.CROPS[cropKey] ? [
    ['Seed', info.seed], ['Irrigation', info.irrigation], ['Soil type', info.soil],
    ['Fertilizer', info.fertilizer], ['Crop protection', info.medicose],
    ['Sowing', info.sowing], ['Harvest', info.harvest]
  ] : [['Description', info.description]];
  detailContainer.innerHTML = `
    <div class="crop-detail-heading">
      <p class="analytics-eyebrow"><i class="fa-solid fa-leaf"></i> CROP INFORMATION</p>
      <h1>${getName(cropKey)}</h1>
      <span class="crop-detail-badge"><i class="fa-solid fa-shield-heart"></i> Farmer-friendly guide</span>
    </div>
    <div class="crop-detail-intro">
      <img src="${imageByCrop[cropKey] || '/JAGGU CROP/field crop.jpg'}" alt="${getName(cropKey)}">
      <div>
        <p class="intro-label">PLAN YOUR CROP WITH CONFIDENCE</p>
        <p>Complete growing information for ${getName(cropKey)} is provided below for farmers. Use these notes as a starting point and follow local agriculture advisories for final decisions.</p>
      </div>
    </div>
    <div class="crop-detail-divider"><span>Growing essentials</span></div>
    <dl class="crop-detail-list">
      ${details.map(([label, value]) => `<div class="detail-item"><dt><i class="fa-solid fa-circle-check"></i> ${label}</dt><dd>${text(value)}</dd></div>`).join('')}
    </dl>`;
}

function showRelatedCrops() {
  const varieties = cropVarieties[cropKey] || [
    ['Recommended local varieties', 'Use certified varieties recommended by the local agriculture department and select seed according to soil, season and water availability.', 'Recommended type']
  ];
  document.getElementById('relatedCropsTitle').textContent = `Types and varieties of ${getName(cropKey)}`;
  relatedContainer.innerHTML = varieties.map(([name, description, type], index) => `
    <article class="crop-card variety-card">
      <img src="${imageByCrop[cropKey] || '/JAGGU CROP/field crop.jpg'}" alt="${name} ${getName(cropKey)}">
      <span class="variety-number">${String(index + 1).padStart(2, '0')}</span>
      <h3>${name}</h3>
      <p><strong>${type}</strong> — ${description}</p>
      <div class="variety-detail">
        <strong>About this type</strong>
        <span>${description}</span>
      </div>
    </article>`).join('');
}

showCropDetails();
if (data && (data.CROPS[cropKey] || data.ADDITIONAL_CROP_CARDS[cropKey])) {
  showRelatedCrops();
}
