
import Phaser, { Types } from 'phaser'
import { MainMenuScene } from './scenes/MainMenuScene'
import { GameScene } from './scenes/GameScene'
import { SimulationScene } from './scenes/SimulationScene'
import { ToolbarScene } from './scenes/ToolbarScene'

document.addEventListener('DOMContentLoaded', () => {
    // (A) Create any DOM logic you want
    const gameContainer = document.getElementById('game-container')
    if (gameContainer) {
        gameContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault()
            return false
        })
    }

    // (B) Build our Phaser config
    const config: Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#1a1a1a',
        scene: [
            MainMenuScene,
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
        dom: { createContainer: true },
        parent: 'game-container'
    }

    // (C) Insert a <style> to handle full screen container
    const style = document.createElement('style')
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
  `
    document.head.appendChild(style)

    // (D) Optionally create a toolbar container
    const toolbarContainer = document.createElement('div')
    toolbarContainer.id = 'toolbar-container'
    document.body.appendChild(toolbarContainer)

    // (E) Create the Phaser game instance
    const game = new Phaser.Game(config)

})