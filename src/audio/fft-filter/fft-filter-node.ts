import { FftFilterMessageEventData, Range } from "./fft-filter-common";
import workerUrl from "./fft-filter-processor?worker&url"

export default class FftFilterNode extends AudioWorkletNode {

  audible_ranges: Range[] = [];

  constructor(context: AudioContext) {
    super(context, "fft-filter");
  }

  clear_ranges() {
    this.audible_ranges.splice(0, this.audible_ranges.length);
    this.port.postMessage({ audible_ranges: this.audible_ranges } as FftFilterMessageEventData);
  }

  add_audible_range(range: Range) {
    this.audible_ranges.push(range);
    this.port.postMessage({ audible_ranges: this.audible_ranges } as FftFilterMessageEventData);
  }

  delete_audible_range(index: number) {
    if(this.audible_ranges.length <= index) {
      throw new Error(`Index ${index} out of bound!`);
    }
    this.audible_ranges.splice(index, 1);
    this.port.postMessage({ audible_ranges: this.audible_ranges } as FftFilterMessageEventData);
  }

  static loadProcessor(context: AudioContext) {
    return context.audioWorklet.addModule(workerUrl);
  }

}