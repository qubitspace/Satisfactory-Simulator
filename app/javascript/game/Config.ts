import Phaser from "phaser"
import { MenuScene } from "./scenes/MenuScene"
import { WorkbenchScene } from "./scenes/WorkbenchScene"

export const launchGame = (containerId: string): Phaser.Game => {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerId,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#1a1a1a', // Dark background for factory vibe
        scale: {
            mode: Phaser.Scale.RESIZE, // Auto-resize with window
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        // We load our scenes here. The first one in the array starts automatically.
        scene: [MenuScene, WorkbenchScene],
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        }
    };

    return new Phaser.Game(config);
}