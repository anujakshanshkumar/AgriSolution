// # Box Begins

// districtInformationDatabase: This object stores all the information about each district
// Each district has a unique path ID from the SVG map
const districtInformationDatabase = {
  'path3325': {
    districtName: 'Balod',
    populationNumber: 'Paddy, Chickpea (Gram), Soybean, Tiwra (Lathyrus)',
    areaSize: 'Tomato, Brinjal, Papaya',
    capitalCity: 'Balod',
    aboutDistrict: 'A district known for its agricultural base and historical sites like the Tandula Dam. It was carved out of the Durg district in 2012.',
    districtImage: '/images/balod.svg'
  },
  'path2651': {
    districtName: 'Baloda Bazar',
    populationNumber: 'Paddy, Wheat, Gram (Chickpea), Soybean',
    areaSize: 'Guava, Mango, Vegetables (Brinjal, Tomato)',
    capitalCity: 'Baloda Bazar',
    aboutDistrict: 'Known for cement production, this district is an industrial hub that also maintains a strong agricultural presence. It was formed in 2012.',
    districtImage: '/images/BalodaBazar.svg'
  },
  'path2278': {
    districtName: 'Balrampur',
    populationNumber: 'Paddy, Maize, Mustard, Kulthi (Horse Gram)',
    areaSize: 'Vegetables, Jackfruit',
    capitalCity: 'Balrampur',
    aboutDistrict: 'Located in the northern part of the state, this district is rich in forest resources and is home to several tribal communities. It was formed in 2012.',
    districtImage: '/images/Balrampur.svg'
  },
  'path10649': {
    districtName: 'Bastar',
    populationNumber: 'Paddy, Maize (Major hub), Ragi, Kodo-Kutki',
    areaSize: 'Cashew, Coconut, Coffee (experimental), Tuber crops',
    capitalCity: 'Jagdalpur',
    aboutDistrict: 'The cultural heart of South Chhattisgarh (Dandakaranya region), known for its dense forests, tribal culture, and the famous Chitrakoot Waterfall.',
    districtImage: '/images/Bastar.svg'
  },
  'path3323': {
    districtName: 'Bemetara',
    populationNumber: 'Paddy, Soybean, Gram, Wheat',
    areaSize: 'Tomato, Brinjal, Papaya',
    capitalCity: 'Bemetara',
    aboutDistrict: 'A predominantly agricultural district, often referred to as the "Rice Bowl" of the state due to extensive paddy cultivation. It was formed in 2012.',
    districtImage: '/images/Bemetara.svg'
  },
  'path2387': {
    districtName: 'Bijapur',
    populationNumber: 'Paddy, Niger, Kodo-Kutki',
    areaSize: 'Forest Produce, Tubers',
    capitalCity: 'Bijapur',
    aboutDistrict: 'One of the least populous districts in India, it is characterized by dense forests and a significant tribal population. It was carved from Dantewada in 2007.',
    districtImage: '/images/Bijapur.svg'
  },
  'path3192': {
    districtName: 'Bilaspur',
    populationNumber: 'Paddy, Wheat, Tiwra',
    areaSize: 'Mango, Banana, Vegetables',
    capitalCity: 'Bilaspur',
    aboutDistrict: 'The judicial capital of the state and a major commercial and educational center. It is a key junction for the South East Central Railway.',
    districtImage: '/images/Bilaspur.svg'
  },
  'path10170': {
    districtName: 'Dantewada',
    populationNumber: 'Paddy, Kodo-Kutki (Minor Millets), Kulthi',
    areaSize: 'Mango, Cashew, Tamarind',
    capitalCity: 'Dantewada',
    aboutDistrict: 'Known for rich mineral deposits, particularly iron ore, and the historic Dantewada Temple. The region is largely forested and predominantly tribal.',
    districtImage: '/images/Dantewada.svg'
  },
  'path7155': {
    districtName: 'Dhamtari',
    populationNumber: 'Paddy (Intensive), Wheat, Vegetables',
    areaSize: 'Summer Paddy (famous for high yield), Vegetables, Brinjal',
    capitalCity: 'Dhamtari',
    aboutDistrict: 'Known as the source of the Mahanadi river and home to the Ravishankar Sagar Dam (Gangrel Dam), vital for the region\'s irrigation and water supply.',
    districtImage: '/images/Dhamtari.svg'
  },
  'path3282': {
    districtName: 'Durg',
    populationNumber: 'Paddy, Chickpea (Gram), Soybean, Tiwra (Lathyrus)',
    areaSize: 'Tomato, Brinjal, Papaya',
    capitalCity: 'Durg',
    aboutDistrict: 'A major industrial and educational hub in the state, home to the Bhilai Steel Plant, one of India\'s largest steel producers.',
    districtImage: '/images/Durg.svg'
  },
  'path7229': {
    districtName: 'Gariaband',
    populationNumber: 'Paddy, Lathyrus, Lentil, Maize',
    areaSize: 'Chironji (Forest produce), Custard Apple, Brinjal',
    capitalCity: 'Gariaband',
    aboutDistrict: 'Known for diamond and gold deposits, the district has significant forest areas and is home to the Udanti Sitanadi Tiger Reserve. It was formed in 2012.',
    districtImage: '/images/Gariaband.svg'
  },
  'path5352': {
    districtName: 'Gaurela-Pendra-Marwahi',
    populationNumber: 'Paddy, Maize, Minor Millets',
    areaSize: 'Millets are making a strong comeback here; Mango.',
    capitalCity: 'Gaurela',
    aboutDistrict: 'Chhattisgarh\'s 28th district, inaugurated in February 2020. It is a scenic area with significant forest cover, known for its natural beauty and unique Pendra stone.',
    districtImage: '/images/GaurelaPendraMarwahi.svg'
  },
  'path6279': {
    districtName: 'Janjgir-Champa',
    populationNumber: 'Paddy (Highest intensity), Wheat',
    areaSize: 'Lime/Lemon, Vegetables',
    capitalCity: 'Janjgir',
    aboutDistrict: 'Known as the "Land of Power" due to numerous thermal power plants, it is also highly fertile and a leading producer of food grains.',
    districtImage: '/images/JanjgirChampa.svg'
  },
  'path4496': {
    districtName: 'Jashpur',
    populationNumber: 'Paddy, Niger (Ramtil), Blackgram, Maize',
    areaSize: 'Tea, Cashew, Pear, Tomato, Chili',
    capitalCity: 'Jashpur',
    aboutDistrict: 'A hilly and forested district in the north-east, known for tea gardens, rich tribal culture, and significant Christian population.',
    districtImage: '/images/Jashpur.svg'
  },
  'path7760': {
    districtName: 'Kabirdham',
    populationNumber: 'Paddy, Sugarcane, Soybean, Gram',
    areaSize: 'Banana, Papaya',
    capitalCity: 'Kawardha',
    aboutDistrict: 'Home to the famous Bhoramdeo Temple, often called the "Khajuraho of Chhattisgarh". It has a mixed terrain of plains and hills.',
    districtImage: '/images/Kabirdham.svg'
  },
  'path8477': {
    districtName: 'Kanker',
    populationNumber: 'Paddy, Maize, Urad, Small Millets',
    areaSize: 'Custard Apple (Sitaphal), Mango',
    capitalCity: 'Kanker',
    aboutDistrict: 'Located in the Bastar region, the district is known for its dense forests, waterfalls, and the Kanker Palace. It was separated from Bastar in 1998.',
    districtImage: '/images/Kanker.svg'
  },
  'path2563': {
    districtName: 'Khairagarh-Chhuikhadan-Gandai',
    populationNumber: 'Paddy, Soybean, Wheat',
    areaSize: 'it is a major Soybean belt',
    capitalCity: 'Khairagarh',
    aboutDistrict: 'The 31st district of the state, formed in September 2022. It is home to the renowned Indira Kala Sangeet Vishwavidyalaya, a university dedicated to music and fine arts.',
    districtImage: '/images/KhairagarhChhuikhadanGandai.svg'
  },
  'path8739': {
    districtName: 'Kondagaon',
    populationNumber: 'Paddy, Maize (Major hub), Ragi, Kodo-Kutki',
    areaSize: 'Cashew, Coconut, Coffee (experimental), Tuber crops',
    capitalCity: 'Kondagaon',
    aboutDistrict: 'Known as the craft capital of Chhattisgarh, famous for its bell metal and wooden tribal handicrafts. It was carved out of Bastar in 2012.',
    districtImage: '/images/Kondagaon.svg'
  },
  'path10400': {
    districtName: 'Korba',
    populationNumber: 'Paddy, Maize, Arhar',
    areaSize: 'Mango, Jackfruit',
    capitalCity: 'Korba',
    aboutDistrict: 'A major power generation and coal mining center in India, it is often called the "Power Capital of Chhattisgarh". It was created in 1998.',
    districtImage: '/images/Korba.svg'
  },
  'path4651': {
    districtName: 'Koriya',
    populationNumber: 'addy, Maize, Mustard, Urad',
    areaSize: 'Mango, Vegetables',
    capitalCity: 'Baikunthpur',
    aboutDistrict: 'A district known for its coal mines and natural resources. Its area and population were significantly reduced with the creation of the Manendragarh-Chirmiri-Bharatpur district in 2022.',
    districtImage: '/images/Koriya.svg'
  },
  'path2385': {
    districtName: 'Mahasamund',
    populationNumber: 'Paddy, Pulses, Groundnut',
    areaSize: 'Watermelon (Riverbed cultivation), Leafy Vegetables.',
    capitalCity: 'Mahasamund',
    aboutDistrict: 'Known for its historical and archaeological significance, featuring ancient Buddhist sites and a prominent role in the region\'s history.',
    districtImage: '/images/Mahasamund.svg'
  },
  'path4473': {
    districtName: 'Manendragarh-Chirmiri-Bharatpur (MCB)',
    populationNumber: 'addy, Maize, Mustard, Urad',
    areaSize: 'Mango, Vegetables',
    capitalCity: 'Manendragarh',
    aboutDistrict: 'Chhattisgarh\'s 32nd district, formed in September 2022. It is a mineral-rich region with coal deposits.',
    districtImage: '/images/ManendragarhChirmiriBharatpur.svg'
  },
  'path7870': {
    districtName: 'Mohla-Manpur-Ambagarh Chouki',
    populationNumber: 'Paddy, Millets, Niger',
    areaSize: 'organic millets and forest produce',
    capitalCity: 'Mohla',
    aboutDistrict: 'The 29th district of Chhattisgarh, inaugurated in September 2022. It is a predominantly tribal area with dense forests, carved out of the Rajnandgaon district.',
    districtImage: '/images/MohlaManpurAmbagarhChouki.svg'
  },
  'path5815': {
    districtName: 'Mungeli',
    populationNumber: 'Paddy, Wheat, Tiwra',
    areaSize: 'Mango, Banana, Vegetables',
    capitalCity: 'Mungeli',
    aboutDistrict: 'Primarily an agricultural district known for its strong rural economy. It was formed in 2012 from the Bilaspur district.',
    districtImage: '/images/Mungeli.svg'
  },
  'path9215': {
    districtName: 'Narayanpur',
    populationNumber: 'Paddy, Niger, Kodo-Kutki',
    areaSize: 'Forest Produce, Tubers',
    capitalCity: 'Narayanpur',
    aboutDistrict: 'The least populous district in the state. It is largely covered by the Abujhmad region, which is remote and densely forested with a unique tribal culture. It was carved from Bastar in 2007.',
    districtImage: '/images/Narayanpur.svg'
  },
  'path10974': {
    districtName: 'Raigarh',
    populationNumber: 'Paddy, Groundnut, Urad',
    areaSize: 'Watermelon, Tomato, Brinjal',
    capitalCity: 'Raigarh',
    aboutDistrict: 'A major industrial city and cultural center, known as the "Cultural Capital of Chhattisgarh". Its area was reduced with the creation of new districts.',
    districtImage: '/images/Raigarh.svg'
  },
  'path7133': {
    districtName: 'Raipur',
    populationNumber: 'Paddy, Wheat, Gram (Chickpea), Soybean',
    areaSize: 'Guava, Mango, Vegetables (Brinjal, Tomato)',
    capitalCity: 'Raipur',
    aboutDistrict: 'The capital city of Chhattisgarh and a primary administrative, commercial, and political center. It is the most urbanized district in the state.',
    districtImage: '/images/raipur.svg'

  },
  'path7848': {
    districtName: 'Rajnandgaon',
    populationNumber: 'Paddy, Soybean, Gram, Wheat',
    areaSize: 'Mango, Papaya',
    capitalCity: 'Rajnandgaon',
    aboutDistrict: 'Known for its historical significance, particularly in the freedom movement, and its blend of agriculture and small-scale industries. Its area has been significantly reduced after new districts were carved out.',
    districtImage: '/images/Rajnandgaon.svg'
  },
  'path6419': {
    districtName: 'Sakti',
    populationNumber: 'Paddy (Highest intensity), Wheat',
    areaSize: 'Lime/Lemon, Vegetables',
    capitalCity: 'Sakti',
    aboutDistrict: 'The 33rd district of Chhattisgarh, inaugurated in September 2022. It is known as the "Dolomite Hub of India" due to abundant reserves.',
    districtImage: '/images/Sakti.svg'
  },
  'path6946': {
    districtName: 'Sarangarh-Bilaigarh',
    populationNumber: 'Paddy, Groundnut, Urad',
    areaSize: 'Watermelon, Tomato, Brinjal',
    capitalCity: 'Sarangarh',
    aboutDistrict: 'Formed in September 2022 from parts of Raigarh and Baloda Bazar districts. It is a new administrative division aiming for localized governance and development.',
    districtImage: '/images/SarangarhBilaigarh.svg'
  },
  'path8584': {
    districtName: 'Sukma',
    populationNumber: 'Paddy, Kodo-Kutki (Minor Millets), Kulthi',
    areaSize: 'Mango, Cashew, Tamarind',
    capitalCity: 'Sukma',
    aboutDistrict: 'Located in the southernmost part of the state, it has a high concentration of tribal population and dense forests. It was carved out of Dantewada in 2012.',
    districtImage: '/images/Sukma.svg'
  },
  'path4267': {
    districtName: 'Surajpur',
    populationNumber: 'Paddy, Maize, Mustard, Kulthi (Horse Gram)',
    areaSize: 'Vegetables, Jackfruit',
    capitalCity: 'Surajpur',
    aboutDistrict: 'Known for its coal production and natural beauty. It was created in 2012 from the Surguja district and is a key area for thermal power generation.',
    districtImage: '/images/Surajpur.svg'
  },
  'path4890': {
    districtName: 'Surguja',
    populationNumber: 'Paddy, Maize, Groundnut, Wheat',
    areaSize: 'Litchi, Mango, Potato',
    capitalCity: 'Ambikapur',
    aboutDistrict: 'One of the original large districts, it is known for its tribal history and the city of Ambikapur, a major administrative center in North Chhattisgarh.',
    districtImage: '/images/Surguja.svg'
  },
  'path68285': {
    districtName: 'Chhattisgarh',
    populationNumber: 'Rice',
    areaSize: 'Litchi',
    capitalCity: 'Raipur',
    aboutDistrict: 'One of the Forest & Minreal Rich State, it is known for its tribal history and the State Of Ores, a major Coal, Minreal & Tribal Culture center of INDIA.',
    districtImage: '/images/Chhattisgarh.svg'
  }
};

