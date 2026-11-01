(() => {
    const input = document.getElementById('search-input');
    const toggle = document.getElementById('search-tog');
    const button = document.getElementById('search-microphone');
    const status = document.getElementById('search-voice-status');
    if (!input || !toggle || !button || !status) return;

    const style = document.createElement('style');
    style.textContent = `
        #inline-search-container { position: relative; }
        #search-tog { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; min-height: 36px; }
        #search-input.active { padding-right: 68px; }
        #search-microphone { position: absolute; right: 48px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; border: 0; border-radius: 50%; background: #e4f3e8; color: #075c2b; cursor: pointer; z-index: 1002; }
        #search-microphone[hidden] { display: none; }
        #search-microphone[aria-pressed="true"] { background: #fee2e2; color: #b91c1c; }
        #search-microphone:focus-visible { outline: 2px solid #075c2b; outline-offset: 2px; }
        #search-microphone:disabled { opacity: .6; cursor: wait; }
        #search-voice-status:not(:empty) { position: absolute; top: calc(100% + 6px); right: 0; width: min(280px, 80vw); padding: 8px 12px; border-radius: 8px; background: white; color: #14532d; box-shadow: 0 2px 12px #0002; font: 13px/1.4 sans-serif; z-index: 1003; }
        #search-voice-status[data-error="true"] { color: #b91c1c; }
        @media (max-width: 768px) {
            #inline-search-container { flex: 1; width: 100%; margin-right: 0; min-height: 36px; }
            #search-tog { margin-left: auto; }
            #search-input.active { right: 42px; width: calc(100% - 42px); margin: 0; padding-right: 44px; }
            #search-microphone { right: 50px; }
        }
    `;
    document.head.append(style);
    let session = null;
    const message = (en, hi) => window.currentLanguage === 'hi' ? hi : en;
    function show(text, error = false) {
        status.textContent = text;
        status.dataset.error = String(error);
    }
    function resetButton() {
        button.disabled = false;
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', 'Start voice search');
        button.title = 'Start voice search';
        button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></svg>';
    }
    function release(s) {
        clearTimeout(s.timer);
        s.stream?.getTracks().forEach(track => track.stop());
        if (s.recorder) { s.recorder.port.onmessage = null; s.recorder.disconnect(); }
        s.source?.disconnect();
        s.mute?.disconnect();
        if (s.context && s.context.state !== 'closed') void s.context.close().catch(() => {});
    }
    function cancel() {
        if (session) { session.abort.abort(); release(session); session = null; }
        resetButton();
        show('');
    }
    function pcm(s) {
        const samples = new Float32Array(s.samples);
        let offset = 0;
        for (const chunk of s.chunks) { samples.set(chunk, offset); offset += chunk.length; }
        const ratio = s.sampleRate / 16000;
        const buffer = new ArrayBuffer(Math.floor(samples.length / ratio) * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < buffer.byteLength / 2; i++) {
            const start = Math.floor(i * ratio);
            const end = Math.min(samples.length, Math.max(start + 1, Math.floor((i + 1) * ratio)));
            let sum = 0;
            for (let j = start; j < end; j++) sum += samples[j];
            const value = Math.max(-1, Math.min(1, sum / (end - start)));
            view.setInt16(i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
        }
        return buffer;
    }
    async function finish(s) {
        if (session !== s || s.finishing) return;
        s.finishing = true;
        release(s);
        if (s.voicedMs < 200) {
            session = null;
            resetButton();
            show(message('No speech detected. Tap the microphone to try again.', 'आवाज़ नहीं मिली। दोबारा माइक्रोफ़ोन दबाएँ।'), true);
            return;
        }
        button.disabled = true;
        button.setAttribute('aria-pressed', 'false');
        show(message('Converting speech to text…', 'आवाज़ को टेक्स्ट में बदल रहा है…'));
        const deadline = setTimeout(() => s.abort.abort(), 180000);
        try {
            const response = await fetch(`/api/v1/speech/search?language=${s.language}`, {
                method: 'POST', headers: { 'Content-Type': 'application/octet-stream' },
                body: pcm(s), signal: s.abort.signal
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Speech recognition failed.');
            if (!result.text?.trim()) throw new Error('No speech recognized. Please try again.');
            if (session !== s) return;
            input.value = result.text.trim();
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            show(message('Text added. You can edit your search.', 'टेक्स्ट जोड़ दिया गया। आप इसे बदल सकते हैं।'));
        } catch (error) {
            if (session === s) show(error.name === 'AbortError'
                ? 'Transcription timed out. Please try a shorter phrase.' : error.message, true);
        } finally {
            clearTimeout(deadline);
            if (session === s) { session = null; resetButton(); }
        }
    }
    async function start() {
        if (session) return;
        if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
            show('Voice search needs a modern browser on HTTPS or localhost. You can still type your search.', true);
            return;
        }
        const s = { abort: new AbortController(), chunks: [], samples: 0, voicedMs: 0, quietMs: 0,
            language: window.currentLanguage === 'hi' ? 'hi' : 'en' };
        session = s;
        button.disabled = true;
        show(message('Allow microphone access to speak…', 'बोलने के लिए माइक्रोफ़ोन की अनुमति दें…'));
        try {
            s.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            if (session !== s) { release(s); return; }
            s.context = new AudioContext();
            await s.context.audioWorklet.addModule('/js/search-audio-worklet.js');
            if (session !== s) { release(s); return; }
            await s.context.resume();
            if (session !== s) { release(s); return; }
            s.sampleRate = s.context.sampleRate;
            s.source = s.context.createMediaStreamSource(s.stream);
            s.recorder = new AudioWorkletNode(s.context, 'search-audio-recorder');
            s.mute = s.context.createGain();
            s.mute.gain.value = 0;
            s.recorder.port.onmessage = ({ data }) => {
                if (session !== s || s.finishing) return;
                s.chunks.push(data);
                s.samples += data.length;
                let energy = 0;
                for (const sample of data) energy += sample * sample;
                const ms = data.length / s.sampleRate * 1000;
                if (Math.sqrt(energy / data.length) >= 0.015) { s.voicedMs += ms; s.quietMs = 0; }
                else s.quietMs += ms;
                if ((s.voicedMs >= 200 && s.quietMs >= 800) || s.samples / s.sampleRate >= 20) void finish(s);
            };
            s.source.connect(s.recorder).connect(s.mute).connect(s.context.destination);
            button.disabled = false;
            button.setAttribute('aria-pressed', 'true');
            button.setAttribute('aria-label', 'Stop and transcribe');
            button.title = 'Stop and transcribe';
            button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';
            show(message('Listening… pause to add your words automatically.', 'सुन रहा है… रुकने पर शब्द अपने-आप जुड़ जाएँगे।'));
            s.timer = setTimeout(() => void finish(s), 20000);
        } catch (error) {
            release(s);
            if (session !== s) return;
            session = null;
            resetButton();
            show(error.name === 'NotAllowedError' ? 'Allow microphone access, then tap the microphone to retry.'
                : error.name === 'NotFoundError' ? 'No microphone found. Connect one or type your search.'
                : 'Could not start the microphone. You can still type your search.', true);
        }
    }
    toggle.addEventListener('click', () => {
        const open = input.classList.contains('active');
        button.hidden = !open;
        if (open) void start(); else cancel();
    });
    button.addEventListener('click', () => session ? void finish(session) : void start());
    // Typing or closing search must never be overwritten by a late response.
    input.addEventListener('input', event => { if (event.isTrusted) cancel(); });
    document.addEventListener('agri:languagechange', cancel);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
    window.addEventListener('pagehide', cancel);
    resetButton();
})();
