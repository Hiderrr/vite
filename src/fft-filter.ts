import { rfft } from "kissfft-wasm";

class FFtFilter extends AudioWorkletProcessor {

  constructor() {
    super();
    console.log(rfft);
    this.port.onmessage = (e) => {
      console.log(e.data);
      this.port.postMessage("pong");
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0], output = outputs[0];
    for(let i = 0; i < input.length; i++) {
      for(let j = 0; j < input[i].length; j++) {
        output[i][j] = input[i][j];
      }
    }
    return true;
  }


}

registerProcessor("fft-filter", FFtFilter);