// selectedDistrictPath: This variable keeps track of which district is currently selected
let selectedDistrictPath = null;

// function showDistrictInformation: This function updates the info box with district details
function showDistrictInformation(pathIdOfDistrict) {
  // getDistrictData: Get the information from the database using the path ID
  const districtData = districtInformationDatabase[pathIdOfDistrict] || {
    districtName: pathIdOfDistrict,
    populationNumber: 'N/A',
    areaSize: 'N/A',
    capitalCity: 'N/A',
    aboutDistrict: 'No information available',
    districtImage: 'No image available'
  };
  
  // updateDistrictName: Show the name in the info box
  document.getElementById('districtName').textContent = districtData.districtName;
  
  // updatePopulationField: Show the population number
  document.getElementById('populationText').textContent = districtData.populationNumber;
  
  // updateAreaField: Show the area size
  document.getElementById('areaText').textContent = districtData.areaSize;
  
  // updateCapitalField: Show the capital city
  document.getElementById('capitalText').textContent = districtData.capitalCity;
  
  // updateDescriptionField: Show the description
  document.getElementById('descriptionText').textContent = districtData.aboutDistrict;

  // updateshowimagefield : Shows the image
  document.getElementById('showimage').innerHTML = `
  <img src="${districtData.districtImage}" alt="${districtData.districtName}" style="width:100%; border-radius:8px;" />
`;

}

