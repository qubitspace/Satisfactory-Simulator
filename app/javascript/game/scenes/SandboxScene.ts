import Phaser from "phaser"
import { CoreGameScene } from "./CoreGameScene"

export class SandboxScene extends CoreGameScene {

    constructor() {
        // Pass the key 'SandboxScene' to the parent
        super('SandboxScene');
    }

    create() {
        // 1. Initialize the Core (Grid, Camera, Inputs)
        super.create();

        console.log("Sandbox Mode Initialized");

        // 2. Add Sandbox-Specific UI
        this.createOverlay();
    }

    private createOverlay() {
        const uiText = this.add.text(10, 10, 'MODE: SANDBOX\nControls:\n- Drag to Pan\n- Scroll to Zoom', {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#00ff00',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 10 }
        }).setScrollFactor(0); // Sticks to screen
    }
}