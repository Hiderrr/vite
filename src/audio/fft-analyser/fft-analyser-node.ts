import workerUrl from "./fft-analyser-processor?worker&url"

export default class AudioAnalyserNode extends AudioWorkletNode {

  // buff_newest_samples

  constructor(context: AudioContext) {
    super(context, "fft-analyser");
  }

  static loadProcessor(context: AudioContext) {
    return context.audioWorklet.addModule(workerUrl);
  }

}