// function resetDistrictInformation: This resets the info box to show the default message
function resetDistrictInformation() {
  // resetName: Clear the district name
  document.getElementById('districtName').textContent = 'Select a District';
  
  // resetPopulation: Reset to N/A
  document.getElementById('populationText').textContent = 'N/A';
  
  // resetArea: Reset to N/A
  document.getElementById('areaText').textContent = 'N/A';
  
  // resetCapital: Reset to N/A
  document.getElementById('capitalText').textContent = 'N/A';
  
  // resetDescription: Reset to default message
  document.getElementById('descriptionText').textContent = 'Click on any district on the map to see details';

 // Resetimage : Reset to default image 
 document.getElementById('showimage').textContent = 'Click on any district on the map to see Image';

}

// windowLoadEvent: This runs when the page fully loads
window.addEventListener('load', function() {
  // getAllDistrictPaths: Get all the SVG paths that represent districts
  const allDistrictPaths = document.querySelectorAll('svg path');
  
  // loopThroughAllPaths: Go through each path and add click and hover effects
  allDistrictPaths.forEach((singlePath) => {
    // skipBackgroundPath: Skip the background path which is not a district
    if (singlePath.id === 'path3035') return;
    
    // saveOriginalStyle: Save the original color before any changes
    singlePath.dataset.originalStyle = singlePath.getAttribute('style');
    
    // mouseEnterEvent: When mouse enters a district path
    singlePath.addEventListener('mouseenter', function() {
      // checkIfSelected: Only change color if not already selected
      if (selectedDistrictPath !== this) {
        // changeToHoverColor: Change to blue color on hover
        this.style.fill = '#006284';
      }
    });
    
    // mouseLeaveEvent: When mouse leaves a district path
    singlePath.addEventListener('mouseleave', function() {
      // checkIfSelected: Only restore color if not selected
      if (selectedDistrictPath !== this) {
        // restoreOriginalColor: Go back to original color
        this.setAttribute('style', this.dataset.originalStyle);
      }
    });
    
    // clickEvent: When user clicks on a district
    singlePath.addEventListener('click', function(clickEvent) {
      // stopEventBubbling: Prevent the click from bubbling up
      clickEvent.stopPropagation();
      clickEvent.preventDefault();
      
      // deSelectPreviousDistrict: If another district was selected, deselect it
      if (selectedDistrictPath && selectedDistrictPath !== this) {
        // restorePreviousColor: Restore the previous district's color
        selectedDistrictPath.setAttribute('style', selectedDistrictPath.dataset.originalStyle);
      }
      
      // selectCurrentDistrict: Make this district selected
      // changeToGreenYellow: Change to greenyellow color
      this.style.fill = '#ADFF2F';
      this.style.pointerEvents = 'auto';
      
      // markAsSelected: Remember which district is selected
      selectedDistrictPath = this;
      
      // showDistrictDetails: Update the info box with this district's information
      showDistrictInformation(this.id);
    }, true);
  });
  
  // svgBackgroundClickEvent: When user clicks on empty SVG area
  document.querySelector('svg').addEventListener('click', function(clickEvent) {
    // checkIfBackgroundClicked: Check if the SVG background itself was clicked
    if (clickEvent.target === this && selectedDistrictPath) {
      // deselectCurrentDistrict: Deselect the currently selected district
      // restoreToOriginalColor: Put back the original color
      selectedDistrictPath.setAttribute('style', selectedDistrictPath.dataset.originalStyle);
      
      // clearSelectionVariable: Clear the selection
      selectedDistrictPath = null;
      
      // clearInfoBox: Reset the info box to default
      resetDistrictInformation();
    }
  });
});

// # the ends
