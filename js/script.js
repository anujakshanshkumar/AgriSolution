// only for purpose section photo slider js
const slides = document.querySelectorAll(".photo-slide");
let index = 0;

const voiceFiles = {
  ab1: "ab1.mp3",
  agri1: "agri1.mp3",
  crop1: "crop1.mp3",
  dealer: "dealer.mpeg",
  district3: "district3.mp3",
  name1: "name1.mp3",
  new1: "new1.mp3",
  password1: "password1.mp3",
  reg1: "reg1.mp3",
  wel1: "wel1.mp3"
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

function showSlide(i) {
  slides.forEach(slide => slide.classList.remove("active"));
  slides[i].classList.add("active");
}

const nextSlideButton = document.querySelector(".next");
const previousSlideButton = document.querySelector(".prev");

if (slides.length && nextSlideButton && previousSlideButton) {
  nextSlideButton.addEventListener("click", () => {
    index = (index + 1) % slides.length;
    showSlide(index);
  });

  previousSlideButton.addEventListener("click", () => {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  });

  window.setInterval(() => {
    index = (index + 1) % slides.length;
    showSlide(index);
  }, 3500);
}



/* Replace the existing farm-photo carousel code at the top of js/script.js */
document.querySelectorAll(".farm-gallery").forEach(gallery => {
    const cards = Array.from(gallery.querySelectorAll("[data-gallery-card]"));
    const indexLabel = gallery.querySelector("[data-gallery-index]");
    const title = gallery.querySelector("[data-gallery-title]");
    const description = gallery.querySelector("[data-gallery-description]");
    const link = gallery.querySelector("[data-gallery-link]");
    const linkLabel = gallery.querySelector("[data-gallery-link-label]");
    const progress = gallery.querySelector("[data-gallery-progress]");
    const pauseButton = gallery.querySelector("[data-gallery-pause]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const intervalDuration = 5200;

    if (!cards.length || !indexLabel || !title || !description ||
        !link || !linkLabel || !progress) {
        return;
    }

    const initiallyActive = cards.findIndex(card => card.classList.contains("is-active"));
    let activeIndex = Math.max(0, initiallyActive);
    let intervalId = null;
    let isInView = false;
    let isPointerOver = false;
    let hasKeyboardFocus = false;
    let isKeyboardFocused = false;
    let userPaused = reduceMotion.matches;

    function shouldPause() {
        return userPaused ||
            !isInView ||
            isPointerOver ||
            isKeyboardFocused ||
            document.hidden ||
            reduceMotion.matches;
    }

    function updatePauseButton() {
        if (!pauseButton) return;

        const isPaused = userPaused || reduceMotion.matches;
        const label = `${isPaused ? "Resume" : "Pause"} automatic gallery`;

        pauseButton.setAttribute("aria-label", label);
        pauseButton.title = label;
        pauseButton.innerHTML =
            `<i class="fa-solid ${isPaused ? "fa-play" : "fa-pause"}" aria-hidden="true"></i>`;
        pauseButton.hidden = reduceMotion.matches;
    }

    function updateProgress() {
        progress.classList.remove("is-running");
        void progress.offsetWidth;

        if (!shouldPause()) {
            progress.classList.add("is-running");
        }
    }

    function stopAutoplay() {
        if (intervalId !== null) {
            window.clearInterval(intervalId);
            intervalId = null;
        }

        gallery.classList.add("is-paused");
        progress.classList.remove("is-running");
    }

    function startAutoplay() {
        if (cards.length < 2 || shouldPause() || intervalId !== null) return;

        gallery.classList.remove("is-paused");
        updateProgress();

        intervalId = window.setInterval(() => {
            activateCard((activeIndex + 1) % cards.length);
        }, intervalDuration);
    }

    function syncAutoplay() {
        if (shouldPause()) {
            stopAutoplay();
        } else {
            startAutoplay();
        }

        updatePauseButton();
    }

    function activateCard(nextIndex) {
        activeIndex = (nextIndex + cards.length) % cards.length;
        const activeCard = cards[activeIndex];
        const details = activeCard.dataset;
        const infoPanel = gallery.querySelector(".farm-gallery-info");

        cards.forEach((card, index) => {
            const isActive = index === activeIndex;
            card.classList.toggle("is-active", isActive);
            card.querySelector(".farm-gallery-trigger")
                ?.setAttribute("aria-expanded", String(isActive));
        });

        infoPanel?.classList.add("is-changing");
        indexLabel.textContent =
            `${String(activeIndex + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
        title.textContent = details.title || "";
        description.textContent = details.description || "";
        linkLabel.textContent = details.linkLabel || "Explore";
        link.href = details.href || "#";

        window.setTimeout(() => infoPanel?.classList.remove("is-changing"), 50);
        updateProgress();
    }

    cards.forEach((card, index) => {
        const trigger = card.querySelector(".farm-gallery-trigger");
        if (!trigger) return;

        card.addEventListener("pointerenter", event => {
            if (event.pointerType === "mouse") {
                activateCard(index);
            }
        });

        trigger.addEventListener("focus", () => activateCard(index));
        trigger.addEventListener("click", () => activateCard(index));

        trigger.addEventListener("keydown", event => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

            event.preventDefault();
            const step = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + step + cards.length) % cards.length;
            cards[nextIndex].querySelector(".farm-gallery-trigger")?.focus();
        });
    });

    gallery.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") {
            isPointerOver = true;
            syncAutoplay();
        }
    });

    gallery.addEventListener("pointerleave", event => {
        if (event.pointerType === "mouse") {
            isPointerOver = false;
            syncAutoplay();
        }
    });

    gallery.addEventListener("focusin", () => {
        isKeyboardFocused = hasKeyboardFocus;
        syncAutoplay();
    });

    gallery.addEventListener("focusout", event => {
        if (!gallery.contains(event.relatedTarget)) {
            isKeyboardFocused = false;
            syncAutoplay();
        }
    });

    gallery.addEventListener("keydown", event => {
        if (event.key === "Tab") {
            hasKeyboardFocus = true;
        }
    });

    document.addEventListener("pointerdown", () => {
        hasKeyboardFocus = false;
    });

    pauseButton?.addEventListener("click", () => {
        userPaused = !userPaused;
        syncAutoplay();
    });

    document.addEventListener("visibilitychange", syncAutoplay);

    reduceMotion.addEventListener?.("change", event => {
        userPaused = event.matches;
        syncAutoplay();
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            isInView = entries.some(entry => entry.isIntersecting);
            syncAutoplay();
        }, { threshold: 0.2 });

        observer.observe(gallery);
    } else {
        isInView = true;
        syncAutoplay();
    }

    activateCard(activeIndex);
});
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
