const REFRESH_COUNT = 60;

class SampleRetrieverProcessor extends AudioWorkletProcessor {

  prev_time = currentTime;
  sample_chunks: Float32Array[] = [];

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {

    const input_channels = inputs[0], output_channels = outputs[0];

    for(let channel = 0; channel < input_channels.length; channel++) {
      const n = input_channels[channel].length;
      for(let i = 0; i < n; i++) {
        output_channels[channel][i] = input_channels[channel][i];
      }
    }
    
    // treating input as mono and posting it to the worklet
    this.sample_chunks.push(inputs[0][0]);

    while(currentTime - this.prev_time > 1 / REFRESH_COUNT) {
      this.port.postMessage(this.sample_chunks);
      this.sample_chunks.splice(0, this.sample_chunks.length);
      this.prev_time = currentTime;
    }

    return false;

  }

}

registerProcessor("sample-retriever", SampleRetrieverProcessor);