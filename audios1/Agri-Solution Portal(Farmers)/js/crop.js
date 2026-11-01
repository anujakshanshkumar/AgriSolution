// for hero section sliding

const slides = document.querySelectorAll(".crop-slide");
let index = 0;

function showSlide(i){
  slides.forEach(s=> s.classList.remove("active"));
  slides[i].classList.add("active");
}

document.querySelector(".next").addEventListener("click", ()=>{
  index = (index + 1) % slides.length;
  showSlide(index);
});

document.querySelector(".prev").addEventListener("click", ()=>{
  index = (index - 1 + slides.length) % slides.length;
  showSlide(index);
});

// auto slide
setInterval(()=>{
  index = (index + 1) % slides.length;
  showSlide(index);
}, 3500);



// for crop section

// Kharif / Rabi paragraph section
const kharifPara = document.getElementById('kharif_para');
const rabiPara = document.getElementById('rabi_para');

const kharifSection = document.getElementById('kharifSection');
const rabiSection = document.getElementById('rabiSection');

const detailBox = document.getElementById('detailBox');

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
'Methods: Dry Sowing (Khurra Boni), Wet Sowing (Lai Chopi), Transplanting (Rupa).' ,
] ,

    soil: [
      '<b> Best : </b> Red-Yellow soils with good clay and water-holding capacity (found in Bilaspur, Raipur, Durg areas).',
           '<b> Also Grows In: </b> Alluvial, Black, Laterite soils.',
    ],
    
    
    fertilizer: [
    '<b>  NPK & Urea: </b> Essential for good growth; balanced use is key.' , 
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

  sunflower_rabi: {
    name: 'Sunflower (Rabi areas)',
    seed: 'Hybrid seeds; seed rate ~5–7 kg/ha.',
    irrigation: 'Moderate; critical at flowering.',
    soil: 'Well-drained soils.',
    fertilizer: 'Balanced NPK.',
    medicose: 'Control birds & pests.',
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

// Show season: toggles paragraph + shows only the corresponding cards
function showSeason(season) {
  if (season === 'kharif') {
    kharifPara.style.display = 'block';
    rabiPara.style.display = 'none';
    kharifSection.style.display = 'grid';
    rabiSection.style.display = 'none';
  } else {
    kharifPara.style.display = 'none';
    rabiPara.style.display = 'block';
    kharifSection.style.display = 'none';
    rabiSection.style.display = 'grid';
  }
  // clear detail panel to default
  detailBox.innerHTML = '<h2>Select any crop to view details</h2><p>Click a crop on the left to view seed, irrigation, soil type, fertilizer, medicose, sowing & harvest information.</p>';
}

// attach events to all view buttons (delegation not needed; number small)
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const card = e.target.closest('.crop-card');
    const key = card.dataset.key;
    const info = CROPS[key];

    // if data not found, show fallback
    if (!info) {
      detailBox.innerHTML = "<h2>" + card.querySelector('h3').innerText + "</h2><p>Details not available yet.</p>";
      return;
    }

    detailBox.innerHTML = `
      <h2>${info.name}</h2>
      <div class="detail-row"><label>Seed:</label><div>${info.seed}</div></div>
      <div class="detail-row"><label>Irrigation:</label><div>${info.irrigation}</div></div>
      <div class="detail-row"><label>Soil Type:</label><div>${info.soil}</div></div>
      <div class="detail-row"><label>Fertilizer:</label><div>${info.fertilizer}</div></div>
      <div class="detail-row"><label>Medicose:</label><div>${info.medicose}</div></div>
      <div class="detail-row"><label>Sowing:</label><div>${info.sowing}</div></div>
      <div class="detail-row"><label>Harvest:</label><div>${info.harvest}</div></div>
    `;
  });
});

// Ensure radios call showSeason; also set default on load
document.getElementById('kharif').addEventListener('click', () => showSeason('kharif'));
document.getElementById('rabi').addEventListener('click', () => showSeason('rabi'));

// default load
window.addEventListener('DOMContentLoaded', () => {
  // ensure radio default selection visually
  document.getElementById('kharif').checked = true;
  showSeason('kharif');
});