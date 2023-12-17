const REFRESH_COUNT = 60;

class SampleRetrieverProcessor extends AudioWorkletProcessor {

  prev_time = currentTime;
  sample_chunks: Float32Array[] = [];

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    
    // treating input as mono and posting it to the worklet
    this.sample_chunks.push(inputs[0][0]);

    while(currentTime - this.prev_time > 1 / REFRESH_COUNT) {
      this.port.postMessage(this.sample_chunks);
      this.sample_chunks.splice(0, this.sample_chunks.length);
      this.prev_time = currentTime;
    }

    return true;

  }

}

registerProcessor("sample-retriever", SampleRetrieverProcessor);