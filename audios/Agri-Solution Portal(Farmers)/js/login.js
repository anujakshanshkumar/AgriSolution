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

var OTP2 = new Audio();
OTP2.src = "/audios/OTP2.mp3";

var district3 = new Audio();
district3.src = "/audios/district3.mp3";

var reg1 = new Audio();
reg1.src = "/audios/reg1.mp3";

var name1 = new Audio();
name1.src = "/audios/name1.mp3";

function pop(){
    alert("Form submited");
}