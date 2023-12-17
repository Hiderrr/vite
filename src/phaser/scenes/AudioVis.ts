import { Range } from "../../audio/fft-filter/fft-filter-common";
import { FFT_SIZE } from "../../audio/fft-filter/fft-filter-common";
import FftFilterNode from "../../audio/fft-filter/fft-filter-node"
import SampleRetrieverNode, { NUM_SAMPLES } from "../../audio/sample-retriever/sample-retriever-node";
import Queue from "../../audio/utilties/queue";

export default class AudioVis extends Phaser.Scene {

  audio_context!: AudioContext | null;
  canvas!: HTMLCanvasElement;
  fft_filter!: FftFilterNode;
  sample_retriever!: SampleRetrieverNode;
  rectangles: Phaser.GameObjects.Rectangle[] = [];
  rectangles2: Phaser.GameObjects.Rectangle[] = [];
  
  sample_rate!: number;
  samples_per_group!: number;
  group_count: number = 256;
  graph_scale: number = NaN;
  stuff_updated: boolean = false;
  ranges: number[][] = [[]]
  window_len_in_seconds: number = NaN;
  groups! : Queue<number>;
  filename: string = "whistle2.wav";
  playing: boolean = false;

  constructor () {
    super('game');
  }

  update_samples_per_group() {
    this.samples_per_group = Math.max(1, Math.floor(this.sample_rate * this.window_len_in_seconds / this.group_count));
  }

  set_window_time_len(len: number) {
    this.window_len_in_seconds = len;
    this.update_samples_per_group();
  }

  parse_stuff() {
    this.filename = (document.getElementById("file-name") as HTMLInputElement).value;
    this.graph_scale = parseFloat((document.getElementById("graph-scale") as HTMLInputElement).value);
    this.ranges = (document.getElementById("range-list") as HTMLInputElement).value.replace(/\s+/, "").split(",").filter(e => e != "").map(e => e.split("-").map(e => parseFloat(e)));
    this.stuff_updated = true;
  }

  update_stuff() {
    if(!this.stuff_updated) return;
    this.set_window_time_len(parseFloat((document.getElementById("time-window") as HTMLInputElement).value));
    this.fft_filter.clear_ranges();
    for(const range of this.ranges) {
      this.fft_filter.add_audible_range(new Range(range[0], range[1]));
    }
  }

  create (): void {

    this.canvas = this.sys.game.canvas;
    this.group_count = this.canvas.width;
    this.groups = new Queue(this.group_count, true);
    for(let i = 0; i < this.group_count; i++) {
      this.groups.push(0);
    }

    const startAudio = async () => {

      this.parse_stuff();

      this.audio_context = new AudioContext();
      await FftFilterNode.loadProcessor(this.audio_context);
      await SampleRetrieverNode.loadProcessor(this.audio_context);

      const audioBuffer = await fetch("/vite/" + this.filename)
        .then(res => res.arrayBuffer())
        .then(buffer => this.audio_context!.decodeAudioData(buffer));

      const source = this.audio_context.createBufferSource();
      source.buffer = audioBuffer;

      this.playing = true;
      source.onended = () => {
        this.playing = false;
        this.audio_context!.close().then(() => {
          document.getElementById("button-start")!.textContent = "Click me to play!";
        })
      }

      this.fft_filter = new FftFilterNode(this.audio_context);
      this.sample_retriever = new SampleRetrieverNode(this.audio_context);

      this.sample_rate = this.audio_context.sampleRate;
      this.samples_per_group = Math.max(1, Math.floor(this.sample_rate * this.window_len_in_seconds / this.group_count));

      source.connect(this.fft_filter);
      this.fft_filter.connect(this.audio_context.destination);
      this.fft_filter.connect(this.sample_retriever);

      this.update_stuff();

      for(let i = 0; i < NUM_SAMPLES; i++) {
        this.sample_retriever.sample_buff.push(0);
      }

      source.start();

    };

    for(let i = 0; i < this.group_count; i++) {
      this.rectangles.push(
        this.add.rectangle(
            i * this.canvas.width / this.group_count,
            this.canvas.height / 4, 
            this.canvas.width / this.group_count, 
            0, 
            0xffffff
        )
      );
    }

    for(let i = 0; i < FFT_SIZE / 2; i++) {
      this.rectangles2.push(
        this.add.rectangle(
            i * this.canvas.width / FFT_SIZE * 2,
            this.canvas.height / 2, 
            this.canvas.width / FFT_SIZE * 2, 
            0, 
            0xfffff0
        )
      );
    }

    const login_form = document.getElementById("range-form");
    login_form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.parse_stuff();
      this.update_stuff();
    });

    const buttonEl = document.getElementById("button-start");
    if (buttonEl != undefined) {
      buttonEl.addEventListener("click", async () => {
        if(this.playing) {
          this.playing = false;
          await this.audio_context!.close();
          this.audio_context = null;
          buttonEl.textContent = "Click me to play!";
        }
        else {
          await startAudio();
          this.audio_context!.resume();
          buttonEl.textContent = "Playing...";
        }
      }, false);
    }

  }

  update (_time: number, _delta: number): void {

    if(!this.sample_retriever) return;

    const real = this.fft_filter.real;
    const imag = this.fft_filter.imag;

    if(real && imag) {
      let maxim = Math.log10(real[0]*real[0] + imag[0]*imag[0]);
      for(let i = 1; i < FFT_SIZE / 2; i++) {
        maxim = Math.max(maxim, Math.log10(real[i]*real[i] + imag[i]*imag[i]));
      }
      for(let i = 0; i < FFT_SIZE / 2; i++) {
        this.rectangles2[i].height = Math.log10(real[i]*real[i] + imag[i]*imag[i]) * this.canvas.height / maxim / 2;
        if(this.rectangles2[i].height > this.canvas.height / 2) {
          this.rectangles2[i].height = 0;
        }
        this.rectangles2[i].y = this.canvas.height - this.rectangles2[i].height;
        this.rectangles2[i].setOrigin(0, 0);
      }
    }

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
      this.rectangles[i].height = group * this.canvas.height / 4 * this.graph_scale;
      this.rectangles[i].setOrigin(0, 0.5);
      i++;
    }

  }

}