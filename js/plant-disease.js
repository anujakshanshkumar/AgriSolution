(function () {
    'use strict';
    const $ = id => document.getElementById(id);
    const api = window.AgriApiClient;
    const session = window.AgriSessionStore;
    const initialToken = session.getUser()?.accessToken;
    const language = () => window.currentLanguage === 'hi' ? 'hi' : 'en';
    const t = text => window.agriTranslate?.(text, language()) || text;
    let config = null;
    let file = null;
    let previewUrl = null;
    let busy = false;
    let activeRecord = null;
    let reportUsesPhoto = false;
    let history = [];
    let nextBefore = null;
    let historyEpoch = 0;
    let imageEpoch = 0;
    let sessionEnded = false;
    let statusCopy = 'Checking your session…';
    let errorCopy = '';
    let historyCopy = '';
    let expiryTimer;
    const careRequests = new Map();

    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text != null) node.textContent = text;
        if (className) node.className = className;
        return node;
    }

    function ui(tag, copy, className) {
        const node = element(tag, t(copy), className);
        node.translate = false;
        return node;
    }

    function endSession() {
        if (sessionEnded) return;
        sessionEnded = true;
        clearTimeout(expiryTimer);
        for (const request of careRequests.values()) request.controller?.abort();
        $('plant-workspace').hidden = true;
        $('report-content').replaceChildren();
        $('plant-history-list').replaceChildren();
        history = [];
        activeRecord = null;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (session.getUser()?.accessToken === initialToken) session.clearUser();
        window.location.replace('/login.html');
    }

    function validSession() {
        const current = session.getUser();
        if (sessionEnded || !initialToken || current?.accessToken !== initialToken ||
            (current.expiresAt && new Date(current.expiresAt).getTime() <= Date.now())) {
            endSession();
            return false;
        }
        return true;
    }

    function handleAuth(error) {
        if (!validSession()) return true;
        if (error.status === 401) { endSession(); return true; }
        return false;
    }

    function errorMessage(error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError' || error.status === 504)
            return 'The analysis timed out. Please try again in a moment.';
        if (error.status === 413) return 'This photo is too large. Choose a smaller image.';
        if (error.status === 415) return 'This file is not a supported photo. Choose a valid JPEG, PNG or WebP image.';
        if (error.status === 429) return error.code === 'PLANT_RATE_LIMIT'
            ? error.message : 'Too many requests. Please wait a few minutes before trying again.';
        if (error.status === 503) return 'Plant analysis is temporarily unavailable. The administrator needs to check the AI provider configuration, credentials or quota.';
        if (error.status === 502) return 'The AI provider could not complete a reliable response. Please try again later.';
        if (error.status === 404) return 'This report is no longer available. Refresh your history.';
        if (error.status === 400) return 'The photo or details could not be accepted. Use a clear JPEG, PNG or WebP photo and check your notes.';
        return 'Unable to connect to the service. Check your connection and try again.';
    }

    function showError(copy, retry = true) {
        errorCopy = copy;
        $('analysis-error-text').textContent = t(copy);
        $('analysis-error').hidden = !copy;
        $('retry-analysis').hidden = !retry || !file || !config?.configured;
        if (copy) $('analysis-error').focus();
    }

    function setBusy(value) {
        busy = value;
        $('plant-fields').disabled = value;
        $('analysis-loading').hidden = !value;
        $('plant-form').setAttribute('aria-busy', String(value));
        $('retry-analysis').disabled = value;
        document.querySelectorAll('[data-report-id]').forEach(button => { button.disabled = value; });
    }

    function clearPhoto() {
        imageEpoch++;
        file = null;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        reportUsesPhoto = false;
        $('report-content').querySelector('.plant-report-photo')?.remove();
        $('plant-preview').removeAttribute('src');
        $('plant-preview-wrap').hidden = true;
        $('upload-prompt').hidden = false;
        $('remove-image').hidden = true;
        $('plant-image').value = '';
        $('plant-camera').value = '';
        setBusy(false);
    }

    async function choosePhoto(candidate) {
        if (busy || !candidate || !validSession()) return;
        showError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(candidate.type)) {
            showError('This file is not a supported photo. Choose a valid JPEG, PNG or WebP image.', false);
            return;
        }
        if (!candidate.size || candidate.size > (config?.maxFileSizeMb || 10) * 1024 * 1024) {
            showError('This photo is too large or empty. Choose a smaller, valid image.', false);
            return;
        }
        const epoch = ++imageEpoch;
        const candidateUrl = URL.createObjectURL(candidate);
        const image = new Image();
        image.src = candidateUrl;
        try { await image.decode(); }
        catch {
            URL.revokeObjectURL(candidateUrl);
            if (epoch === imageEpoch) showError('This photo cannot be opened. Choose a different image.', false);
            return;
        }
        if (epoch !== imageEpoch || !validSession()) { URL.revokeObjectURL(candidateUrl); return; }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        file = candidate;
        previewUrl = candidateUrl;
        $('plant-preview').src = previewUrl;
        $('plant-file-name').textContent = candidate.name;
        $('plant-preview-wrap').hidden = false;
        $('upload-prompt').hidden = true;
        $('remove-image').hidden = false;
        $('plant-report').hidden = true;
        activeRecord = null;
        setBusy(false);
        await analyze();
    }

    function dateLabel(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(language() === 'hi' ? 'hi-IN' : 'en-IN', {
            dateStyle: 'medium', timeStyle: 'short'
        }).format(date);
    }

    function renderCare(record) {
        const container = element('div', null, 'plant-care');
        container.id = 'plant-care';
        const care = record.result.careGuidance;
        const state = careRequests.get(record.id);
        const ready = care?.status === 'ready';
        container.dataset.state = ready ? 'ready' : state?.error || !config?.careGuidanceConfigured ? 'unavailable' : 'loading';
        const sections = [
            ['Treatment Required', 'plant-treatment'],
            ['How to apply', 'plant-application'],
            ['What causes this condition?', 'plant-causes'],
            ['What happens if left untreated?', 'plant-progression'],
        ].map(([title, id]) => {
            const section = element('section', null, 'plant-report-section plant-care-section');
            section.id = id;
            section.append(ui('h3', title));
            container.append(section);
            return section;
        });
        const [treatment, application, causes, progression] = sections;
        if (!ready) {
            const copy = container.dataset.state === 'loading'
                ? 'Loading care guidance from Gemini…'
                : state?.message || 'Care guidance is unavailable right now. Your disease prediction is still shown above.';
            const status = ui('p', copy, 'plant-help');
            status.setAttribute('role', 'status');
            treatment.append(status);
            application.append(ui('p', copy, 'plant-help'));
            causes.append(ui('p', 'Causes will appear here when the care guidance is ready.', 'plant-help'));
            progression.append(ui('p', 'Timing depends on the condition, weather and crop stage; an exact day cannot be predicted from a photo.', 'plant-help'));
            if (state?.error && config?.careGuidanceConfigured) {
                const retry = ui('button', 'Retry care guidance', 'plant-button plant-secondary');
                retry.type = 'button';
                retry.addEventListener('click', () => loadCare(record));
                treatment.append(retry);
            }
            return container;
        }
        treatment.append(element('p', care.treatmentSummary));
        if (care.careSteps?.length) {
            treatment.append(ui('h4', 'What to do, step by step'));
            const steps = element('ol');
            care.careSteps.forEach(step => steps.append(element('li', step)));
            treatment.append(steps);
        }
        for (const medicine of care.medicines || []) {
            const card = element('article', null, 'plant-medicine');
            card.append(element('h4', medicine.name), element('p', medicine.purpose));
            if (medicine.composition) card.append(ui('h5', 'Medicine composition'), element('p', medicine.composition));
            if (medicine.buyingAdvice) card.append(ui('h5', 'What to ask at the shop'), element('p', medicine.buyingAdvice));
            treatment.append(card);
            const instructions = element('article', null, 'plant-medicine');
            instructions.append(element('h4', medicine.name), element('p', medicine.howToApply));
            instructions.append(ui('h5', 'Precautions'), element('p', medicine.precautions));
            application.append(instructions);
        }
        if (!care.medicines?.length) application.append(ui('p', 'No medicine application is recommended. Follow the care steps above.', 'plant-help'));
        const causeList = element('ul');
        care.causes.forEach(cause => causeList.append(element('li', cause)));
        causes.append(causeList);
        const timeline = element('div', null, 'plant-timeline');
        for (const stage of care.untreatedProgression) {
            const row = element('article', null, 'plant-timeline-item');
            row.append(element('h4', stage.timeframe), element('p', stage.outcome));
            timeline.append(row);
        }
        progression.append(timeline, element('p', care.timelineNote, 'plant-help'));
        progression.append(ui('p', 'Care guidance by Gemini, based on the predicted condition. Confirm the diagnosis and follow locally approved product labels.', 'plant-help'));
        // Generated text stays in the language of the saved assessment.
        container.translate = false;
        return container;
    }

    async function loadCare(record) {
        if (!validSession() || record.result.careGuidance?.status === 'ready' || !config?.careGuidanceConfigured || careRequests.get(record.id)?.loading) return;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), Math.max(config.requestTimeoutMs || 60000, 120000) + 5000);
        careRequests.set(record.id, { loading: true, controller });
        if (activeRecord?.id === record.id) renderReport(record);
        try {
            const updated = await api.post(`plant-disease/history/${encodeURIComponent(record.id)}/guidance`, {}, 'POST', { signal: controller.signal });
            if (!validSession()) return;
            record.result = updated.result;
            history = history.map(item => item.id === record.id ? updated : item);
            careRequests.delete(record.id);
        } catch (error) {
            if (handleAuth(error)) return;
            const message = typeof error.code === 'string' && error.code.startsWith('PLANT_')
                ? error.message : errorMessage(error);
            careRequests.set(record.id, { error: true, message });
        } finally {
            clearTimeout(timer);
            if (validSession() && activeRecord?.id === record.id) renderReport(record);
        }
    }

    function renderReport(record, focus = false) {
        if (!validSession()) return;
        activeRecord = record;
        const result = record.result;
        const content = $('report-content');
        content.replaceChildren();
        if (reportUsesPhoto && previewUrl) {
            const photo = element('img', null, 'plant-report-photo');
            photo.src = previewUrl;
            photo.alt = t('Selected plant photo');
            photo.translate = false;
            content.append(photo);
        }
        const summary = element('div', null, 'plant-result-summary');
        const diagnosis = element('h3', result.primaryDiagnosis?.name || t('No specific diagnosis identified'),
            result.plantCondition === 'healthy_looking' ? 'plant-diagnosis plant-diagnosis-healthy' : 'plant-diagnosis plant-diagnosis-danger');
        diagnosis.translate = false;
        summary.append(diagnosis);
        content.append(summary);
        if (result.classifier?.uncertainty === 'low_confidence') summary.append(ui('p', 'Low confidence: confirm the cause before treatment.', 'plant-result-warning'));
        content.append(renderCare(record));
        if (result.classifier) {
            if (result.classifier.uncertainty === 'low_confidence') content.append(ui('p', 'Low confidence: this prediction is uncertain. Please provide a clearer photo and seek expert review.', 'plant-notice'));
        } else content.append(ui('p', 'This is an AI assessment, not a confirmed diagnosis. No calibrated confidence score is available.', 'plant-notice'));
        $('report-date').textContent = dateLabel(record.createdAt);
        $('plant-report').hidden = false;
        if (focus) { $('plant-report').focus(); $('plant-report').scrollIntoView({ block: 'start', behavior: 'auto' }); }
    }

    function renderHistory() {
        if (!validSession()) return;
        const list = $('plant-history-list');
        list.replaceChildren();
        history.forEach(record => {
            const article = element('article', null, 'plant-history-item');
            const title = element('h3', record.result.primaryDiagnosis?.name || record.result.crop || t('Plant assessment'));
            title.translate = false;
            const date = element('p', dateLabel(record.createdAt));
            date.translate = false;
            const actions = element('div', null, 'plant-history-actions');
            const open = ui('button', 'View report', 'plant-button plant-text-button');
            open.type = 'button';
            open.disabled = busy;
            open.dataset.reportId = record.id;
            open.addEventListener('click', async () => {
                if (busy || !validSession()) return;
                open.disabled = true;
                try {
                    const saved = await api.get(`plant-disease/history/${encodeURIComponent(record.id)}`);
                    if (validSession() && !busy) { clearPhoto(); renderReport(saved, true); void loadCare(saved); }
                } catch (error) { if (!handleAuth(error)) showError(errorMessage(error), false); }
                finally { open.disabled = false; }
            });
            const remove = ui('button', 'Delete report', 'plant-button plant-text-button plant-delete');
            remove.type = 'button';
            remove.dataset.deleteId = record.id;
            remove.addEventListener('click', async () => {
                if (!validSession() || !window.confirm(t('Delete this saved report? This cannot be undone.'))) return;
                remove.disabled = true;
                try {
                    await api.delete(`plant-disease/history/${encodeURIComponent(record.id)}`);
                    if (!validSession()) return;
                    historyEpoch++;
                    history = history.filter(item => item.id !== record.id);
                    if (activeRecord?.id === record.id) { activeRecord = null; $('plant-report').hidden = true; }
                    historyCopy = 'Report deleted.';
                    renderHistory();
                } catch (error) { if (!handleAuth(error)) { historyCopy = errorMessage(error); renderHistory(); } }
                finally { remove.disabled = false; }
            });
            actions.append(open, remove);
            article.append(title, date, actions);
            list.append(article);
        });
        $('history-status').textContent = t(historyCopy || (history.length ? '' : 'No saved reports yet. Your first analysis will appear here.'));
        $('history-more').hidden = !nextBefore;
    }

    async function loadHistory(append = false) {
        if (!validSession()) return;
        const epoch = ++historyEpoch;
        historyCopy = 'Loading your reports…';
        $('history-status').textContent = t(historyCopy);
        $('refresh-history').disabled = true;
        $('history-more').disabled = true;
        try {
            const response = await api.get(`plant-disease/history${append && nextBefore ? `?before=${encodeURIComponent(nextBefore)}` : ''}`);
            if (!validSession() || epoch !== historyEpoch) return;
            history = append ? [...history, ...response.analyses.filter(row => !history.some(old => old.id === row.id))] : response.analyses;
            nextBefore = response.nextBefore || null;
            historyCopy = '';
            renderHistory();
        } catch (error) {
            if (!handleAuth(error) && epoch === historyEpoch) { historyCopy = errorMessage(error); renderHistory(); }
        } finally { $('refresh-history').disabled = false; $('history-more').disabled = false; }
    }

    async function analyze(event) {
        event?.preventDefault();
        if (busy || !validSession()) return;
        if (!file) { showError('Choose a plant photo before starting the analysis.', false); return; }
        if (!config?.configured) return;
        const data = new FormData();
        data.append('image', file);
        data.append('crop', $('plant-crop').value);
        data.append('symptoms', $('plant-symptoms').value.trim());
        data.append('language', language());
        showError('');
        $('plant-report').hidden = true;
        activeRecord = null;
        setBusy(true);
        try {
            const record = await api.upload('plant-disease/analyze', data, { timeoutMs: (config.requestTimeoutMs || 60000) + 20000 });
            if (!validSession()) return;
            reportUsesPhoto = true;
            renderReport(record, true);
            void loadCare(record);
            await loadHistory();
        } catch (error) { if (!handleAuth(error)) showError(errorMessage(error)); }
        finally { setBusy(false); }
    }

    function refreshCopy() {
        $('plant-status').textContent = t(statusCopy);
        $('analysis-error-text').textContent = t(errorCopy);
        $('image-requirements').textContent = t('JPEG, PNG or WebP · up to {size} MB').replace('{size}', String(config?.maxFileSizeMb || 10));
        if (activeRecord) renderReport(activeRecord);
        renderHistory();
    }

    async function initialize() {
        if (!validSession()) return;
        $('config-retry').hidden = true;
        try {
            config = await api.get('plant-disease/config');
            if (!validSession()) return;
            $('plant-workspace').hidden = false;
            statusCopy = config.configured ? '' : 'Plant analysis is not set up yet. Ask the administrator to configure the analysis service. You can still view your saved reports.';
            $('plant-provider-notice').textContent = config.provider === 'local_rice'
                ? t('Detection starts automatically. Your photo stays with the local rice classifier; only the predicted condition is sent to Gemini for care guidance. Reports are saved in your account; photos are not saved.')
                : t('Your photo and notes are sent to Google Gemini for analysis. Reports are saved in your account; photos are not stored by the portal.');
            $('plant-crop').value = config.provider === 'local_rice' ? 'Rice' : '';
            $('plant-status').hidden = !statusCopy;
            $('config-retry').hidden = config.configured;
            refreshCopy();
            setBusy(false);
            await loadHistory();
        } catch (error) {
            if (handleAuth(error)) return;
            statusCopy = errorMessage(error);
            $('plant-status').hidden = false;
            $('plant-status').textContent = t(statusCopy);
            $('config-retry').hidden = false;
        }
    }

    if (!validSession()) return;
    const expiresAt = new Date(session.getUser().expiresAt).getTime();
    if (Number.isFinite(expiresAt)) expiryTimer = setTimeout(() => validSession(), Math.min(expiresAt - Date.now() + 50, 2147483647));
    $('browse-image').addEventListener('click', () => $('plant-image').click());
    document.querySelectorAll('[data-plant-language]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.plantLanguage === 'hi') window.setHindi();
            else window.setEnglish();
            document.querySelector('.langbtn').focus();
        });
    });
    document.querySelector('.lang-drop').addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            $('langmenu').classList.remove('is-open');
            document.querySelector('.langbtn').setAttribute('aria-expanded', 'false');
            document.querySelector('.langbtn').focus();
        }
    });
    $('capture-image').addEventListener('click', () => $('plant-camera').click());
    ['plant-image', 'plant-camera'].forEach(id => $(id).addEventListener('change', event => choosePhoto(event.target.files[0])));
    $('remove-image').addEventListener('click', () => { clearPhoto(); showError(''); $('browse-image').focus(); });
    const zone = $('plant-drop-zone');
    ['dragenter', 'dragover'].forEach(name => zone.addEventListener(name, event => { event.preventDefault(); if (!busy) zone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach(name => zone.addEventListener(name, event => { event.preventDefault(); zone.classList.remove('is-dragging'); }));
    zone.addEventListener('drop', event => {
        if (event.dataTransfer.files.length > 1) { showError('Choose one plant photo at a time.', false); return; }
        choosePhoto(event.dataTransfer.files[0]);
    });
    $('plant-form').addEventListener('submit', analyze);
    $('retry-analysis').addEventListener('click', analyze);
    $('config-retry').addEventListener('click', initialize);
    $('refresh-history').addEventListener('click', () => loadHistory());
    $('history-more').addEventListener('click', () => loadHistory(true));
    $('analyze-another').addEventListener('click', () => {
        if (busy) return;
        clearPhoto();
        $('plant-form').reset();
        $('plant-crop').value = config?.provider === 'local_rice' ? 'Rice' : '';
        activeRecord = null;
        $('plant-report').hidden = true;
        showError('');
        $('browse-image').focus();
        $('plant-form').scrollIntoView({ block: 'start' });
    });
    document.addEventListener('agri:languagechange', refreshCopy);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) validSession(); });
    window.addEventListener('pageshow', () => validSession());
    window.addEventListener('pagehide', () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
    initialize();
})();
