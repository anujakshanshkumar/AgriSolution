// only for purpose section photo slider js
const slides = document.querySelectorAll(".photo-slide");
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


var wel1 = new Audio();
wel1.src = "/audios/home.mp3";

var ab1 = new Audio();
ab1.src = "/audios/about.mp3";

var crop1 = new Audio();
crop1.src = "/audios/crop1.mp3";

const teamTrack = document.querySelector(".team-container");
teamTrack?.addEventListener("click", event => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest(".team-card-read-more");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const card = button.closest(".team-card");
  const expanded = button.getAttribute("aria-expanded") !== "true";
  card?.classList.toggle("is-expanded", expanded);
  button.setAttribute("aria-expanded", String(expanded));
  button.textContent = expanded ? "Read less" : "Read more";
});

const teamCards = teamTrack?.querySelectorAll(".team-card");
const teamPreviousButton = document.querySelector(".team-carousel-previous");
const teamNextButton = document.querySelector(".team-carousel-next");
const teamIndicators = document.querySelectorAll(".team-carousel-indicator");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (teamTrack && teamCards.length > 1 && teamPreviousButton && teamNextButton && teamIndicators.length === teamCards.length) {
  let activeTeamCard = 0;
  let trackPosition = 1;
  let autoplayTimer;
  const autoplayDelay = 3000;
  const manualPauseDelay = 5000;
  const firstCardClone = teamCards[0].cloneNode(true);
  const lastCardClone = teamCards[teamCards.length - 1].cloneNode(true);

  [firstCardClone, lastCardClone].forEach(clone => {
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll(".team-card-read-more").forEach(button => {
      button.disabled = true;
      button.removeAttribute("aria-controls");
    });
    clone.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
  });

  teamTrack.append(firstCardClone);
  teamTrack.prepend(lastCardClone);

  function updateActiveTeamCard(index) {
    activeTeamCard = (index + teamCards.length) % teamCards.length;
    teamCards.forEach((card, cardIndex) => {
      card.setAttribute("aria-hidden", String(cardIndex !== activeTeamCard));
    });
    teamIndicators.forEach((indicator, indicatorIndex) => {
      if (indicatorIndex === activeTeamCard) {
        indicator.setAttribute("aria-current", "true");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });
  }

  function moveToTeamCard(index) {
    const nextIndex = (index + teamCards.length) % teamCards.length;
    trackPosition = nextIndex + 1;
    updateActiveTeamCard(nextIndex);
    teamTrack.style.transform = `translateX(-${trackPosition * 100}%)`;
  }

  function moveToNextTeamCard() {
    if (activeTeamCard === teamCards.length - 1) {
      activeTeamCard = 0;
      trackPosition = teamCards.length + 1;
      updateActiveTeamCard(activeTeamCard);
      teamTrack.style.transform = `translateX(-${trackPosition * 100}%)`;
      return;
    }

    moveToTeamCard(activeTeamCard + 1);
  }

  teamTrack.addEventListener("transitionend", event => {
    if (event.target !== teamTrack || event.propertyName !== "transform") {
      return;
    }

    if (trackPosition === teamCards.length + 1) {
      trackPosition = 1;
    } else if (trackPosition === 0) {
      trackPosition = teamCards.length;
    } else {
      return;
    }

    teamTrack.style.transition = "none";
    teamTrack.style.transform = `translateX(-${trackPosition * 100}%)`;
    teamTrack.offsetHeight;
    teamTrack.style.removeProperty("transition");
  });

  function scheduleTeamAutoplay(delay = autoplayDelay) {
    window.clearTimeout(autoplayTimer);
    if (!reducedMotion.matches) {
      autoplayTimer = window.setTimeout(() => {
        if (!document.hidden) {
          moveToNextTeamCard();
        }
        scheduleTeamAutoplay();
      }, delay);
    }
  }

  teamPreviousButton.addEventListener("click", () => {
    if (activeTeamCard === 0) {
      activeTeamCard = teamCards.length - 1;
      trackPosition = 0;
      updateActiveTeamCard(activeTeamCard);
      teamTrack.style.transform = "translateX(0)";
    } else {
      moveToTeamCard(activeTeamCard - 1);
    }
    scheduleTeamAutoplay(manualPauseDelay);
  });

  teamNextButton.addEventListener("click", () => {
    moveToNextTeamCard();
    scheduleTeamAutoplay(manualPauseDelay);
  });

  teamIndicators.forEach((indicator, indicatorIndex) => {
    indicator.addEventListener("click", () => {
      moveToTeamCard(indicatorIndex);
      scheduleTeamAutoplay(manualPauseDelay);
    });
  });

  teamTrack.style.transform = `translateX(-${trackPosition * 100}%)`;
  updateActiveTeamCard(activeTeamCard);
  scheduleTeamAutoplay();
}