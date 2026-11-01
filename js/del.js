// Keep gallery navigation scoped to the gallery, including keyboard controls.
let slides = [];
let currentSlide = 0;
let autoSlideInterval = null;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showSlide(index) {
  if (!slides.length) return;
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlide);
    slide.setAttribute('aria-hidden', String(i !== currentSlide));
  });
}
function stopAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlideInterval = null;
}
function startAutoSlide() {
  stopAutoSlide();
  if (!reduceMotion) autoSlideInterval = setInterval(() => showSlide(currentSlide + 1), 5000);
}
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.querySelector('.slideshow-container');
  if (!gallery) return;
  slides = Array.from(gallery.querySelectorAll('.slide'));
  showSlide(0);
  gallery.querySelector('.next').addEventListener('click', () => showSlide(currentSlide + 1));
  gallery.querySelector('.prev').addEventListener('click', () => showSlide(currentSlide - 1));
  gallery.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(currentSlide + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  gallery.addEventListener('mouseenter', stopAutoSlide);
  gallery.addEventListener('mouseleave', () => {
    if (!gallery.contains(document.activeElement)) startAutoSlide();
  });
  gallery.addEventListener('focusin', stopAutoSlide);
  gallery.addEventListener('focusout', (event) => {
    if (!gallery.contains(event.relatedTarget) && !gallery.matches(':hover')) startAutoSlide();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoSlide();
    else if (!gallery.contains(document.activeElement) && !gallery.matches(':hover')) startAutoSlide();
  });
  startAutoSlide();
});

// navbar responsive



// navbar responsive

var wel1 = new Audio();
wel1.src = "/audios/home.mp3";

var ab1 = new Audio();
ab1.src = "/audios/about.mp3";

var crop1 = new Audio();
crop1.src = "/audios/crop1.mp3";




var districtObject = {
  "1. Balod": {
    "Balod": ["Mukhya Uparjan Kendra", "Atirikt Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Dondi": ["Mukhya Uparjan Kendra", "Atirikt Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Dondilohara": ["Mukhya Uparjan Kendra", "Atirikt Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Gunderdehi": ["Mukhya Uparjan Kendra", "Atirikt Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Gurur": ["Mukhya Uparjan Kendra", "Atirikt Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "2. Balodabazar-Bhatapara": {
    "Baloda Bazar": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Bhatapara": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Kasdol": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Palari": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Simga": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "3. Balrampur-Ramanujganj": {
    "Balrampur": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Kusmi": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Rajpur": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Shankargarh": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Wadrafnagar": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Ramchandrapur": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "4. Bastar": {
    "Bakawand": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Bastanar": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Bastar": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Darbha": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Jagdalpur": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Lohandiguda": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Tokapal": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "5. Bemetara": {
    "Bemetara": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Berla": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Nawagarh": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Saja": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "6. Bijapur": {
    "Bhairamgarh": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Bhopal Patnam": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Bijapur": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "Usoor": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "7. Bilaspur": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "8. Dantewada": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "9. Dhamtari": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "10. Durg": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "11. Gariaband": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "12. Gaurella-Pendra-Marwahi ": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "13. Janjgir-Champa ": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "14.Jashpur": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "15. Kabirdham": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "16. Kanker": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "17. Kondagaon": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "18. Korba": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "19. Koriya": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "20. Mahasamund": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "21. Manendragarh-Chirmiri-Bharatpur": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "22. Mohla-Manpur-Ambagarh Chowki ": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "23. Mungeli": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "24. Narayanpur": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "25. Raigarh": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "26. Raipur": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "27. Rajnandgaon": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "28. Sarangarh-Bilaigarh ": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "29. Sakti": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "30. Sukma": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "31. Surajpur": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  },
  "32. Surguja": {
    "PHP": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"],
    "SQL": ["Mukhya Uparjan Kendra", "Vikaskhand Uparjan Kendra", "Grameen Uparjan Camp"]
  }
}
document.addEventListener('DOMContentLoaded', function() {
  const districtSel = document.getElementById('district');
  const areaSel = document.getElementById('VidhanSabha');
  const centreSel = document.getElementById('mandi');
  const result = document.getElementById('dealer-selection');
  const clearResult = () => { result.hidden = true; result.textContent = ''; };
  for (const district in districtObject) {
    districtSel.add(new Option(district, district));
  }
  districtSel.addEventListener('change', function() {
    areaSel.length = 1;
    centreSel.length = 1;
    areaSel.disabled = !this.value;
    centreSel.disabled = true;
    clearResult();
    for (const area in districtObject[this.value] || {}) {
      areaSel.add(new Option(area, area));
    }
  });
  areaSel.addEventListener('change', function() {
    centreSel.length = 1;
    centreSel.disabled = !this.value;
    clearResult();
    const centres = districtObject[districtSel.value]?.[this.value] || [];
    centres.forEach(centre => centreSel.add(new Option(centre, centre)));
  });
  centreSel.addEventListener('change', clearResult);
  document.getElementById('dealer').addEventListener('submit', function(event) {
    event.preventDefault();
    if (!this.reportValidity()) return;
    result.textContent = `${centreSel.value} ? ${areaSel.value} ? ${districtSel.value.replace(/^\d+\.\s*/, '')}. Confirm the location and availability with your local procurement office before visiting.`;
    result.hidden = false;
  });
});
