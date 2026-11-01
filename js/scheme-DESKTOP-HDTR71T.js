
document.addEventListener('DOMContentLoaded', () => {
    const schemeCards = document.querySelectorAll('.schemes-card');
    const searchInputs = [
        document.querySelector('.s-search-input'),
        document.querySelector('#search-input')
    ].filter(Boolean);
    const emptyState = document.querySelector('.scheme-search-empty');
    const searchToggle = document.querySelector('#search-tog');
    const navigationSearch = document.querySelector('#search-input');

    const filterSchemes = (source) => {
        const query = source.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        searchInputs.forEach((input) => {
            if (input !== source) input.value = source.value;
        });

        schemeCards.forEach((card) => {
            const matches = card.textContent.toLocaleLowerCase().includes(query);
            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        if (emptyState) emptyState.hidden = visibleCount > 0;
    };

    searchInputs.forEach((input) => {
        input.addEventListener('input', () => filterSchemes(input));
    });

    if (searchToggle && navigationSearch) {
        searchToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const isOpening = navigationSearch.classList.contains('hidden');
            navigationSearch.classList.toggle('hidden', !isOpening);
            navigationSearch.classList.toggle('active', isOpening);
            searchToggle.setAttribute('aria-expanded', String(isOpening));

            if (isOpening) {
                navigationSearch.focus();
            } else {
                navigationSearch.value = '';
                filterSchemes(navigationSearch);
            }
        });

        navigationSearch.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') searchToggle.click();
        });
    }

    if (schemeCards.length === 0) {
        console.warn("No elements with the class '.schemes-card' were found.");
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
    schemeCards.forEach(card => {
        observer.observe(card);
    });
});

var wel1 = new Audio();
wel1.src = "/audios/home.mp3";

var ab1 = new Audio();
ab1.src = "/audios/about.mp3";

var crop1 = new Audio();
crop1.src = "/audios/crop1.mp3";