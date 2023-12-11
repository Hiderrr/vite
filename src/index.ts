import workerPath from "./fft-filter?worker&url";
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

  setInterval(() => filter_node.port.postMessage("ping"), 1000);
  filter_node.port.onmessage = (e) => console.log(e.data);

  source.connect(filter_node);
  filter_node.connect(context.destination);
  source.start();

};

// A simplem onLoad handler. It also handles user gesture to unlock the audio
// playback.

window.addEventListener("load", async () => {
  const buttonEl = document.getElementById("button-start");
  if(buttonEl != undefined) {
    buttonEl.addEventListener("click", async () => {
      await startAudio(audioContext);
      audioContext.resume();
      buttonEl.textContent = "Playing...";
    }, false);
  }    
});