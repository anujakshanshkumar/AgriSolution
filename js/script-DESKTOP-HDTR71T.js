// only for purpose section photo slider js
const slides = document.querySelectorAll(".photo-slide");
let index = 0;

const voiceFiles = {
  ab1: "about.mp3",
  agri1: "agri1.mp3",
  crop1: "crop1.mp3",
  dealer: "dealer.mp3",
  district3: "district3.mp3",
  name1: "name1.mp3",
  new1: "registration.mp3",
  password1: "password1.mp3",
  reg1: "reg-success.mp3",
  wel1: "home.mp3"
};

const voicePlayers = new Map(
  Object.entries(voiceFiles).map(([name, file]) => [
    name,
    new Audio(`/audios/${file}`)
  ])
);

function playVoice(name) {
  const player = voicePlayers.get(name);
  if (!player) {
    return;
  }

  voicePlayers.forEach((audio) => {
    if (audio !== player) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  player.currentTime = 0;
  const playback = player.play();
  if (playback) {
    playback.catch(() => {
      // Browsers can block playback until the first user interaction.
    });
  }
}

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



/* Replace the existing farm-photo carousel code at the top of js/script.js */
(() => {
    function initFarmGuideCarousel() {
        const carousel = document.querySelector(".farm-guide-visual");
        if (!carousel) return;

        const slides = Array.from(carousel.querySelectorAll(".photo-slide"));
        const previousButton = carousel.querySelector(".slide-btn.prev");
        const nextButton = carousel.querySelector(".slide-btn.next");

        if (slides.length === 0) return;

        let currentIndex = Math.max(
            0,
            slides.findIndex(slide => slide.classList.contains("active"))
        );
        let timerId = null;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        function showSlide(nextIndex) {
            currentIndex = (nextIndex + slides.length) % slides.length;

            slides.forEach((slide, index) => {
                const isActive = index === currentIndex;
                slide.classList.toggle("active", isActive);
                slide.setAttribute("aria-hidden", String(!isActive));
            });
        }

        function stopAutoplay() {
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }
        }

        function startAutoplay() {
            if (
                slides.length < 2 ||
                reducedMotion.matches ||
                document.hidden ||
                timerId !== null
            ) {
                return;
            }

            timerId = window.setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000);
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        previousButton?.addEventListener("click", () => {
            showSlide(currentIndex - 1);
            restartAutoplay();
        });

        nextButton?.addEventListener("click", () => {
            showSlide(currentIndex + 1);
            restartAutoplay();
        });

        carousel.addEventListener("mouseenter", stopAutoplay);
        carousel.addEventListener("mouseleave", startAutoplay);
        carousel.addEventListener("focusin", stopAutoplay);

        carousel.addEventListener("focusout", event => {
            if (!carousel.contains(event.relatedTarget)) {
                startAutoplay();
            }
        });

        carousel.addEventListener("keydown", event => {
            if (event.key === "ArrowLeft") {
                showSlide(currentIndex - 1);
                restartAutoplay();
            } else if (event.key === "ArrowRight") {
                showSlide(currentIndex + 1);
                restartAutoplay();
            }
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        reducedMotion.addEventListener?.("change", () => {
            if (reducedMotion.matches) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        showSlide(currentIndex);
        startAutoplay();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initFarmGuideCarousel, { once: true });
    } else {
        initFarmGuideCarousel();
    }
})();
//for gallery section

document.addEventListener('DOMContentLoaded', () => {
    const galleryCards = document.querySelectorAll('.gallery');
    if (galleryCards.length === 0) {
        console.warn("No elements with the class '.gallery' were found.");
        return;
    }
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };
    const observerOptions = {
        threshold: 0.1
    };
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    galleryCards.forEach(card => {
        observer.observe(card);
    });
});




// i don't know 

document.addEventListener("DOMContentLoaded", () => {
    const revealItems = document.querySelectorAll(
        ".service-card, .home-weather-card, .farm-guide-step"
    );

    if (!revealItems.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
    }

    document.documentElement.classList.add("home-js-reveal");

    if (!("IntersectionObserver" in window)) {
        revealItems.forEach(item => item.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item, index) => {
        item.classList.add("home-reveal");
        item.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
        observer.observe(item);
    });
});
