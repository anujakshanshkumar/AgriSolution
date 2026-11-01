
document.addEventListener('DOMContentLoaded', () => {
    const schemeCards = document.querySelectorAll('.schemes-card');
    const schemesContainer = document.querySelector('.schemes-container');
    const searchInputs = [
        document.querySelector('.s-search-input'),
        document.querySelector('#search-input')
    ].filter(Boolean);
    const emptyState = document.querySelector('.scheme-search-empty');
    const searchToggle = document.querySelector('#search-tog');
    const navigationSearch = document.querySelector('#search-input');
    const categoryFilters = document.querySelectorAll('[data-scheme-category]');
    const jurisdictionFilter = document.querySelector('#scheme-jurisdiction');
    const farmerTypeFilter = document.querySelector('#scheme-farmer-type');
    const districtInput = document.querySelector('#scheme-district');
    const communityFilter = document.querySelector('#scheme-community');
    const schemeCount = document.querySelector('.scheme-count');
    const profileNote = document.querySelector('.profile-note');
    const resetFilters = document.querySelector('.filter-reset');
    let selectedCategory = 'all';

    if (schemesContainer) {
        Array.from(schemeCards)
            .sort((first, second) => Number(first.dataset.jurisdiction !== 'central') - Number(second.dataset.jurisdiction !== 'central'))
            .forEach((card) => schemesContainer.appendChild(card));
    }

    const filterSchemes = (source) => {
        if (source) {
            searchInputs.forEach((input) => {
                if (input !== source) input.value = source.value;
            });
        }

        const query = (searchInputs[0]?.value || '').trim().toLocaleLowerCase();
        const jurisdiction = jurisdictionFilter?.value || 'all';
        const farmerType = farmerTypeFilter?.value || 'all';
        let visibleCount = 0;

        schemeCards.forEach((card) => {
            const categories = (card.dataset.categories || '').split(/\s+/);
            const farmerTypes = (card.dataset.farmerTypes || '').split(/\s+/);
            const matches = card.textContent.toLocaleLowerCase().includes(query)
                && (selectedCategory === 'all' || categories.includes(selectedCategory))
                && (jurisdiction === 'all' || card.dataset.jurisdiction === jurisdiction)
                && (farmerType === 'all' || farmerTypes.includes(farmerType));
            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        if (emptyState) emptyState.hidden = visibleCount > 0;
        if (schemeCount) schemeCount.textContent = `${visibleCount} scheme${visibleCount === 1 ? '' : 's'}`;
    };

    const updateProfileNote = () => {
        if (!profileNote) return;
        const district = districtInput?.value.trim();
        const community = { general: 'General', obc: 'OBC', sc: 'SC', st: 'ST' }[communityFilter?.value];
        const context = [];

        if (district) {
            context.push(`For ${district}, check local notifications and district-specific application availability.`);
        }
        if (communityFilter?.value !== 'all') {
            context.push(`${community} category may affect some programme terms; no caste-specific eligibility is assumed by these filters.`);
        }

        profileNote.textContent = [
            ...context,
            'Filters help you explore relevant options; they do not determine eligibility. Confirm current rules, benefit amounts, and application dates with the official department.'
        ].join(' ');
    };

    searchInputs.forEach((input) => {
        input.addEventListener('input', () => filterSchemes(input));
    });

    categoryFilters.forEach((button) => {
        button.addEventListener('click', () => {
            selectedCategory = button.dataset.schemeCategory || 'all';
            categoryFilters.forEach((filter) => {
                const isActive = filter === button;
                filter.classList.toggle('is-active', isActive);
                filter.setAttribute('aria-pressed', String(isActive));
            });
            filterSchemes();
        });
    });

    [jurisdictionFilter, farmerTypeFilter].forEach((filter) => {
        filter?.addEventListener('change', () => filterSchemes());
    });

    districtInput?.addEventListener('input', updateProfileNote);
    communityFilter?.addEventListener('change', updateProfileNote);

    resetFilters?.addEventListener('click', () => {
        selectedCategory = 'all';
        categoryFilters.forEach((button) => {
            const isActive = button.dataset.schemeCategory === 'all';
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });
        if (jurisdictionFilter) jurisdictionFilter.value = 'all';
        if (farmerTypeFilter) farmerTypeFilter.value = 'all';
        if (districtInput) districtInput.value = '';
        if (communityFilter) communityFilter.value = 'all';
        updateProfileNote();
        filterSchemes();
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
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        schemeCards.forEach(card => {
            observer.observe(card);
        });
    } else {
        schemeCards.forEach(card => card.classList.add('is-visible'));
    }
});

var wel1 = new Audio();
wel1.src = "/audios/wel1.mp3";

var ab1 = new Audio();
ab1.src = "/audios/ab1.mp3";

var crop1 = new Audio();
crop1.src = "/audios/crop1.mp3";