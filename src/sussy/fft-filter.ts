import { transform, inverseTransform } from "./fft";

class FFtFilter extends AudioWorkletProcessor {

  constructor() {
    super();
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0], output = outputs[0];
    for(let channel = 0; channel < input.length; channel++) {

      const fft_size = input[channel].length;
      const in_samples_real = Float64Array.from(input[channel]);
      const in_samples_imag = new Float64Array(fft_size).fill(0);
      const out_samples = output[channel];
      
      transform(in_samples_real, in_samples_imag);
      const max_freq = 1000;

      for(let i = 0; i < fft_size; i++) {
        if(i * sampleRate / fft_size > max_freq) {
          in_samples_imag[i] = in_samples_real[i] = 0;
        }
      }

      inverseTransform(in_samples_real, in_samples_imag);

      for(let i = 0; i < fft_size; i++) {
        out_samples[i] = in_samples_real[i] / fft_size;
      }

    }
    return true;
  }


}

registerProcessor("fft-filter", FFtFilter);