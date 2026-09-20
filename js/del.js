
// Robust slideshow implementation
let slides = [];
let currentSlide = 0;
let autoSlideInterval = null;
const AUTO_DELAY = 3000; // ms

function showSlide(index) {
  if (!slides || slides.length === 0) return;
  // wrap index
  currentSlide = (index % slides.length + slides.length) % slides.length;
  slides.forEach((s, i) => {
    if (i === currentSlide) {
      s.classList.add('active');
      // ensure visible even if external CSS hides .slide
      s.style.display = 'block';
      // allow CSS transition to run
      setTimeout(() => { s.style.opacity = '1'; }, 20);
    } else {
      s.classList.remove('active');
      s.style.opacity = '0';
      // hide after transition (safe fallback)
      setTimeout(() => { s.style.display = 'none'; }, 600);
    }
  });
}

function nextSlide() { showSlide(currentSlide + 1); }
function prevSlide() { showSlide(currentSlide - 1); }

function startAutoSlide() {
  stopAutoSlide();
  autoSlideInterval = setInterval(nextSlide, AUTO_DELAY);
}

function stopAutoSlide() {
  if (autoSlideInterval) { clearInterval(autoSlideInterval); autoSlideInterval = null; }
}

document.addEventListener('DOMContentLoaded', function() {
  slides = Array.from(document.querySelectorAll('.slideshow-container .slide'));
  if (!slides || slides.length === 0) {
    // fallback: try any .slide on the page
    slides = Array.from(document.querySelectorAll('.slide'));
  }
  console.log('Slideshow: found', slides.length, 'slides');

  // Ensure slides have a predictable initial inline state (fallback if CSS conflicts)
  slides.forEach(s => {
    s.style.display = 'none';
    s.style.opacity = '0';
    s.classList.remove('active');
  });

  // show first slide
  showSlide(0);
  // buttons
  const nextBtn = document.querySelector('.slideshow-container .next');
  const prevBtn = document.querySelector('.slideshow-container .prev');
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoSlide(); });

  // pause on hover/touch
  const container = document.querySelector('.slideshow-container');
  if (container) {
    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);
    container.addEventListener('touchstart', stopAutoSlide, {passive:true});
    container.addEventListener('touchend', startAutoSlide, {passive:true});
  }

  // keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') { prevSlide(); startAutoSlide(); }
    if (e.key === 'ArrowRight') { nextSlide(); startAutoSlide(); }
  });

  // start autoplay
  startAutoSlide();
});
// navbar responsive



// navbar responsive

var wel1 = new Audio();
wel1.src = "/audios/wel1.mp3";

var ab1 = new Audio();
ab1.src = "/audios/ab1.mp3";

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
  var districtSel = document.getElementById("district");
  var VidhanSabhaSel = document.getElementById("VidhanSabha");
  var mandiSel = document.getElementById("mandi");
  for (var x in districtObject) {
    districtSel.options[districtSel.options.length] = new Option(x, x);
  }
  districtSel.onchange = function() {
    //empty Chapters- and Topics- dropdowns
    mandiSel.length = 1;
    VidhanSabhaSel.length = 1;
    //display correct values
    for (var y in districtObject[this.value]) {
      VidhanSabhaSel.options[VidhanSabhaSel.options.length] = new Option(y, y);
    }
  }
  VidhanSabhaSel.onchange = function() {
    //empty Chapters dropdown
    mandiSel.length = 1;
    //display correct values
    var z = districtObject[districtSel.value][this.value];
    for (var i = 0; i < z.length; i++) {
      mandiSel.options[mandiSel.options.length] = new Option(z[i], z[i]);
    }
  }
});