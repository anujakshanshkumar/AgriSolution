const LANGUAGE_STORAGE_KEY = 'agriLanguage';

const textTranslations = {
    'Agri-Solution': { en: 'Agri-Solution', hi: 'अग्री-सोल्यूशन' },
    'One-Stop Solution': { en: 'One-Stop Solution', hi: 'वन-स्टॉप सॉल्यूशन' },
    'Home': { en: 'Home', hi: 'होम' },
    'About': { en: 'About', hi: 'परिचय' },
    'About us': { en: 'About us', hi: 'हमारे बारे में' },
    'Agriculture Services': { en: 'Agriculture Services', hi: 'कृषि सेवाएँ' },
    'Crop Information': { en: 'Crop Information', hi: 'फसल की जानकारी' },
    'Schemes & Subsidies': { en: 'Schemes & Subsidies', hi: 'योजनाएँ और सब्सिडी' },
    'Dealers': { en: 'Dealers', hi: 'डीलर' },
    'Farmer Registration': { en: 'Farmer Registration', hi: 'किसान पंजीकरण' },
    'Resources': { en: 'Resources', hi: 'संसाधन' },
    'Weather & Soil': { en: 'Weather & Soil', hi: 'मौसम और मृदा' },
    'District Map': { en: 'District Map', hi: 'जिला नक्शा' },
    'Contact': { en: 'Contact', hi: 'संपर्क' },
    'Login': { en: 'Login', hi: 'लॉग इन' },
    'Logout': { en: 'Logout', hi: 'लॉग आउट' },
    'Register': { en: 'Register', hi: 'रजिस्टर करें' },
    'Registration': { en: 'Registration', hi: 'पंजीकरण' },
    'Dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
    'Profile': { en: 'Profile', hi: 'प्रोफाइल' },
    'Change Password': { en: 'Change Password', hi: 'पासवर्ड बदलें' },
    'View Schemes': { en: 'View Schemes', hi: 'योजनाएँ देखें' },
    'Farmer Representative': { en: 'Farmer Representative', hi: 'किसान प्रतिनिधि' },
    'Legendary Agriculture Scientist (1925-2023)': { en: 'Legendary Agriculture Scientist (1925-2023)', hi: 'प्रसिद्ध कृषि वैज्ञानिक (1925-2023)' },
    'Chhattisgarh Farmer Representative': { en: 'Chhattisgarh Farmer Representative', hi: 'छत्तीसगढ़ किसान प्रतिनिधि' },
    'Our Purpose': { en: 'Our Purpose', hi: 'हमारा उद्देश्य' },
    'Building a more prosperous Agriculture Future': { en: 'Building a more prosperous Agriculture Future', hi: 'एक समृद्ध कृषि भविष्य का निर्माण' },
    'Read More': { en: 'Read More', hi: 'और पढ़ें' },
    'Essential Services and Information': { en: 'Essential Services and Information', hi: 'आवश्यक सेवाएँ और जानकारी' },
    'Farmer Registration': { en: 'Farmer Registration', hi: 'किसान पंजीकरण' },
    'Complete your registration to get access to all Services': { en: 'Finish your registration to get access to all Services', hi: 'सभी सेवाओं तक पहुँच प्राप्त करने के लिए अपनी पंजीकरण पूरी करें' },
    'Simple steps and guidance to improve your early output': { en: 'Simple steps and guidance to improve your early output', hi: 'आपके प्रारंभिक उत्पादन को बेहतर बनाने के लिए सरल कदम और मार्गदर्शन' },
    'Market Prices': { en: 'Market Prices', hi: 'बाजार कीमतें' },
    'See today\'s rates and find the best time to sell your crops': { en: 'See today\'s rates and find the best time to sell your crops', hi: 'आज की दरें देखें और अपनी फसल बेचने का सबसे सही समय जानें' },
    'Schemes and Subsidies': { en: 'Schemes and Subsidies', hi: 'योजनाएँ और सब्सिडी' },
    'Check what government programs and aid you can get': { en: 'Check what government programs and aid you can get', hi: 'देखें कि आपको कौन-सी सरकारी योजनाएँ और सहायता मिल सकती है' },
    'Weather & Soil': { en: 'Weather & Soil', hi: 'मौसम और मृदा' },
    'Current data to help you decide when to plant and harvest': { en: 'Current data to help you decide when to plant and harvest', hi: 'आज का डेटा आपको बोने और कटाई का सही समय चुनने में मदद करता है' },
    'District Map': { en: 'District Map', hi: 'जिला नक्शा' },
    'See where to find all the agricultural services in your district': { en: 'See where to find all the agricultural services in your district', hi: 'देखें कि आपके जिले में कृषि सेवाएँ कहाँ उपलब्ध हैं' },
    'From Seed to Harvest': { en: 'From Seed to Harvest', hi: 'बीज से कटाई तक' },
    'Beauty of Agriculture': { en: 'Beauty of Agriculture', hi: 'कृषि की सुंदरता' },
    'Quick Links': { en: 'Quick Links', hi: 'त्वरित लिंक' },
    'Student Project': { en: 'Student Project', hi: 'स्टूडेंट प्रोजेक्ट' },
    'Farmer Helpline': { en: 'Farmer Helpline', hi: 'किसान हेल्पलाइन' },
    'Available 24/7': { en: 'Available 24/7', hi: '24/7 उपलब्ध' },
    'Search Here..': { en: 'Search Here..', hi: 'यहाँ खोजें..' },
    'Mobile Number': { en: 'Mobile Number', hi: 'मोबाइल नंबर' },
    'Password': { en: 'Password', hi: 'पासवर्ड' },
    'Full Name': { en: 'Full Name', hi: 'पूरा नाम' },
    'Choose a District--': { en: 'Choose a District--', hi: 'जिला चुनें--' },
    'or login with social platforms': { en: 'or login with social platforms', hi: 'या सोशल प्लेटफ़ॉर्म से लॉग इन करें' },
    'or register with social platforms': { en: 'or register with social platforms', hi: 'या सोशल प्लेटफ़ॉर्म से पंजीकरण करें' },
    'Hello, Welcome!': { en: 'Hello, Welcome!', hi: 'नमस्कार, स्वागत है!' },
    'Welcome Back!': { en: 'Welcome Back!', hi: 'दोबारा स्वागत है!' },
    'Don\'t have an account?': { en: 'Don\'t have an account?', hi: 'क्या आपका अकाउंट नहीं है?' },
    'Already have an account?': { en: 'Already have an account?', hi: 'पहले से अकाउंट है?' },
    'This is an unofficial website created for educational and demonstration purposes only.': { en: 'This is an unofficial website created for educational and demonstration purposes only.', hi: 'यह वेबसाइट केवल शैक्षिक और प्रदर्शन उद्देश्य के लिए बनाई गई है।' },
    'It is not official website of the Government of Chhattisgarh or the Department of Agriculture.': { en: 'It is not official website of the Government of Chhattisgarh or the Department of Agriculture.', hi: 'यह छत्तीसगढ़ सरकार या कृषि विभाग की आधिकारिक वेबसाइट नहीं है।' },
    'All rights reserved': { en: 'All rights reserved', hi: 'सभी अधिकार सुरक्षित' },
    'About the Department': { en: 'About the Department', hi: 'विभाग के बारे में' },
    'Mission | Vission | Objective': { en: 'Mission | Vission | Objective', hi: 'लक्ष्य | दृष्टि | उद्देश्य' },
    'Mission': { en: 'Mission', hi: 'मिशन' },
    'Vission': { en: 'Vission', hi: 'दृष्टि' },
    'Objectives': { en: 'Objectives', hi: 'उद्देश्य' },
    'By Season': { en: 'By Season', hi: 'मौसम के अनुसार' },
    'Kharif': { en: 'Kharif', hi: 'खरीफ' },
    'Karif': { en: 'Karif', hi: 'खरीफ' },
    'Rabi': { en: 'Rabi', hi: 'रबी' },
    'Major Crops Of Chhattisgarh': { en: 'Major Crops Of Chhattisgarh', hi: 'छत्तीसगढ़ की प्रमुख फसलें' },
    'Cereals/Grains': { en: 'Cereals/Grains', hi: 'अनाज' },
    'Careals/Grains': { en: 'Careals/Grains', hi: 'अनाज' },
    'Pulses': { en: 'Pulses', hi: 'दलहन' },
    'Oilseeds': { en: 'Oilseeds', hi: 'तिलहन' },
    'Other Crop': { en: 'Other Crop', hi: 'अन्य फसल' },
    'Other Crops': { en: 'Other Crops', hi: 'अन्य फसलें' },
    'View Details': { en: 'View Details', hi: 'विवरण देखें' },
    'Select any crop to view details': { en: 'Select any crop to view details', hi: 'विवरण देखने के लिए कोई फसल चुनें' },
    'Click a crop on the left to see seed, irrigation, soil type, fertilizer, medicose, sowing & harvest details.': {
        en: 'Click a crop on the left to see seed, irrigation, soil type, fertilizer, medicose, sowing & harvest details.',
        hi: 'बीज, सिंचाई, मिट्टी, उर्वरक, दवा, बुवाई और कटाई का विवरण देखने के लिए बाईं ओर कोई फसल चुनें।'
    },
    'Seed': { en: 'Seed', hi: 'बीज' },
    'Irrigation': { en: 'Irrigation', hi: 'सिंचाई' },
    'Soil Type': { en: 'Soil Type', hi: 'मिट्टी का प्रकार' },
    'Fertilizer': { en: 'Fertilizer', hi: 'उर्वरक' },
    'Medicose': { en: 'Medicose', hi: 'दवा' },
    'Sowing': { en: 'Sowing', hi: 'बुवाई' },
    'Harvest': { en: 'Harvest', hi: 'कटाई' },
    'Select a crop to view its detailed information.': { en: 'Select a crop to view its detailed information.', hi: 'फसल की विस्तृत जानकारी देखने के लिए फसल चुनें।' },
    'Details not available yet.': { en: 'Details not available yet.', hi: 'विवरण अभी उपलब्ध नहीं है।' },
    'CROP PROFILE': { en: 'CROP PROFILE', hi: 'फसल प्रोफ़ाइल' },
    'Paddy (Rice)': { en: 'Paddy (Rice)', hi: 'धान (चावल)' },
    'Maize': { en: 'Maize', hi: 'मक्का' },
    'Soyabean': { en: 'Soyabean', hi: 'सोयाबीन' },
    'Groundnut': { en: 'Groundnut', hi: 'मूंगफली' },
    'Cotton': { en: 'Cotton', hi: 'कपास' },
    'Wheat': { en: 'Wheat', hi: 'गेहूं' },
    'Mustard': { en: 'Mustard', hi: 'सरसों' },
    'Linseed': { en: 'Linseed', hi: 'अलसी' },
    'Peas': { en: 'Peas', hi: 'मटर' },
    'Masoor (Lentil)': { en: 'Masoor (Lentil)', hi: 'मसूर (दाल)' },
    'Barley': { en: 'Barley', hi: 'जौ' },
    'Onion': { en: 'Onion', hi: 'प्याज' },
    'English': { en: 'English', hi: 'अंग्रेज़ी' },
    'हिंदी': { en: 'हिंदी', hi: 'हिंदी' }
};

