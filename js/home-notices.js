const homeNoticesList = document.getElementById('home-notices-list');
const homeNoticeCount = document.getElementById('home-notices-count');

function createHomeNotice(notice, index) {
    const row = document.createElement('article');
    row.className = 'home-notice-row';
    row.dataset.noticeTitle = notice.title;
    row.dataset.noticeSummary = notice.summary;
    row.dataset.noticeDate = notice.dateLabel;
    row.dataset.sourceName = notice.sourceName;
    row.dataset.sourceUrl = notice.additionalSourceUrl
        ? `${notice.sourceUrl} | ${notice.additionalSourceUrl}`
        : notice.sourceUrl;

    const date = document.createElement('span');
    date.className = 'home-notice-number';
    date.setAttribute('aria-hidden', 'true');
    const dateValue = document.createElement('strong');
    dateValue.textContent = notice.dateDay || `${index + 1}`.padStart(2, '0');
    const dateLabel = document.createElement('small');
    dateLabel.textContent = notice.dateMonth || notice.dateLabel;
    date.append(dateValue, dateLabel);

    const copy = document.createElement('div');
    copy.className = 'home-notice-copy';
    const category = document.createElement('span');
    category.className = 'home-notice-category';
    category.textContent = `PM-KISAN • ${notice.category}`;
    const title = document.createElement('h3');
    title.textContent = notice.title;
    copy.append(category, title);

    const actions = document.createElement('div');
    actions.className = 'home-notice-actions';

    const sourceLink = document.createElement('a');
    sourceLink.className = 'home-notice-action';
    sourceLink.href = notice.sourceUrl;
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.setAttribute('aria-label', `Open official source for ${notice.title}`);
    const sourceIcon = document.createElement('i');
    sourceIcon.className = 'fa-regular fa-eye';
    const sourceText = document.createElement('span');
    sourceText.textContent = 'Official source';
    sourceLink.append(sourceIcon, sourceText);

    const pdfButton = document.createElement('button');
    pdfButton.className = 'home-notice-action home-notice-download';
    pdfButton.type = 'button';
    pdfButton.setAttribute('aria-label', `Download PDF summary: ${notice.title}`);
    const pdfIcon = document.createElement('i');
    pdfIcon.className = 'fa-regular fa-file-pdf';
    const pdfText = document.createElement('span');
    pdfText.textContent = 'PDF';
    pdfButton.append(pdfIcon, pdfText);

    actions.append(sourceLink, pdfButton);
    row.append(date, copy, actions);
    return row;
}

if (homeNoticesList && homeNoticeCount) {
    if (!Array.isArray(window.governmentNotices)) {
        throw new Error('Government notices are unavailable; verify js/government-notices.js is loaded before js/home-notices.js.');
    }

    homeNoticesList.replaceChildren(
        ...window.governmentNotices.map(createHomeNotice)
    );
    homeNoticeCount.textContent = `${window.governmentNotices.length} government-source updates`;

    const noticeStatistic = document.getElementById('government-notice-statistic');
    if (noticeStatistic) noticeStatistic.textContent = String(window.governmentNotices.length);
}
