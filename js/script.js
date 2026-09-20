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




//for purpose left

document.addEventListener('DOMContentLoaded', () => {
    const purposeCardsCards = document.querySelectorAll('.purpose-left');
    if (purposeCardsCards.length === 0) {
        console.warn("No elements with the class '.purpose-left' were found.");
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
    purposeCardsCards.forEach(card => {
        observer.observe(card);
    });
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
