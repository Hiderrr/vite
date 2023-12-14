import start_game from "./phaser/game";
import FftFilterNode from "./audio/fft-filter/fft-filter-node"
import url from "/assets/sample.mp3"
import FftAnalyserNode from "./audio/fft-analyser/fft-analyser-node";
start_game();

const audioContext = new AudioContext();

const startAudio = async (context: AudioContext) => {

  await FftFilterNode.loadProcessor(context);
  await FftAnalyserNode.loadProcessor(context);

  const audioBuffer = await fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => context.decodeAudioData(buffer));

  const source = context.createBufferSource();
  source.buffer = audioBuffer;

  const fft_filter = new FftFilterNode(context);
  const fft_analyser = new FftAnalyserNode(context);

  source.connect(fft_filter);
  fft_filter.connect(fft_analyser);
  fft_analyser.connect(context.destination);
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