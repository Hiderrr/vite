/**
 * Game entry point
 */

import Phaser from 'phaser'; // loading Phaser
import PhaserStatsGame from "./classes/PhaserStatsGame";

import { size } from './game.config';

import Boot from './scenes/Boot';
import Preloader from './scenes/Preloader';
import Game from './scenes/Game';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'container', // parent id - '' means  no container
    width: size.w,
    height: size.h,
    scene: [
        Boot,
        Preloader,
        Game
    ]
};

export default function start_game() {
  new PhaserStatsGame(config);
}