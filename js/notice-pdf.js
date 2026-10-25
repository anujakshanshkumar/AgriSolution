const pdfDownloadButtons = document.querySelectorAll('.notice-pdf-download, .home-notice-download');

function toPdfAscii(value) {
    return value
        .replace(/[’‘]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, '-')
        .replace(/•/g, '-')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, '');
}

function escapePdfText(value) {
    return toPdfAscii(value).replace(/([\\()])/g, '\\$1');
}

function wrapPdfText(value, maxLength = 82) {
    const words = toPdfAscii(value).split(/\s+/);
    const lines = [];
    let line = '';

    words.forEach((word) => {
        if (word.length > maxLength) {
            if (line) lines.push(line);
            line = '';
            for (let index = 0; index < word.length; index += maxLength) {
                lines.push(word.slice(index, index + maxLength));
            }
            return;
        }

        const nextLine = line ? `${line} ${word}` : word;
        if (nextLine.length > maxLength) {
            lines.push(line);
            line = word;
        } else {
            line = nextLine;
        }
    });

    if (line) lines.push(line);
    return lines;
}

function createPdfBlob(notice) {
    const lines = [
        ...wrapPdfText('AGRI-SOLUTION | GOVERNMENT-SOURCE INFORMATION'),
        '',
        ...wrapPdfText(notice.title, 70),
        '',
        ...wrapPdfText(`Category: ${notice.category}`),
        ...wrapPdfText(`Source update: ${notice.date}`),
        '',
        ...wrapPdfText(notice.summary),
        '',
        ...wrapPdfText(`Official source: ${notice.sourceName}`),
        ...wrapPdfText(notice.sourceUrl),
        '',
        ...wrapPdfText('This document is an Agri-Solution summary of information shown on the cited government source. It is not an original government-issued notice. Please visit the official source for current details.')
    ];

    const textCommands = ['BT', '/F1 11 Tf', '50 790 Td'];
    let lineCount = 0;
    lines.forEach((line) => {
        if (lineCount > 0) textCommands.push('0 -16 Td');
        if (line) textCommands.push(`(${escapePdfText(line)}) Tj`);
        lineCount += 1;
    });
    textCommands.push('ET');

    const stream = textCommands.join('\n');
    const encoder = new TextEncoder();
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(encoder.encode(pdf).length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
}

function getNoticeDetails(button) {
    const notice = button.closest('.home-notice-row, .notice-card');
    if (!notice) return null;

    const title = notice.dataset.noticeTitle || notice.querySelector('h3')?.textContent.trim();
    const summary = notice.dataset.noticeSummary || notice.querySelector('.notice-card > p')?.textContent.trim();
    const category = notice.querySelector('.home-notice-category, .notice-tag')?.textContent.trim();
    const date = notice.dataset.noticeDate;
    const sourceName = notice.dataset.sourceName;
    const sourceUrl = notice.dataset.sourceUrl;

    if (!title || !summary || !category || !date || !sourceName || !sourceUrl) {
        throw new Error('Unable to download this notice: required source or notice details are missing.');
    }

    return { title, summary, category, date, sourceName, sourceUrl };
}

pdfDownloadButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const notice = getNoticeDetails(button);
        const fileName = toPdfAscii(notice.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        const downloadLink = document.createElement('a');
        const pdfUrl = URL.createObjectURL(createPdfBlob(notice));

        downloadLink.href = pdfUrl;
        downloadLink.download = `${fileName || 'farmer-notice'}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    });
});
