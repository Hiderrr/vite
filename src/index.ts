import workerPath from "./sussy/fft-filter?worker&url";
import { FftFilterMessageEventData, Range } from "./sussy/fft-filter-common";
import url from "../assets/sample.mp3"

class FftFilterNode extends AudioWorkletNode {

  audible_ranges: Range[] = [];

  constructor(context: AudioContext) {
    super(context, "fft-filter");
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

}

const audioContext = new AudioContext();

const startAudio = async (context: AudioContext) => {

  await context.audioWorklet.addModule(workerPath)
  const audioBuffer = await fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => context.decodeAudioData(buffer));

  const source = context.createBufferSource();
  source.buffer = audioBuffer;

  const filter_node = new FftFilterNode(context);
  
  // low pass automation
  filter_node.add_audible_range(new Range(-1, -1));
  function f(x: number) {
    filter_node.delete_audible_range(0);
    filter_node.add_audible_range(new Range(0, x));
    x -= 100;
    setTimeout(f, 100, x);
  }
  f(11050);

  source.connect(filter_node);
  filter_node.connect(context.destination);
  source.start();

};

window.addEventListener("load", async () => {
  const buttonEl = document.getElementById("button-start");
  if (buttonEl != undefined) {
    buttonEl.addEventListener("click", async () => {
      await startAudio(audioContext);
      audioContext.resume();
      buttonEl.textContent = "Playing...";
    }, false);
  }
});