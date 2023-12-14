import { Range } from "../../audio/fft-filter/fft-filter-common";
import FftFilterNode from "../../audio/fft-filter/fft-filter-node"
import SampleRetrieverNode from "../../audio/sample-retriever/sample-retriever-node";
import Queue from "../../audio/utilties/queue";
import url from "/assets/sample.mp3"

export default class AudioVis extends Phaser.Scene {

  canvas!: HTMLCanvasElement;
  fft_filter!: FftFilterNode;
  sample_retriever!: SampleRetrieverNode;
  rectangles: Phaser.GameObjects.Rectangle[] = [];
  
  sample_rate!: number;
  samples_per_group!: number;
  group_count: number = 1000;
  window_len_in_seconds: number = 10;
  groups! : Queue<number>;

  constructor () {
    super('game');
    this.groups = new Queue(this.group_count, true);
  }

  create (): void {

    for(let i = 0; i < this.group_count; i++) {
      this.groups.push(0);
    }

    this.canvas = this.sys.game.canvas;
    const audioContext = new AudioContext();

    const startAudio = async (context: AudioContext) => {

      await FftFilterNode.loadProcessor(context);
      await SampleRetrieverNode.loadProcessor(context);

      const audioBuffer = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer));

      const source = context.createBufferSource();
      source.buffer = audioBuffer;

      this.fft_filter = new FftFilterNode(context);
      this.sample_retriever = new SampleRetrieverNode(context);

      this.sample_rate = context.sampleRate;
      this.samples_per_group = Math.max(1, Math.floor(this.sample_rate * this.window_len_in_seconds / this.group_count));

      source.connect(this.fft_filter);
      this.fft_filter.connect(this.sample_retriever);
      this.sample_retriever.connect(context.destination);

      for(let i = 0; i < this.group_count; i++) {
        this.rectangles.push(
          this.add.rectangle(
              i * this.canvas.width / this.group_count,
              this.canvas.height / 2, 
              this.canvas.width / this.group_count, 
              0, 
              0xffffff
          )
        );
      }

      const login_form = document.getElementById("range-form");
      login_form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const range_list = document.getElementById("range-list") as HTMLInputElement;
        const ranges = range_list.value.replace(/\s+/, "").split(",").filter(e => e != "").map(e => e.split("-").map(e => parseFloat(e)));
        this.fft_filter.clear_ranges();
        for(const range of ranges) {
          this.fft_filter.add_audible_range(new Range(range[0], range[1]));
        }
      });

      source.start();

    };

    const buttonEl = document.getElementById("button-start");
    if (buttonEl != undefined) {
      buttonEl.addEventListener("click", async () => {
        await startAudio(audioContext);
        audioContext.resume();
        buttonEl.textContent = "Playing...";
      }, false);
    }

  }

  update (_time: number, _delta: number): void {

    if(!this.sample_retriever) return;

    while(this.sample_retriever.sample_buff.getSize() >= this.samples_per_group) {
      let sum = 0;
      for(let i = 0; i < this.samples_per_group; i++) {
        sum += this.sample_retriever.sample_buff.pop();
      }
      sum /= this.samples_per_group;
      this.groups.push(sum);
    }

    let i = 0;
    for(const group of this.groups) {
      this.rectangles[i].height = group * this.canvas.height / 2 / 1.25;
      this.rectangles[i].setOrigin(0, 0.5);
      i++;
    }

  }

}