function translateTextValue(value, lang) {
    if (!value || !value.trim()) return value;

    const trimmed = value.trim();
    const entries = Object.entries(textTranslations)
        .sort(([first], [second]) => second.length - first.length);

    for (const [source, translations] of entries) {
        if (trimmed === source || trimmed === translations.en || trimmed === translations.hi) {
            return value.replace(trimmed, translations[lang] || source);
        }
    }

    let translated = value;
    for (const [source, translations] of entries) {
        const candidates = [source, translations.en, translations.hi]
            .filter((candidate, index, all) => candidate && all.indexOf(candidate) === index)
            .sort((first, second) => second.length - first.length);
        for (const candidate of candidates) {
            if (translated.includes(candidate)) {
                translated = translated.split(candidate).join(translations[lang] || source);
                break;
            }
        }
    }

    return translated;
}

function updateLanguageButton(lang) {
    const button = document.querySelector('.langbtn');
    if (!button) return;

    const label = lang === 'hi' ? 'हिंदी' : 'English';
    button.innerHTML = `${label} <i class="fa-solid fa-caret-down"></i>`;
}

function applyLanguage(lang = 'en') {
    const selectedLanguage = lang === 'hi' ? 'hi' : 'en';

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let textNode;
    while ((textNode = walker.nextNode())) {
        if (!textNode.parentElement.closest('script, style')) {
            textNodes.push(textNode);
        }
    }

    textNodes.forEach((node) => {
        const currentText = node.nodeValue || '';
        const trimmedText = currentText.trim();
        if (!trimmedText) return;

        const translatedText = translateTextValue(trimmedText, selectedLanguage);
        if (translatedText !== trimmedText) {
            node.nodeValue = currentText.replace(trimmedText, translatedText);
        }
    });

    document.querySelectorAll('[aria-label]').forEach((element) => {
        const ariaLabel = element.getAttribute('aria-label');
        const translatedAriaLabel = translateTextValue(ariaLabel, selectedLanguage);
        if (translatedAriaLabel !== ariaLabel) {
            element.setAttribute('aria-label', translatedAriaLabel);
        }
    });

    document.querySelectorAll('input, textarea, select').forEach((element) => {
        const placeholder = element.getAttribute('placeholder');
        if (!placeholder) return;

        const translatedPlaceholder = translateTextValue(placeholder, selectedLanguage);
        if (translatedPlaceholder && translatedPlaceholder !== placeholder) {
            element.setAttribute('placeholder', translatedPlaceholder);
        }
    });

    document.documentElement.lang = selectedLanguage;
    updateLanguageButton(selectedLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    window.currentLanguage = selectedLanguage;
}

window.setEnglish = () => applyLanguage('en');
window.setHindi = () => applyLanguage('hi');
window.applyLanguage = applyLanguage;

const agriVoiceFiles = {
    ab1: 'ab1.mp3',
    agri1: 'agri1.mp3',
    crop1: 'crop1.mp3',
    dealer: 'dealer.mpeg',
    district3: 'district3.mp3',
    name1: 'name1.mp3',
    new1: 'new1.mp3',
    password1: 'password1.mp3',
    pas1: 'reg1.mp3',
    pasrd1: 'wel1.mp3',
    pass: 'crop1.mp3',
    pass1: 'name1.mp3',
    passd1: 'district3.mp3',
    passrd1: 'wel1.mp3',
    password: 'password1.mp3',
    passw1: 'new1.mp3',
    reg1: 'reg1.mp3',
    wel1: 'wel1.mp3'
};

const agriVoicePlayers = new Map(
    Object.entries(agriVoiceFiles).map(([name, file]) => [name, new Audio(`/audios/${file}`)])
);

window.playAgriVoice = (name) => {
    const player = agriVoicePlayers.get(name);
    if (!player) return;

    agriVoicePlayers.forEach((audio) => {
        if (audio !== player) {
            audio.pause();
            audio.currentTime = 0;
        }
    });

    player.currentTime = 0;
    player.play().catch(() => {});
};

Object.entries(agriVoiceFiles).forEach(([name]) => {
    if (!window[name]) window[name] = agriVoicePlayers.get(name);
});

function installAgriVoiceHandlers() {
    document.querySelectorAll('#NavLink a, .cta-btn1, .cta-btn2, #search-tog, [data-voice]').forEach((element) => {
        if (element.getAttribute('onmouseover') || element.getAttribute('onmousedown') || element.dataset.voice) return;

        const href = element.getAttribute('href') || '';
        const text = element.textContent.trim();
        const voice = text === 'Agriculture Services' || text === 'कृषि सेवाएँ' ? 'agri1'
            : href.endsWith('about.html') ? 'ab1'
            : href.endsWith('crop.html') ? 'crop1'
                : href.endsWith('schemes.html') ? 'reg1'
                    : href.endsWith('del.html') ? 'dealer'
                        : href.endsWith('login.html') ? 'password1'
                            : href.endsWith('soil.html') ? 'new1'
                                : href.endsWith('distmap.html') ? 'district3'
                                    : text === 'Contact' || text === 'संपर्क' ? 'name1'
                                        : element.id === 'search-tog' ? 'wel1' : null;

        if (!voice) return;
        element.dataset.voice = voice;
    });

    document.querySelectorAll('[data-voice]').forEach((element) => {
        if (element.dataset.voiceBound === 'true') return;
        const voice = element.dataset.voice;
        if (!agriVoicePlayers.has(voice)) return;
        element.dataset.voiceBound = 'true';
        const eventName = element.matches('a') ? 'pointerenter' : 'pointerdown';
        element.addEventListener(eventName, () => window.playAgriVoice(voice));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.querySelector('.langbtn');
    const langMenu = document.getElementById('langmenu');
    const langOptions = document.querySelectorAll('.lang-opt');

    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const shouldOpen = !langMenu.classList.contains('is-open');
            langMenu.classList.toggle('is-open', shouldOpen);
            langBtn.setAttribute('aria-expanded', String(shouldOpen));
        });

        langOptions.forEach((option) => {
            option.addEventListener('click', () => {
                langMenu.classList.remove('is-open');
                langBtn.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', (event) => {
            if (!event.target.closest('.lang-drop')) {
                langMenu.classList.remove('is-open');
                langBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const loginLink = document.querySelector('#login-link a');
    let user;
    try {
        user = JSON.parse(sessionStorage.getItem('agriUser') || 'null');
    } catch {
        user = null;
    }

    const isLoggedIn = Boolean(user);
    const navigation = document.querySelector('#NavLink');
    const menuToggle = document.querySelector('.menu-tog');

    if (navigation && menuToggle) {
        const menuIcon = menuToggle.querySelector('i');
        menuToggle.setAttribute('aria-label', 'Toggle navigation');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('role', 'button');
        menuToggle.setAttribute('tabindex', '0');

        const setMenuOpen = (isOpen) => {
            navigation.classList.toggle('show', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            if (menuIcon) {
                menuIcon.classList.toggle('fa-bars', !isOpen);
                menuIcon.classList.toggle('fa-xmark', isOpen);
            }
        };

        menuToggle.addEventListener('click', () => {
            setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
        });

        menuToggle.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
            }
        });

        navigation.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.getAttribute('href') !== '#' && window.innerWidth <= 900) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) setMenuOpen(false);
        });
    }

    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
    applyLanguage(savedLanguage);
    installAgriVoiceHandlers();

    if (!isLoggedIn) return;

    if (!document.querySelector('#user-menu-styles')) {
        const styles = document.createElement('style');
        styles.id = 'user-menu-styles';
        styles.textContent = `
            .user-nav-item { position: relative; }
            .user-nav-item > .user-menu {
                background: white;
                border-top: 4px solid rgb(6, 95, 70);
                border-radius: 0 0 6px 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, .18);
                display: none;
                list-style: none;
                margin: 0;
                min-width: 190px;
                padding: 6px 0;
                position: absolute;
                right: 0;
                top: 100%;
                z-index: 3000;
            }
            .user-nav-item.open > .user-menu { display: block; }
            .user-nav-item > .user-menu li a {
                color: rgb(27, 54, 45);
                display: block;
                font-size: .95rem;
                padding: 10px 16px;
                white-space: nowrap;
            }
            .user-nav-item > .user-menu li a:hover {
                background: rgb(239, 248, 239);
                color: rgb(6, 95, 70);
            }
            .user-menu-caret { font-size: .7em; margin-left: 4px; }
            @media (max-width: 768px) {
                .user-nav-item > .user-menu {
                    border-top: 0;
                    border-left: 4px solid rgb(6, 95, 70);
                    border-radius: 0;
                    box-shadow: none;
                    position: static;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    if (isLoggedIn) {
        document.querySelectorAll('a[href="login.html"], a[href="/login.html"]').forEach((link) => {
            if (link.closest('#login-link')) return;
            const item = link.closest('li, .service-card');
            (item || link).remove();
        });
    }

    if (navigation && !document.querySelector('#dashboard-nav-link')) {
        const dashboardItem = document.createElement('li');
        dashboardItem.id = 'dashboard-nav-link';
        dashboardItem.innerHTML = '<a href="/dashboard.html"><i class="fa-solid fa-table-columns"></i> Dashboard</a>';
        navigation.insertBefore(dashboardItem, navigation.children[1] || null);
    }

    if (navigation && !document.querySelector('#user-nav-link')) {
        const userItem = document.createElement('li');
        const userAnchor = document.createElement('a');
        const userIcon = document.createElement('i');
        const userMenu = document.createElement('ul');
        userItem.id = 'user-nav-link';
        userItem.className = 'user-nav-item';
        navigation.style.flex = '1 1 auto';
        userItem.style.marginLeft = 'auto';
        userAnchor.href = '#';
        userAnchor.setAttribute('aria-haspopup', 'true');
        userAnchor.setAttribute('aria-expanded', 'false');
        userIcon.className = 'fa-solid fa-circle-user';
        userAnchor.append(userIcon, ` ${user.name || 'Farmer'} `);
        const caret = document.createElement('i');
        caret.className = 'fa-solid fa-chevron-down user-menu-caret';
        userAnchor.appendChild(caret);

        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <li><a href="/dashboard.html">Profile</a></li>
            <li><a href="/dashboard.html#change-password">Change Password</a></li>
        `;

        userAnchor.addEventListener('click', (event) => {
            event.preventDefault();
            const isOpen = userItem.classList.toggle('open');
            userAnchor.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!userItem.contains(event.target)) {
                userItem.classList.remove('open');
                userAnchor.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                userItem.classList.remove('open');
                userAnchor.setAttribute('aria-expanded', 'false');
            }
        });

        userItem.append(userAnchor, userMenu);
        navigation.appendChild(userItem);
        applyLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
    }

    if (!loginLink) return;

    loginLink.textContent = 'Logout';
    loginLink.href = '#';
    loginLink.addEventListener('click', (event) => {
        event.preventDefault();
        sessionStorage.removeItem('agriUser');
        window.location.href = '/login.html';
    });

    applyLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en');
});