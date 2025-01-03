import Phaser, { Types } from 'phaser';
import { SimulationScene } from "./scenes/simulation-scene";
import { ToolboxScene } from './scenes/toolbox-scene';

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
    scene: [SimulationScene, ToolboxScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    parent: 'game-container'
};

new Phaser.Game(config);