(() => {
    const inputSelector = 'input, textarea, select';
    const audioSampleRate = 16000;
    const maxRecordingMs = 15000;
    const processedInputs = new WeakSet();
    const inputStatuses = new WeakMap();
    const inputButtons = new WeakMap();
    const digitWords = new Map([
        ['zero', '0'], ['oh', '0'], ['o', '0'], ['shunya', '0'], ['shoonya', '0'], ['शून्य', '0'],
        ['one', '1'], ['won', '1'], ['ek', '1'], ['एक', '1'],
        ['two', '2'], ['to', '2'], ['too', '2'], ['do', '2'], ['दो', '2'],
        ['three', '3'], ['teen', '3'], ['tin', '3'], ['तीन', '3'],
        ['four', '4'], ['for', '4'], ['char', '4'], ['chaar', '4'], ['चार', '4'],
        ['five', '5'], ['panch', '5'], ['paanch', '5'], ['पांच', '5'], ['पाँच', '5'],
        ['six', '6'], ['chhah', '6'], ['chheh', '6'], ['छह', '6'], ['छः', '6'],
        ['seven', '7'], ['saat', '7'], ['सात', '7'],
        ['eight', '8'], ['aath', '8'], ['आठ', '8'],
        ['nine', '9'], ['nau', '9'], ['नौ', '9']
    ]);
    let activeRecording = null;
    let voiceInputPending = false;
    let automaticInput = null;

    const styles = document.createElement('style');
    styles.textContent = `
        .agri-voice-anchor { position: relative; }
        .agri-voice-input { padding-right: 48px !important; }
        .agri-voice-button {
            position: absolute;
            top: 50%;
            right: 8px;
            display: inline-flex;
            width: 32px;
            height: 32px;
            align-items: center;
            justify-content: center;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: transparent;
            color: #075c2b;
            cursor: pointer;
            transform: translateY(-50%);
            z-index: 2;
        }
        .agri-voice-button:hover,
        .agri-voice-button:focus-visible {
            background: rgba(4, 159, 92, .16);
            outline: 2px solid #049f5c;
            outline-offset: 1px;
        }
        .agri-voice-button:disabled { cursor: wait; opacity: .65; }
        .agri-voice-button i { position: static; font-size: 17px; transform: none; }
        .agri-voice-status {
            position: absolute;
            top: calc(100% + 3px);
            left: 0;
            z-index: 3;
            color: #166534;
            font-size: 12px;
            line-height: 1.2;
            text-align: left;
        }
        .agri-voice-status.error { color: #b91c1c; }
        .input-box.voice-enabled > .agri-voice-button { right: 48px; }
        .search-container.agri-voice-anchor > .agri-voice-button { right: 36px; }
        .home-chatbot-form.agri-voice-anchor > .agri-voice-button {
            top: 8px;
            right: 60px;
            transform: none;
        }
        textarea.agri-voice-input ~ .agri-voice-button {
            top: 8px;
            transform: none;
        }
    `;
    (document.head || document.documentElement).append(styles);

    function speechLanguage() {
        return window.currentLanguage === 'hi' ? 'hi_in' : 'en_us';
    }

    function automaticSpeechLanguage() {
        return window.currentLanguage === 'hi' ? 'en_us' : 'hi_in';
    }

    function isAutomaticInput(input) {
        if (input instanceof HTMLTextAreaElement) return true;
        if (!(input instanceof HTMLInputElement)) return false;
        return ['text', 'search'].includes((input.type || 'text').toLowerCase());
    }

    function setStatus(input, message, isError = false) {
        const status = inputStatuses.get(input);
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function concatenateSamples(chunks) {
        const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
        const samples = new Float32Array(length);
        let offset = 0;

        for (const chunk of chunks) {
            samples.set(chunk, offset);
            offset += chunk.length;
        }
        return samples;
    }

    function convertToPcm(samples, inputSampleRate) {
        const ratio = inputSampleRate / audioSampleRate;
        const outputLength = Math.floor(samples.length / ratio);
        const pcm = new Int16Array(outputLength);

        for (let index = 0; index < outputLength; index += 1) {
            const start = Math.floor(index * ratio);
            const end = Math.min(Math.max(start + 1, Math.floor((index + 1) * ratio)), samples.length);
            let sum = 0;
            for (let sample = start; sample < end; sample += 1) sum += samples[sample];

            const value = sum / Math.max(1, end - start);
            pcm[index] = value < 0
                ? Math.round(value * 0x8000)
                : Math.round(value * 0x7fff);
        }

        return pcm;
    }

    function normalizeHindiDigits(text) {
        return text.replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - 0x0966));
    }

    function normalizeSpokenDigits(text) {
        const tokens = normalizeHindiDigits(text).match(/[\p{L}\p{N}]+/gu);
        if (!tokens?.length) return '';

        const digits = [];
        for (const token of tokens) {
            if (/^\d+$/.test(token)) {
                digits.push(token);
                continue;
            }
            const digit = digitWords.get(token.toLocaleLowerCase());
            if (digit === undefined) return '';
            digits.push(digit);
        }
        return digits.join('');
    }

    function normalizeNumericTranscript(text) {
        const normalizedText = normalizeHindiDigits(text).trim();
        if (/^-?\d+(?:\.\d+)?$/.test(normalizedText)) return normalizedText;

        const tokens = normalizedText.match(/[\p{L}\p{N}.]+/gu);
        if (!tokens?.length) return '';

        const parts = [];
        for (const token of tokens) {
            if (/^\d+$/.test(token)) {
                parts.push(token);
                continue;
            }
            const normalizedToken = token.toLocaleLowerCase();
            if (['point', 'dot', 'decimal', 'दशमलव'].includes(normalizedToken)) {
                parts.push('.');
                continue;
            }
            const digit = digitWords.get(normalizedToken);
            if (digit === undefined) return '';
            parts.push(digit);
        }

        const number = parts.join('');
        return /^-?\d+(?:\.\d+)?$/.test(number) ? number : '';
    }

    function releaseRecording(recording) {
        recording.stream.getTracks().forEach((track) => track.stop());
        recording.source.disconnect();
        recording.processor.disconnect();
        recording.silence.disconnect();
        if (recording.audioContext.state !== 'closed') {
            recording.audioContext.close().catch((error) => {
                console.error('Unable to close the voice-input audio context.', error);
            });
        }
    }

    function insertTranscript(input, text) {
        if (input instanceof HTMLSelectElement) {
            const transcript = text.trim().normalize('NFKC').toLocaleLowerCase();
            const option = Array.from(input.options).find((candidate) => {
                if (candidate.disabled) return false;
                return [candidate.value, candidate.textContent]
                    .some((value) => value.trim().normalize('NFKC').toLocaleLowerCase() === transcript);
            });
            if (!option) throw new Error('No matching option was found. Please say the option name clearly.');
            input.value = option.value;
        } else if (input instanceof HTMLInputElement && input.type === 'number') {
            const numericText = normalizeNumericTranscript(text);
            if (!numericText) throw new Error('Speak a valid number, for example “two point five”.');
            input.value = numericText;
        } else {
            const transcript = input.name === 'mobile' || input.type === 'tel'
                ? normalizeSpokenDigits(text) || text.trim()
                : text.trim();
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            input.setRangeText(transcript, start, end, 'end');
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async function transcribe(recording) {
        const { input, button } = recording;
        let resumeAutomatic = false;
        const samples = concatenateSamples(recording.chunks);
        const pcm = convertToPcm(samples, recording.audioContext.sampleRate);
        releaseRecording(recording);

        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
        button.setAttribute('aria-label', 'Transcribing voice input');
        setStatus(input, window.currentLanguage === 'hi' ? 'आवाज़ को टेक्स्ट में बदल रहा है…' : 'Converting speech to text…');

        if (pcm.byteLength < 1600) {
            setStatus(input, window.currentLanguage === 'hi' ? 'कुछ सुनाई नहीं दिया। फिर से बोलें।' : 'No speech was captured. Please try again.', true);
            resetButton(button);
            voiceInputPending = false;
            resumeAutomatic = recording.automatic;
            if (resumeAutomatic) resumeAutomaticInput();
            return;
        }

        try {
            let response;
            try {
                response = await fetch(`/api/v1/speech/transcribe?language=${recording.language}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: pcm.buffer
                });
            } catch (error) {
                if (error instanceof TypeError) {
                    throw new Error('Cannot reach the speech API. Start the project with "npm start" and open the page from that server.');
                }
                throw error;
            }

            let result;
            try {
                result = await response.json();
            } catch {
                if (response.status === 404) {
                    throw new Error('Speech API not found. Start the project with "npm start"; VS Code Live Server does not run the API.');
                }
                throw new Error('The speech API returned an invalid response. Restart the project with "npm start" and try again.');
            }

            if (response.status === 404) {
                throw new Error('Speech API not found. Start the project with "npm start"; VS Code Live Server does not run the API.');
            }
            if (!response.ok) throw new Error(result.error || 'Speech recognition failed. Please try again.');
            if (typeof result.text !== 'string' || !result.text.trim()) {
                throw new Error('No speech was recognized. Please try again.');
            }

            let transcript = result.text;
            if (recording.automatic) {
                const translationResponse = await fetch('/api/v1/speech/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: transcript,
                        language: recording.targetLanguage
                    })
                });
                let translation;
                try {
                    translation = await translationResponse.json();
                } catch {
                    throw new Error('The translation service returned an invalid response. Please try again.');
                }
                if (!translationResponse.ok) {
                    throw new Error(translation.error || 'Speech translation failed. Please try again.');
                }
                if (typeof translation.text !== 'string' || !translation.text.trim()) {
                    throw new Error('Speech translation returned no text. Please try again.');
                }
                transcript = `${translation.text.trim()} `;
            }

            insertTranscript(input, transcript);
            setStatus(input, window.currentLanguage === 'hi' ? 'टेक्स्ट जोड़ दिया गया।' : 'Text added.');
            resumeAutomatic = recording.automatic;
        } catch (error) {
            setStatus(input, error.message || 'Speech recognition failed. Please try again.', true);
        } finally {
            resetButton(button);
            voiceInputPending = false;
            if (resumeAutomatic) resumeAutomaticInput();
        }
    }

    function resetButton(button) {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-microphone" aria-hidden="true"></i>';
        button.setAttribute('aria-label', window.currentLanguage === 'hi' ? 'बोलकर टेक्स्ट भरें' : 'Enter text using speech');
        button.title = window.currentLanguage === 'hi' ? 'बोलकर टेक्स्ट भरें' : 'Enter text using speech';
    }

    function stopRecording(recording) {
        if (activeRecording !== recording) return;
        activeRecording = null;
        voiceInputPending = true;
        window.clearTimeout(recording.timeout);
        recording.processor.onaudioprocess = null;
        void transcribe(recording);
    }

    function resumeAutomaticInput() {
        const input = automaticInput;
        const button = input && inputButtons.get(input);
        if (!input || !button || document.activeElement !== input || voiceInputPending || activeRecording) return;
        window.setTimeout(() => {
            if (automaticInput === input && document.activeElement === input && !voiceInputPending && !activeRecording) {
                void startRecording(input, button, true);
            }
        }, 250);
    }

    async function startRecording(input, button, automatic = false) {
        if (voiceInputPending) {
            setStatus(input, window.currentLanguage === 'hi' ? 'पहले मौजूदा आवाज़ इनपुट पूरा करें।' : 'Finish the current voice input before starting another.', true);
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus(input, 'Microphone access requires a secure connection (HTTPS or localhost).', true);
            return;
        }

        voiceInputPending = true;
        button.disabled = true;
        let stream;
        let audioContext;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) throw new Error('Audio recording is not supported in this browser.');

            try {
                audioContext = new AudioContextClass({ sampleRate: audioSampleRate });
            } catch {
                audioContext = new AudioContextClass();
            }
            await audioContext.resume();

            if (automatic && (automaticInput !== input || document.activeElement !== input)) {
                stream.getTracks().forEach((track) => track.stop());
                await audioContext.close();
                button.disabled = false;
                voiceInputPending = false;
                return;
            }

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            const silence = audioContext.createGain();
            silence.gain.value = 0;
            const recording = {
                input,
                button,
                stream,
                audioContext,
                source,
                processor,
                silence,
                chunks: [],
                timeout: null,
                language: automatic ? automaticSpeechLanguage() : speechLanguage(),
                targetLanguage: window.currentLanguage === 'hi' ? 'hi' : 'en',
                automatic,
                hasSpeech: false,
                lastSpeechAt: 0
            };

            processor.onaudioprocess = (event) => {
                if (activeRecording === recording) {
                    const samples = new Float32Array(event.inputBuffer.getChannelData(0));
                    recording.chunks.push(samples);
                    if (automatic) {
                        let energy = 0;
                        for (const sample of samples) energy += sample * sample;
                        const volume = Math.sqrt(energy / samples.length);
                        if (volume >= 0.015) {
                            recording.hasSpeech = true;
                            recording.lastSpeechAt = Date.now();
                        } else if (recording.hasSpeech && Date.now() - recording.lastSpeechAt >= 1000) {
                            stopRecording(recording);
                        }
                    }
                }
            };
            source.connect(processor);
            processor.connect(silence);
            silence.connect(audioContext.destination);
            activeRecording = recording;

            voiceInputPending = false;
            button.disabled = false;
            button.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i>';
            button.setAttribute('aria-label', window.currentLanguage === 'hi' ? 'रिकॉर्डिंग रोकें' : 'Stop recording');
            button.title = window.currentLanguage === 'hi' ? 'रिकॉर्डिंग रोकें' : 'Stop recording';
            setStatus(input, automatic
                ? (window.currentLanguage === 'hi' ? 'बोलें… रुकने पर अनुवाद अपने-आप जुड़ जाएगा।' : 'Speak… your translation is added automatically after a pause.')
                : (window.currentLanguage === 'hi' ? 'सुन रहा है… रोकने के लिए फिर से माइक्रोफ़ोन दबाएँ।' : 'Listening… tap the microphone again to finish.'));
            recording.timeout = window.setTimeout(() => stopRecording(recording), maxRecordingMs);
        } catch (error) {
            stream?.getTracks().forEach((track) => track.stop());
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close().catch((closeError) => {
                    console.error('Unable to close the voice-input audio context.', closeError);
                });
            }
            setStatus(input, error.name === 'NotAllowedError'
                ? 'Allow microphone access in your browser, then try again.'
                : error.message || 'Could not start the microphone. Please try again.', true);
            button.disabled = false;
            voiceInputPending = false;
        }
    }

    function isEligibleInput(input) {
        if (input.dataset.voiceInput === 'off') return false;
        if (input.disabled || input.readOnly || input.closest('[aria-hidden="true"], [hidden]')) return false;
        if (input.getClientRects().length === 0) return false;
        const type = input instanceof HTMLTextAreaElement
            ? 'textarea'
            : input instanceof HTMLSelectElement
                ? 'select'
                : (input.type || 'text').toLowerCase();
        if (!['textarea', 'select', 'text', 'search', 'tel', 'email', 'url', 'number'].includes(type)) return false;
        if (input instanceof HTMLSelectElement && input.multiple) return false;
        if (type === 'password' || input.autocomplete === 'one-time-code') return false;
        if (/\b(password|passwd|secret|token|otp|pin|cvv|credential|api.?key)\b/i.test(`${input.name} ${input.id} ${input.autocomplete}`)) return false;
        return true;
    }

    function addVoiceControl(input) {
        if (processedInputs.has(input) || !isEligibleInput(input)) return;

        const anchor = input.parentElement;
        if (!anchor) return;
        processedInputs.add(input);
        input.classList.add('agri-voice-input');
        anchor.classList.add('agri-voice-anchor');

        if (input.closest('.input-box')) {
            input.closest('.input-box').classList.add('voice-enabled');
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'agri-voice-button';
        button.innerHTML = '<i class="fa-solid fa-microphone" aria-hidden="true"></i>';
        button.setAttribute('aria-label', window.currentLanguage === 'hi' ? 'बोलकर टेक्स्ट भरें' : 'Enter text using speech');
        button.title = window.currentLanguage === 'hi' ? 'बोलकर टेक्स्ट भरें' : 'Enter text using speech';
        inputButtons.set(input, button);
        button.addEventListener('click', (event) => {
            event.preventDefault();
            if (activeRecording?.button === button) {
                stopRecording(activeRecording);
                return;
            }
            if (activeRecording) {
                setStatus(activeRecording.input, window.currentLanguage === 'hi' ? 'रिकॉर्डिंग रोकें और फिर से कोशिश करें।' : 'Finish the current recording before starting another.', true);
                return;
            }
            if (!button.disabled) startRecording(input, button);
        });

        const status = document.createElement('span');
        status.className = 'agri-voice-status';
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('role', 'status');
        anchor.append(button, status);
        inputStatuses.set(input, status);
    }

    function prepareMicrophonePermission() {
        const input = Array.from(document.querySelectorAll(inputSelector))
            .find((candidate) => isEligibleInput(candidate) && isAutomaticInput(candidate));
        if (!input) return;
        if (!navigator.mediaDevices?.getUserMedia) {
            setStatus(input, 'Microphone access requires a secure connection (HTTPS or localhost).', true);
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            stream.getTracks().forEach((track) => track.stop());
            setStatus(input, '');
        }).catch((error) => {
            setStatus(input, error.name === 'NotAllowedError'
                ? 'Allow microphone access in your browser, then focus a text box to start.'
                : error.message || 'Could not request microphone access.', true);
        });
    }

    function scanInputs(root = document) {
        if (root instanceof Element && root.matches(inputSelector)) addVoiceControl(root);
        root.querySelectorAll?.(inputSelector).forEach(addVoiceControl);
    }

    scanInputs();
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof Element) scanInputs(node);
                });
            } else if (mutation.target instanceof Element) {
                scanInputs(mutation.target);
            }
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'hidden', 'disabled', 'readonly', 'type', 'autocomplete', 'aria-hidden', 'style']
    });

    document.addEventListener('focusin', (event) => {
        const input = event.target;
        if (!(input instanceof HTMLElement) || !input.matches(inputSelector)) return;
        if (!isEligibleInput(input) || !isAutomaticInput(input)) {
            automaticInput = null;
            if (activeRecording?.automatic) stopRecording(activeRecording);
            return;
        }

        automaticInput = input;
        if (activeRecording?.automatic && activeRecording.input !== input) {
            stopRecording(activeRecording);
            return;
        }
        if (!activeRecording && !voiceInputPending) {
            const button = inputButtons.get(input);
            if (button) void startRecording(input, button, true);
        }
    });

    document.addEventListener('focusout', (event) => {
        const input = event.target;
        if (input !== automaticInput) return;
        window.setTimeout(() => {
            if (document.activeElement === input || document.activeElement?.classList.contains('agri-voice-button')) return;
            if (automaticInput === input) automaticInput = null;
            if (activeRecording?.automatic && activeRecording.input === input) stopRecording(activeRecording);
        }, 0);
    });

    prepareMicrophonePermission();

    document.addEventListener('agri:languagechange', () => {
        document.querySelectorAll('.agri-voice-button:not(:disabled)').forEach((button) => {
            if (activeRecording?.button === button) {
                button.setAttribute('aria-label', window.currentLanguage === 'hi' ? 'रिकॉर्डिंग रोकें' : 'Stop recording');
                button.title = window.currentLanguage === 'hi' ? 'रिकॉर्डिंग रोकें' : 'Stop recording';
            } else {
                resetButton(button);
            }
        });
    });

    window.addEventListener('pagehide', () => {
        if (!activeRecording) return;
        const recording = activeRecording;
        activeRecording = null;
        voiceInputPending = false;
        window.clearTimeout(recording.timeout);
        releaseRecording(recording);
    });
})();
