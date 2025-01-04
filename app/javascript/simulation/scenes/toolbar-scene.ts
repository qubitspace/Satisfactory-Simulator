import { Scene } from 'phaser';
import { SimulationScene } from './simulation-scene';

export class ToolbarScene extends Scene {
    private isDraggingFactory = false;

    constructor() {
        super({ key: 'toolbar-scene', active: true });
    }

    preload(): void {
        // Create factory icon
        const size = 48;
        const factoryGraphics = this.add.graphics();
        factoryGraphics.fillStyle(0x666666);
        factoryGraphics.fillRect(0, 0, size, size);
        factoryGraphics.lineStyle(2, 0x999999);
        factoryGraphics.strokeRect(0, 0, size, size);
        factoryGraphics.generateTexture('factory-icon', size, size);
        factoryGraphics.destroy();
    }

    create(): void {
        const padding = 20;

        // Add factory tool
        const factoryIcon = this.add.image(padding + 24, 50, 'factory-icon')
            .setInteractive({ draggable: true });

        const label = this.add.text(padding + 24, 75, 'Factory', {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5, 0);

        // Handle factory dragging
        this.input.setDraggable(factoryIcon);

        factoryIcon.on('dragstart', () => {
            this.isDraggingFactory = true;
            factoryIcon.setAlpha(0.7);
        });

        factoryIcon.on('drag', (pointer: Phaser.Input.Pointer) => {
            factoryIcon.x = pointer.x;
            factoryIcon.y = pointer.y;
        });

        factoryIcon.on('dragend', (pointer: Phaser.Input.Pointer) => {
            this.isDraggingFactory = false;
            factoryIcon.setAlpha(1);

            // Reset position
            factoryIcon.x = padding + 24;
            factoryIcon.y = 50;

            // Get the simulation scene and create factory if dragged into game area
            const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
            const worldPoint = simulationScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            simulationScene.createFactory(worldPoint.x, worldPoint.y);
        });
    }
}