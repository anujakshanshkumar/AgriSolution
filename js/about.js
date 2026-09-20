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
wel1.src = "/audios/wel1.mp3";

var ab1 = new Audio();
ab1.src = "/audios/ab1.mp3";

var crop1 = new Audio();
crop1.src = "/audios/crop1.mp3";