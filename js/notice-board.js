const filterButtons = document.querySelectorAll('.notice-filter');
const noticeCardsContainer = document.getElementById('notice-cards');
const searchInput = document.getElementById('notice-search-input');
const resultCount = document.getElementById('notice-result-count');
const emptyState = document.getElementById('notice-empty-state');
const resetButton = document.getElementById('notice-reset');
let activeCategory = 'all';

function createNoticeCard(notice, index) {
    const card = document.createElement('article');
    card.className = `notice-card${index === 0 ? ' notice-card-featured' : ''}`;
    card.dataset.category = notice.filter;
    card.dataset.noticeDate = notice.dateLabel;
    card.dataset.sourceName = notice.sourceName;
    card.dataset.sourceUrl = notice.additionalSourceUrl
        ? `${notice.sourceUrl} | ${notice.additionalSourceUrl}`
        : notice.sourceUrl;

    const topLine = document.createElement('div');
    topLine.className = 'notice-card-topline';
    const tag = document.createElement('span');
    tag.className = 'notice-tag';
    const icon = document.createElement('i');
    icon.className = `fa-solid ${notice.icon}`;
    const category = document.createElement('span');
    category.textContent = notice.category;
    tag.append(icon, category);
    topLine.append(tag);

    if (index === 0) {
        const date = document.createElement('span');
        date.className = 'notice-featured';
        date.textContent = notice.dateLabel;
        topLine.append(date);
    }

    const title = document.createElement('h3');
    title.textContent = notice.title;
    const summary = document.createElement('p');
    summary.textContent = notice.summary;

    const actions = document.createElement('div');
    actions.className = 'notice-card-actions';
    const source = document.createElement('a');
    source.className = 'notice-source-link';
    source.href = notice.sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    const sourceIcon = document.createElement('i');
    sourceIcon.className = 'fa-solid fa-arrow-up-right-from-square';
    source.append(sourceIcon, document.createTextNode(' Official source'));

    const pdfButton = document.createElement('button');
    pdfButton.className = 'notice-pdf-download';
    pdfButton.type = 'button';
    const pdfIcon = document.createElement('i');
    pdfIcon.className = 'fa-regular fa-file-pdf';
    pdfButton.append(pdfIcon, document.createTextNode(' Download PDF'));

    actions.append(source, pdfButton);
    card.append(topLine, title, summary, actions);
    return card;
}

function updateNotices() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const noticeCards = Array.from(noticeCardsContainer.querySelectorAll('.notice-card'));
    let visibleCount = 0;

    noticeCards.forEach((card) => {
        const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
        const matchesSearch = card.textContent.toLocaleLowerCase().includes(query);
        const isVisible = matchesCategory && matchesSearch;

        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
    });

    resultCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? 'notice' : 'notices'}`;
    emptyState.hidden = visibleCount > 0;
}

if (!Array.isArray(window.governmentNotices)) {
    throw new Error('Government notices are unavailable; verify js/government-notices.js is loaded before js/notice-board.js.');
}

noticeCardsContainer.replaceChildren(
    ...window.governmentNotices.map(createNoticeCard)
);

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        activeCategory = button.dataset.filter;
        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('is-active', isActive);
            filterButton.setAttribute('aria-pressed', String(isActive));
        });
        updateNotices();
    });
});

searchInput.addEventListener('input', updateNotices);

resetButton.addEventListener('click', () => {
    activeCategory = 'all';
    searchInput.value = '';
    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === 'all';
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
    updateNotices();
    searchInput.focus();
});

updateNotices();
