
import Phaser, { Types } from 'phaser'
import { MainMenuScene } from './scenes/main-menu-scene'
import { SandboxSelectScene } from './scenes/sandbox-select-scene'
import { LevelSelectScene } from './scenes/level-select-scene'
import { GameScene } from './scenes/game-scene'
import { SimulationScene } from './scenes/simulation-scene'
import { ToolbarScene } from './scenes/toolbar-scene'

export function updateUrlParam(key: string, value: string) {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.replaceState({}, '', url.toString())
}

function getUrlParam(name: string): string | null {
    const params = new URLSearchParams(window.location.search)
    return params.get(name)
}

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
            // We can list all scenes here
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

    // (F) Check if the URL has ?saveName=...
    const saveName = getUrlParam('saveName')
    if (saveName) {
        // Skip the main menu, jump straight to game-scene in sandbox mode:
        // This passes { mode: 'sandbox', saveName } to your GameScene.init()
        console.log('Starting game with save:', saveName)
        game.scene.start('game-scene', { mode: 'sandbox', saveName })
    } else {
        console.log('No saveName found in URL')
        // If no saveName, start main menu as usual (if your main menu isn't already auto-started)
        // If your default scene is main-menu, you might not need this line at all
        game.scene.start('main-menu')
    }
})