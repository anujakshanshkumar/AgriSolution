const storedUser = sessionStorage.getItem('agriUser');

if (!storedUser) {
    window.location.replace('/login.html');
} else {
    const user = JSON.parse(storedUser);
    const name = user.name || 'Farmer';

    document.querySelector('#header-name').textContent = name;
    document.querySelector('#welcome-name').textContent = name;
    document.querySelector('#profile-name').textContent = name;
    document.querySelector('#profile-initial').textContent = name.charAt(0).toUpperCase();
    document.querySelector('#profile-mobile').textContent = user.mobile || 'Not available';
    document.querySelector('#profile-district').textContent = user.district || 'Not available';

    document.querySelector('#logout-button').addEventListener('click', () => {
        sessionStorage.removeItem('agriUser');
        window.location.replace('/login.html');
    });
}