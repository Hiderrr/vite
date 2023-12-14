import workerUrl from "./sample-retriever-processor?worker&url"
import Queue from "../utilties/queue";

export const NUM_SAMPLES = 192000;

export default class SampleRetrieverNode extends AudioWorkletNode {

  sample_buff: Queue<number> = new Queue<number>(NUM_SAMPLES, true);

  constructor(context: AudioContext) {
    super(context, "sample-retriever");

    this.port.onmessage = (event) => {
      const sample_chunks = event.data as Float32Array[];
      for(let i = 0; i < sample_chunks.length; i++) {
        for(let j = 0; j < sample_chunks[i].length; j++) {
          this.sample_buff.push(sample_chunks[i][j]);
        }
      }
    };

  }

  static loadProcessor(context: AudioContext) {
    return context.audioWorklet.addModule(workerUrl);
  }

}