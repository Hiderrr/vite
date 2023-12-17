const REFRESH_COUNT = 60;
class SampleRetrieverProcessor extends AudioWorkletProcessor {
  prev_time = currentTime;
  sample_chunks = [];
  process(inputs, outputs, parameters) {
    this.sample_chunks.push(inputs[0][0]);
    while (currentTime - this.prev_time > 1 / REFRESH_COUNT) {
      this.port.postMessage(this.sample_chunks);
      this.sample_chunks.splice(0, this.sample_chunks.length);
      this.prev_time = currentTime;
    }
    return true;
  }
}
registerProcessor("sample-retriever", SampleRetrieverProcessor);
