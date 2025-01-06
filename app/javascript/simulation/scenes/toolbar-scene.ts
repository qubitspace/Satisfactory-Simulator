import { SimulationScene } from './simulation-scene';

interface ToolbarConfig {
    toolbarHeight: number;
    yPosition: number;
}

export class ToolbarScene extends Phaser.Scene {
    private isDraggingFactory = false;
    private toolbarHeight: number = 100;
    private yPosition: number = 0;

    constructor() {
        super({ key: 'toolbar-scene' });
    }

    init(config: ToolbarConfig): void {
        this.toolbarHeight = config.toolbarHeight;
        this.yPosition = config.yPosition;
    }

    create(): void {
        const padding = 20;

        // Create a background for the toolbar
        this.add.rectangle(0, this.yPosition, window.innerWidth, this.toolbarHeight, 0x2a2a2a)
            .setOrigin(0, 0);

        // Add factory tool
        const factoryIcon = this.add.image(padding + 24, this.yPosition + this.toolbarHeight/2, 'factory-icon')
            .setInteractive({ draggable: true });

        const label = this.add.text(padding + 24, this.yPosition + this.toolbarHeight - 25, 'Factory', {
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
            factoryIcon.y = this.yPosition + this.toolbarHeight/2;

            // Get the simulation scene and create factory if dragged into game area
            const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
            const worldPoint = simulationScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            simulationScene.createFactory(worldPoint.x, worldPoint.y);
        });

        // Listen for resize events from the game scene
        this.events.on('resize', (data: ToolbarConfig) => {
            this.toolbarHeight = data.toolbarHeight;
            this.yPosition = data.yPosition;
            this.handleResize();
        });
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

    private handleResize(): void {
        // Update toolbar background
        const rectangles = this.children.list.filter(child => child instanceof Phaser.GameObjects.Rectangle);
        const bg = rectangles[0] as Phaser.GameObjects.Rectangle;
        if (bg) {
            bg.setPosition(0, this.yPosition);
            bg.setSize(window.innerWidth, this.toolbarHeight);
        }

        // Update factory icon and label
        const icons = this.children.list.filter(child => child instanceof Phaser.GameObjects.Image);
        const factoryIcon = icons[0] as Phaser.GameObjects.Image;
        if (factoryIcon) {
            factoryIcon.setPosition(factoryIcon.x, this.yPosition + this.toolbarHeight/2);
        }

        const texts = this.children.list.filter(child => child instanceof Phaser.GameObjects.Text);
        const label = texts[0] as Phaser.GameObjects.Text;
        if (label) {
            label.setPosition(label.x, this.yPosition + this.toolbarHeight - 25);
        }
    }
}