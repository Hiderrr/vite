class AudioAnalyser extends AudioWorkletProcessor {

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {

    const input_channels = inputs[0], output_channels = outputs[0];

    for(let channel = 0; channel < input_channels.length; channel++) {
      const n = input_channels[channel].length;
      for(let i = 0; i < n; i++) {
        output_channels[channel][i] = input_channels[channel][i];
      }
    }
  
    return false;
  }

}

registerProcessor("fft-analyser", AudioAnalyser);