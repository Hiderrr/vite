import workerPath from "./sussy/fft-filter?worker&url";
import { Range } from "./sussy/fft-filter-common";
import url from "../assets/sample.mp3"

console.log(workerPath);
const audioContext = new AudioContext();

const startAudio = async (context: AudioContext) => {

  await context.audioWorklet.addModule(workerPath)
  const audioBuffer = await fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => context.decodeAudioData(buffer));

  const source = context.createBufferSource();
  source.buffer = audioBuffer;

  const filter_node = new AudioWorkletNode(context, "fft-filter");
  filter_node.port.postMessage({
    audible_ranges: [ new Range(0, 1000), new Range(3000, 4000) ]
  })

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