const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})

var moblie1 = new Audio();
moblie1.src = "/audios/moblie1.mp3";

var password1 = new Audio();
password1.src = "/audios/password1.mp3";

var login1 = new Audio();
login1.src = "/audios/login1.mp3";

var succ1 = new Audio();
succ1.src = "/audios/succ1.mp3";

var district3 = new Audio();
district3.src = "/audios/district3.mp3";

var reg1 = new Audio();
reg1.src = "/audios/reg1.mp3";

var new1 = new Audio();
new1.src = "/audios/new1.mp3";
var name1 = new Audio();
name1.src = "/audios/name1.mp3";

function pop(){
    alert("Form submited");
}