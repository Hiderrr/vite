export default class AudioVis extends Phaser.Scene {

  canvas: HTMLCanvasElement;

  constructor () {
    super('game');
  }

  create (): void {
    this.canvas = this.game.canvas;

  }

  update (_time: number, _delta: number): void {
  }

}