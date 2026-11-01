(() => {
    const speech = window.speechSynthesis;
    const contentSelector = 'main, .con';
    const chunkLimit = 1800;
    let activeUtterance = 0;
    let isReading = false;

    const styles = document.createElement('style');
    styles.textContent = `
        .agri-voice-audio-controls {
            position: fixed;
            inset-inline-start: 1rem;
            inset-inline-end: auto;
            inset-block-end: 1rem;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: .5rem;
            max-width: calc(100vw - 2rem);
            padding: .6rem;
            border: 1px solid #d5e5da;
            border-radius: .85rem;
            background: #fff;
            box-shadow: 0 4px 18px rgba(0, 0, 0, .18);
            color: #173c2b;
            font: 500 14px/1.3 system-ui, sans-serif;
        }
        .agri-voice-audio-controls button {
            min-height: 2.75rem;
            padding: .55rem .85rem;
            border: 0;
            border-radius: .6rem;
            background: #08734f;
            color: #fff;
            cursor: pointer;
            font: inherit;
        }
        .agri-voice-audio-controls button:focus-visible {
            outline: 3px solid #d59d28;
            outline-offset: 2px;
        }
        .agri-voice-audio-controls button:disabled {
            cursor: not-allowed;
            opacity: .6;
        }
        .agri-voice-audio-controls [data-voice-status] {
            max-width: min(14rem, 42vw);
        }
        @media (max-width: 480px) {
            .agri-voice-audio-controls {
                inset-inline-start: .5rem;
                inset-block-end: max(.5rem, env(safe-area-inset-bottom));
                gap: .35rem;
                padding: .45rem;
            }
            .agri-voice-audio-controls button {
                padding-inline: .65rem;
            }
        }
    `;
    document.head.appendChild(styles);

    const controls = document.createElement('div');
    controls.className = 'agri-voice-audio-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Page audio controls');

    const listenButton = document.createElement('button');
    listenButton.type = 'button';
    listenButton.dataset.voiceListen = '';

    const stopButton = document.createElement('button');
    stopButton.type = 'button';
    stopButton.dataset.voiceStop = '';
    stopButton.disabled = true;

    const status = document.createElement('span');
    status.dataset.voiceStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    controls.append(listenButton, stopButton, status);
    document.body.appendChild(controls);

    function isHindi() {
        return window.currentLanguage === 'hi'
            || (!window.currentLanguage && document.documentElement.lang.toLowerCase().startsWith('hi'));
    }

    function message(english, hindi) {
        return isHindi() ? hindi : english;
    }

    function updateControls() {
        const supported = Boolean(speech && 'SpeechSynthesisUtterance' in window);
        controls.setAttribute('aria-label', message('Page audio controls', 'पेज की आवाज़ के नियंत्रण'));
        listenButton.textContent = message('Listen to page', 'पेज सुनें');
        listenButton.setAttribute('aria-label', message('Listen to page', 'पेज सुनें'));
        stopButton.textContent = message('Stop', 'रोकें');
        stopButton.setAttribute('aria-label', message('Stop reading aloud', 'पढ़ना रोकें'));
        listenButton.disabled = !supported || isReading;
        stopButton.disabled = !supported || !isReading;

        if (!supported) {
            status.textContent = message(
                'Audio reading is not supported in this browser.',
                'इस ब्राउज़र में आवाज़ में पढ़ने की सुविधा उपलब्ध नहीं है।'
            );
        }
    }

    function getPageText() {
        const content = document.querySelector(contentSelector) || document.body;
        const copy = content.cloneNode(true);
        copy.querySelectorAll(
            'script, style, noscript, input, textarea, select, [aria-hidden="true"], [hidden], .agri-voice-audio-controls, .agri-voice-button, .agri-voice-status'
        ).forEach((element) => element.remove());
        return (copy.innerText || copy.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function splitText(text) {
        const chunks = [];
        let chunk = '';

        for (const word of text.split(/\s+/)) {
            if (word.length > chunkLimit) {
                if (chunk) chunks.push(chunk);
                for (let offset = 0; offset < word.length; offset += chunkLimit) {
                    chunks.push(word.slice(offset, offset + chunkLimit));
                }
                chunk = '';
                continue;
            }
            if (chunk && `${chunk} ${word}`.length > chunkLimit) {
                chunks.push(chunk);
                chunk = word;
            } else {
                chunk = chunk ? `${chunk} ${word}` : word;
            }
        }

        if (chunk) chunks.push(chunk);
        return chunks;
    }

    function finishReading(runId, finalStatus = '') {
        if (runId !== activeUtterance) return;
        isReading = false;
        status.textContent = finalStatus;
        updateControls();
    }

    function speakChunk(chunks, index, runId, language) {
        if (runId !== activeUtterance || !isReading) return;
        if (index >= chunks.length) {
            finishReading(runId, message('Finished reading the page.', 'पेज पढ़ना पूरा हुआ।'));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = language;
        const languagePrefix = language.slice(0, 2).toLowerCase();
        const voices = speech.getVoices();
        utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === language.toLowerCase())
            || voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix))
            || null;
        utterance.onend = () => speakChunk(chunks, index + 1, runId, language);
        utterance.onerror = (event) => {
            if (runId !== activeUtterance || event.error === 'canceled') return;
            finishReading(runId, message(
                'Audio playback failed. Please try again.',
                'आवाज़ चलाने में समस्या हुई। कृपया फिर से कोशिश करें।'
            ));
        };

        try {
            speech.speak(utterance);
        } catch (error) {
            console.error('Unable to read the page aloud.', error);
            finishReading(runId, message(
                'Audio playback failed. Please try again.',
                'आवाज़ चलाने में समस्या हुई। कृपया फिर से कोशिश करें।'
            ));
        }
    }

    function startReading() {
        const text = getPageText();
        if (!text) {
            status.textContent = message('There is no page content to read.', 'पढ़ने के लिए पेज पर कोई सामग्री नहीं है।');
            return;
        }

        const language = isHindi() ? 'hi-IN' : 'en-IN';
        const chunks = splitText(text);
        const runId = ++activeUtterance;
        speech.cancel();
        isReading = true;
        status.textContent = message('Reading the page aloud…', 'पेज को आवाज़ में पढ़ा जा रहा है…');
        updateControls();
        speakChunk(chunks, 0, runId, language);
    }

    function stopReading() {
        if (!isReading) return;
        activeUtterance += 1;
        isReading = false;
        speech.cancel();
        status.textContent = message('Reading stopped.', 'पढ़ना रोक दिया गया।');
        updateControls();
    }

    listenButton.addEventListener('click', startReading);
    stopButton.addEventListener('click', stopReading);
    document.addEventListener('DOMContentLoaded', updateControls, { once: true });
    document.addEventListener('agri:languagechange', () => {
        if (isReading) stopReading();
        updateControls();
        status.textContent = '';
    });
    window.addEventListener('pagehide', () => {
        if (isReading) {
            activeUtterance += 1;
            speech.cancel();
        }
    });

    updateControls();
})();
