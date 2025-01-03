// app/javascript/simulation/scenes/toolbox-scene.ts
import { Scene } from 'phaser';
import { SimulationScene } from "./simulation-scene";

export class ToolboxScene extends Scene {
    private panel!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'toolbox-scene', active: true });
    }

    preload(): void {
        // We'll need a factory icon - for now let's create a placeholder
        const factorySize = 48;
        const graphics = this.add.graphics();
        graphics.fillStyle(0x666666);
        graphics.fillRect(0, 0, factorySize, factorySize);
        graphics.lineStyle(2, 0x999999);
        graphics.strokeRect(0, 0, factorySize, factorySize);
        graphics.generateTexture('factory-icon', factorySize, factorySize);
        graphics.destroy();
    }

    create(): void {
        const x = this.game.scale.width / 2;
        const y = this.game.scale.height - 80;

        // Create floating panel
        this.panel = this.add.container(x, y);

        // Panel background
        const bg = this.add.rectangle(0, 0, 80, 120, 0x333333, 0.8);
        bg.setStrokeStyle(1, 0x666666);

        // Factory icon that can be dragged
        const factoryIcon = this.add.image(0, 0, 'factory-icon')
            .setInteractive({ draggable: true });

        this.panel.add([bg, factoryIcon]);

        // Factory Dragging
        this.input.setDraggable(factoryIcon);

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
            gameObject.x = pointer.x - this.panel.x;
            gameObject.y = pointer.y - this.panel.y;
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
            // Only create factory if dragged away from panel
            if (pointer.y < this.panel.y - 50) { // Some threshold
                const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
                const worldPoint = simulationScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                simulationScene.createFactory(worldPoint.x, worldPoint.y);
            }

            // Reset UI icon position
            gameObject.x = 0;
            gameObject.y = 0;
        });


        // Make UI panel stay in position when window resizes
        this.scale.on('resize', this.updatePanelPosition, this);
    }

    private updatePanelPosition(): void {
        if (this.panel) {
            this.panel.setPosition(
                this.game.scale.width / 2,
                this.game.scale.height - 80
            );
        }
    }
}