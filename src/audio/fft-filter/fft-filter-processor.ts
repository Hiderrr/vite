import { transform, inverseTransform } from "../utilties/fft";
import { Range, FftFilterMessageEventData } from "./fft-filter-common";
import { hann } from "../utilties/fft-windowing";
import Queue from "../utilties/queue"
import { FFT_SIZE } from "./fft-filter-common";

if((FFT_SIZE & (FFT_SIZE - 1)) === (FFT_SIZE - 1) && FFT_SIZE > 1) {
  throw new Error(`FFT_SIZE=${FFT_SIZE} is not a power of two!`);
}

class FFtFilterProcessor extends AudioWorkletProcessor {

  // actual filter settings
  audible_ranges: Range[] = [];

  // fft things
  real = new Float64Array(FFT_SIZE);
  imag = new Float64Array(FFT_SIZE).fill(0);
  last_iteration = new Float64Array(FFT_SIZE / 2).fill(0);

  prev_time: number = 0;

  // buffer of samples waiting for fft
  buff = new Queue<number>(5 * FFT_SIZE, true); // big max size limit, so that I don't have to think

  // buffer of ready samples waiting to be fed to Web Audio
  ready = new Queue<number>(5 * FFT_SIZE, true); // same here
  
  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent) => {
      const fft_data = event.data as FftFilterMessageEventData;
      if(fft_data.audible_ranges) {
        this.audible_ranges = fft_data.audible_ranges;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {

    // treat input signal as mono (it's just easier lmao)
    if(inputs.length === 0) return false;
    if(inputs[0].length === 0) return false;
    const input_channel = inputs[0][0];
    const n = input_channel.length;

    // appennd new samples to buffer
    for(let i = 0; i < n; i++) {
      this.buff.push(input_channel[i]);
    }
 
    // if we got enough samples buffered, we can do an FFT
    while(this.buff.getSize() >= FFT_SIZE) {
  
      for(let i = 0; i < FFT_SIZE / 2; i++) {
        this.real[i] = this.buff.pop();
        this.imag[i] = 0;
      }
  
      {
        let i = 0;
        for(const sample of this.buff) {
          this.real[FFT_SIZE / 2 + i] = sample;
          this.imag[FFT_SIZE / 2 + i] = 0;
          if((++i) >= FFT_SIZE / 2) break;
        }
      }

      // hanning time domain data
      hann(this.real); /*this.imag is already hanned (all zeros)*/

      // performing fft converting this.real and this.imag from time domain into frequnecy domain
      transform(this.real, this.imag);

      // filtering unwanted frequencies
      for(let i = 0; i < FFT_SIZE; i++) {

        const audio_freq = i * sampleRate / FFT_SIZE;
        let found = (this.audible_ranges.length === 0);
        
        for(const r of this.audible_ranges) {
          if(audio_freq >= r.start && audio_freq <= r.end) {
            found = true; break;
          }
        }

        if(!found) {
          this.real[i] = this.imag[i] = 0;
        }

      }

      if(currentTime - this.prev_time > 1 / 60) {
        this.port.postMessage({ real: this.real.subarray(0, FFT_SIZE / 2), imag: this.imag.subarray(0, FFT_SIZE / 2) });
        this.prev_time = currentTime;
      }
      
      // performing inverse fft
      inverseTransform(this.real, this.imag);

      // pushing newly created ready samples
      for(let i = 0; i < FFT_SIZE / 2; i++) {
        const hanned_sample = this.last_iteration[i] + this.real[i] / FFT_SIZE;
        this.ready.push(hanned_sample);
      }

      // saving overlapping results for the next iteration
      for(let i = 0; i < FFT_SIZE / 2; i++) {
        this.last_iteration[i] = this.real[FFT_SIZE / 2 + i] / FFT_SIZE;
      }

    }

    // writing output samples from `ready` buffer
    for(let i = 0; i < n; i++) {
      for(let k = 0; k < outputs.length; k++) {
        const sample = (this.ready.isEmpty() ? 0 : this.ready.pop());
        for(let channel = 0; channel < outputs[k].length; channel++) {
          outputs[k][channel][i] = sample;
        }
      }
    }

    return true;

  }

}

registerProcessor("fft-filter", FFtFilterProcessor);