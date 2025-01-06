
import Phaser, { Types } from 'phaser';
import { MainMenuScene } from './scenes/main-menu-scene';
import { SandboxSelectScene } from './scenes/sandbox-select-scene';
import { LevelSelectScene } from './scenes/level-select-scene';
import { GameScene } from './scenes/game-scene';
import { SimulationScene } from './scenes/simulation-scene';
import { ToolbarScene } from './scenes/toolbar-scene';

const TOOLBAR_HEIGHT = 100;

document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    }
});

const style = document.createElement('style');
style.textContent = `
    body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
    }
    #game-container {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
`;
document.head.appendChild(style);

// Create the toolbar container
const toolbarContainer = document.createElement('div');
toolbarContainer.id = 'toolbar-container';
document.body.appendChild(toolbarContainer);

const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a1a',
    scene: [
        MainMenuScene,
        SandboxSelectScene,
        LevelSelectScene,
        GameScene,
        SimulationScene,
        ToolbarScene
    ],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight
    },
    dom: {
        createContainer: true
    },
    parent: 'game-container'
};

new Phaser.Game(config);