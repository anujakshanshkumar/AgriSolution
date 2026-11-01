// Run with Playwright available: AGRI_TEST_URL=http://127.0.0.1:3000 node scripts/test-hindi.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { cropsByKey } = require('../models/cropModel');
const base = process.env.AGRI_TEST_URL || 'http://127.0.0.1:3000';

async function untranslated(page) {
    return page.evaluate(() => {
        const results = [];
        const check = value => {
            // Contact addresses, source URLs and token identifiers stay verbatim.
            const content = value.replace(/\S+@\S+|(?:https?:\/\/)?[\w.-]+\.(?:in|gov|com)\S*|AG-[\d-]+/g, '');
            if (/[a-zA-Z]{2}/.test(content)) results.push(value.trim());
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (!node.parentElement.closest('script, style, [translate="no"], [data-language-dialog]')) check(node.nodeValue);
        }
        document.querySelectorAll('[placeholder], [title], [alt], [aria-label]').forEach(element => {
            if (element.closest('[translate="no"], [data-language-dialog]')) return;
            for (const attribute of ['placeholder', 'title', 'alt', 'aria-label']) check(element.getAttribute(attribute) || '');
        });
        return [...new Set(results)];
    });
}

(async () => {
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(`${page.url()}: ${error.stack}`));
        await page.addInitScript(() => {
            if (!localStorage.getItem('agriLanguage')) localStorage.setItem('agriLanguage', 'hi');
            sessionStorage.setItem('agriLanguagePrompted', 'true');
        });
        const dates = Array.from({ length: 7 }, (_, i) => `2026-10-${26 + i > 31 ? '31' : 26 + i}`);
        const weather = {
            timezone: 'Asia/Kolkata', current_weather: { temperature: 29, weathercode: 2, is_day: 1, windspeed: 8, time: '2026-10-26T12:00' },
            current: { time: '2026-10-26T12:00', temperature_2m: 29, weather_code: 2, is_day: 1, apparent_temperature: 31, relative_humidity_2m: 60, wind_speed_10m: 8, wind_direction_10m: 90, precipitation: 0 },
            daily: { time: dates, weather_code: dates.map(() => 2), temperature_2m_max: dates.map(() => 32), temperature_2m_min: dates.map(() => 22), precipitation_probability_max: dates.map(() => 70) },
            hourly: { time: Array.from({ length: 24 }, (_, hour) => `2026-10-26T${String(hour).padStart(2, '0')}:00`), temperature_2m: Array(24).fill(29), weather_code: Array(24).fill(2), is_day: Array(24).fill(1), soil_moisture_0_to_1cm: Array(24).fill(0.25), soil_temperature_0cm: Array(24).fill(27) }
        };
        await page.route('**/*', route => {
            const url = route.request().url();
            if (url.includes('api.open-meteo.com')) return route.fulfill({ json: weather });
            if (url.startsWith(base)) return route.continue();
            return route.abort();
        });
        const visit = async path => {
            await page.goto(`${base}/${path}`, { waitUntil: 'load' });
            await page.waitForTimeout(80);
        };
        const assertHindi = async label => assert.deepEqual(await untranslated(page), [], label);
        const paths = ['index.html', 'about.html', 'crop.html', 'schemes.html', 'soil.html', 'del.html', 'distmap.html', 'login.html', 'notice-board.html', 'all-crops',
            ...[...cropsByKey.keys()].map(key => `crop/${key}`),
            ...[...cropsByKey.keys()].map(key => `crop-details.html?crop=${key}`),
            ...['index', 'about', 'crop', 'schemes', 'login'].map(name => `audios/Agri-Solution Portal(Farmers)/${name}.html`)];
        for (const path of paths) {
            await visit(path);
            await assertHindi(path);
            await page.evaluate(() => window.setEnglish());
            const original = await page.locator('body').textContent();
            for (let i = 0; i < 2; i++) {
                await page.evaluate(() => { window.setHindi(); window.setEnglish(); });
                assert.equal(await page.locator('body').textContent(), original, `English round trip: ${path}`);
            }
            await page.evaluate(() => window.setHindi());
        }
        await visit('schemes.html');
        await page.evaluate(() => window.setEnglish());
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        await page.evaluate(() => window.setHindi());
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('lang'), 'hi');
        await page.locator('#scheme-community').selectOption('sc');
        await page.locator('#scheme-district').fill('Raipur');
        await assertHindi('scheme profile note');
        await page.locator('#scheme-jurisdiction').selectOption('state');
        assert.ok(await page.locator('.schemes-card:not([hidden])').count() > 0);
        await assertHindi('scheme count after filtering');
        await visit('del.html');
        await page.locator('#district').selectOption('1. Balod');
        await page.locator('#VidhanSabha').selectOption('Balod');
        await page.locator('#mandi').selectOption({ index: 1 });
        await page.locator('#dealer').evaluate(form => form.requestSubmit());
        await assertHindi('dealer options and result');
        assert.equal(await page.locator('#district').inputValue(), '1. Balod');
        await visit('distmap.html');
        await page.evaluate(() => showDistrictInformation('path3325'));
        await assertHindi('dynamic district information');
        await visit('login.html');
        await page.locator('#login-form').evaluate(form => form.reportValidity());
        assert.match(await page.locator('#login-form input[required]').first().evaluate(input => input.validationMessage), /[\u0900-\u097f]/);
        await page.evaluate(() => sessionStorage.setItem('agriUser', JSON.stringify({ name: 'किसान परीक्षण', mobile: '9999999999', district: 'Raipur' })));
        await visit('dashboard.html');
        await assertHindi('signed-in dashboard');
        await visit('token.html');
        await page.locator('#land-area').fill('2');
        await page.locator('#produce-quantity').fill('5000');
        assert.match(await page.locator('#produce-quantity').evaluate(input => input.validationMessage), /[\u0900-\u097f]/);
        await assertHindi('token validation');
        await page.locator('#produce-quantity').fill('500');
        await page.locator('#token-form').evaluate(form => form.requestSubmit());
        await assertHindi('allocated token');
        assert.equal(await page.locator('#token-result').isVisible(), true);
        await visit('notice-board.html');
        await page.locator('#notice-search-input').fill('किस्त');
        assert.equal(await page.locator('.notice-card:not([hidden])').count(), 1);
        await assertHindi('Hindi notice search');
        const downloadPromise = page.waitForEvent('download');
        await page.locator('.notice-card:not([hidden]) .notice-pdf-download').click();
        const download = await downloadPromise;
        assert.equal(await download.failure(), null);
        const stream = await download.createReadStream();
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const pdf = Buffer.concat(chunks).toString('latin1');
        assert.ok(pdf.startsWith('%PDF-1.4'));
        assert.ok(pdf.includes('/Subtype /Image'), 'Hindi PDF includes shaped Devanagari page');
        assert.deepEqual(errors, [], 'No browser exceptions');
        console.log(`Passed: ${paths.length} pages, language round trips, weather, filters, forms, dealer values, district details, tokens and Hindi PDF download.`);
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
