import Phaser, { Types } from 'phaser';
import { SimulationScene } from "./scenes/simulation-scene";
import { ToolbarScene } from './scenes/toolbar-scene';

const TOOLBAR_HEIGHT = 100;

// Prevent context menu on the game container specifically
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
        position: relative;
        width: 100vw;
        height: calc(100vh - ${TOOLBAR_HEIGHT}px);
        overflow: hidden;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
    #toolbar-container {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: ${TOOLBAR_HEIGHT}px;
        background-color: #2a2a2a;
        border-top: 1px solid #3a3a3a;
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
    height: window.innerHeight - TOOLBAR_HEIGHT,
    backgroundColor: '#1a1a1a',
    scene: [SimulationScene, ToolbarScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    },
    parent: 'game-container'
};

new Phaser.Game(config);