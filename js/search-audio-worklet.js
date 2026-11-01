// Keep audio capture off the UI thread. Resampling happens after recording.
class SearchAudioRecorder extends AudioWorkletProcessor {
    process(inputs) {
        const channel = inputs[0]?.[0];
        if (channel) this.port.postMessage(channel.slice());
        return true;
    }
}
registerProcessor('search-audio-recorder', SearchAudioRecorder);
