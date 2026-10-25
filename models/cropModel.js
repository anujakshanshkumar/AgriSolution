const crops = [
  {
    name: 'Paddy (Rice)',
    image: '/JAGGU CROP/paddy2.jpg',
    category: 'Cereals / Grains',
    season: 'Kharif',
    overview: 'The principal crop of Chhattisgarh, supported by the state’s monsoon climate and water-holding soils.',
    sowing: 'June–July',
    harvest: 'September–November'
  },
  {
    name: 'Maize',
    image: '/JAGGU CROP/maize.jpg',
    category: 'Cereals / Grains',
    season: 'Kharif',
    overview: 'A versatile crop grown for food, animal feed and starch, especially in the tribal regions of the state.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Kodo-Kutki Millet',
    image: '/JAGGU CROP/kodo.webp',
    category: 'Cereals / Grains',
    season: 'Kharif',
    overview: 'Nutritious, drought-resistant millets traditionally grown in rainfed and tribal farming areas.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Bajra (Pearl Millet)',
    image: '/JAGGU CROP/bajra.jpg',
    category: 'Cereals / Grains',
    season: 'Kharif',
    overview: 'A hardy, low-water crop that performs well in hot conditions and lighter soils.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Jowar (Sorghum)',
    image: '/JAGGU CROP/cereals2.webp',
    category: 'Cereals / Grains',
    season: 'Kharif',
    overview: 'A resilient grain crop used for food, fodder and feed in areas with limited irrigation.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Soybean',
    image: '/JAGGU CROP/soyabin2.jpg',
    category: 'Oilseeds',
    season: 'Kharif',
    overview: 'A protein- and oil-rich crop that grows well in moderately rainy, well-drained fields.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Groundnut',
    image: '/JAGGU CROP/ground nut.jpg',
    category: 'Oilseeds',
    season: 'Kharif',
    overview: 'A profitable oilseed suited to Chhattisgarh’s sandy and light soils with good drainage.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Sesamum (Til)',
    image: '/JAGGU CROP/linseed2.jpg',
    category: 'Oilseeds',
    season: 'Kharif',
    overview: 'A short-duration oilseed that needs little water and tolerates dry conditions.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Sunflower',
    image: '/JAGGU CROP/safflower2.jpg',
    category: 'Oilseeds',
    season: 'Kharif',
    overview: 'A quick-growing oilseed with good demand and an important moisture requirement at flowering.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Arhar (Pigeon Pea)',
    image: '/JAGGU CROP/chickpea2.jpg',
    category: 'Pulses',
    season: 'Kharif',
    overview: 'A dependable pulse crop that improves soil health and provides stable dal production.',
    sowing: 'June–July',
    harvest: 'November–December'
  },
  {
    name: 'Urad (Black Gram)',
    image: '/JAGGU CROP/urad.jpg',
    category: 'Pulses',
    season: 'Kharif',
    overview: 'A short-duration pulse suited to loamy soils and mostly rainfed production.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Moong (Green Gram)',
    image: '/JAGGU CROP/moong.jpg',
    category: 'Pulses',
    season: 'Kharif',
    overview: 'A fast-growing pulse with low water needs and useful grain and soil benefits.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Sugarcane',
    image: '/JAGGU CROP/sugarcane.jpg',
    category: 'Other Crops',
    season: 'Kharif',
    overview: 'A long-duration commercial crop requiring fertile soil and regular water management.',
    sowing: 'February–March',
    harvest: '10–12 months after planting'
  },
  {
    name: 'Cotton',
    image: '/JAGGU CROP/cotton.webp',
    category: 'Other Crops',
    season: 'Kharif',
    overview: 'A commercial fibre crop that needs deep, well-drained soil and careful pest monitoring.',
    sowing: 'June–July',
    harvest: 'October–December'
  },
  {
    name: 'Castor',
    image: '/JAGGU CROP/field crop.jpg',
    category: 'Oilseeds',
    season: 'Kharif',
    overview: 'A hardy oilseed crop grown for castor oil and suited to lighter soils.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Wheat',
    image: '/JAGGU CROP/cereals2.webp',
    category: 'Cereals / Grains',
    season: 'Rabi',
    overview: 'An important winter cereal grown after the monsoon with timely irrigation.',
    sowing: 'October–November',
    harvest: 'March–April'
  },
  {
    name: 'Gram (Chana)',
    image: '/JAGGU CROP/chickpea2.jpg',
    category: 'Pulses',
    season: 'Rabi',
    overview: 'A major winter pulse that performs well in well-drained loam and black soils.',
    sowing: 'October–November',
    harvest: 'February–March'
  },
  {
    name: 'Mustard',
    image: '/JAGGU CROP/mustard.jpg',
    category: 'Oilseeds',
    season: 'Rabi',
    overview: 'A winter oilseed requiring good moisture at flowering and pod development.',
    sowing: 'October–November',
    harvest: 'February–March'
  },
  {
    name: 'Linseed',
    image: '/JAGGU CROP/linseed2.jpg',
    category: 'Oilseeds',
    season: 'Rabi',
    overview: 'A cool-season oilseed cultivated for its oil-rich seed and fibre.',
    sowing: 'October–November',
    harvest: 'February–March'
  },
  {
    name: 'Rapeseed',
    image: '/JAGGU CROP/mustard.jpg',
    category: 'Oilseeds',
    season: 'Rabi',
    overview: 'A winter oilseed that benefits from fertile, well-drained soil and cool weather.',
    sowing: 'October–November',
    harvest: 'February–March'
  },
  {
    name: 'Tiwada (Lathyrus)',
    image: '/JAGGU CROP/masoor.webp',
    category: 'Pulses',
    season: 'Rabi',
    overview: 'A relay pulse commonly grown after rice; follow local food-safety guidance.',
    sowing: 'October–November',
    harvest: 'February–March'
  },
  {
    name: 'Masoor (Lentil)',
    image: '/JAGGU CROP/masoor.webp',
    category: 'Pulses',
    season: 'Rabi',
    overview: 'A cool-season pulse that grows well in light to medium, well-drained soils.',
    sowing: 'October–November',
    harvest: 'February–March'
  },
  {
    name: 'Potato',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables',
    season: 'Rabi',
    overview: 'A cool-season vegetable that needs loose soil, good drainage and even moisture.',
    sowing: 'October–November',
    harvest: 'January–February'
  },
  {
    name: 'Tomato',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables',
    season: 'Both',
    overview: 'A widely grown vegetable requiring fertile soil, sunlight and regular crop protection.',
    sowing: 'Varies by season',
    harvest: '60–90 days after transplanting'
  },
  {
    name: 'Chilli',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables / Spices',
    season: 'Both',
    overview: 'A valuable spice and vegetable crop grown in both seasons with suitable irrigation.',
    sowing: 'Varies by season',
    harvest: '75–120 days after transplanting'
  },
  {
    name: 'Ragi (Finger Millet)',
    image: '/JAGGU CROP/kodo.webp',
    category: 'Cereals / Grains',
    season: 'Kharif',
    overview: 'A nutritious, drought-tolerant millet traditionally grown in rainfed farming areas.',
    sowing: 'June–July',
    harvest: 'September–October'
  },
  {
    name: 'Nigerseed (Ramtil)',
    image: '/JAGGU CROP/safflower2.jpg',
    category: 'Oilseeds',
    season: 'Kharif',
    overview: 'A hardy oilseed grown in rainfed and tribal farming areas.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Kulthi (Horse Gram)',
    image: '/JAGGU CROP/masoor.webp',
    category: 'Pulses',
    season: 'Kharif',
    overview: 'A drought-resistant pulse suited to light soils and low-input farming.',
    sowing: 'June–July',
    harvest: 'October–November'
  },
  {
    name: 'Barley',
    image: '/JAGGU CROP/cereals2.webp',
    category: 'Cereals / Grains',
    season: 'Rabi',
    overview: 'A cool-season cereal that grows well in fertile, well-drained soil.',
    sowing: 'October–November',
    harvest: 'March–April'
  },
  {
    name: 'Peas',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables',
    season: 'Rabi',
    overview: 'A cool-season vegetable crop requiring moderate moisture and good drainage.',
    sowing: 'October–November',
    harvest: 'January–March'
  },
  {
    name: 'Onion',
    image: '/JAGGU CROP/vggggg.webp',
    category: 'Vegetables',
    season: 'Both',
    overview: 'An important bulb crop that needs loose soil, sunlight and consistent irrigation.',
    sowing: 'Varies by season',
    harvest: '90–150 days after planting'
  }
];

const cropKeys = [
  'paddy', 'maize', 'kodo', 'bajra', 'jowar', 'soyabean', 'groundnut',
  'sesamum', 'sunflower', 'arhar', 'urad', 'moong', 'sugarcane', 'cotton',
  'castor', 'wheat', 'gram_rabi', 'mustard', 'linseed', 'rapeseed', 'tiwada',
  'masoor', 'potato', 'tomato', 'chilli', 'ragi', 'niger', 'kulthi', 'barley',
  'peas', 'onion'
];

const cropsByKey = new Map(cropKeys.map((key, index) => [key, crops[index]]));

module.exports = { crops, cropsByKey };
