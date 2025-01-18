// /app/javascript/simulation/scenes/toolbar-scene.ts

import { SimulationScene } from './simulation-scene';
import GameData from '../types';

interface ToolbarConfig {
    toolbarHeight: number;
    yPosition: number;
}

interface FactoryIcon extends Phaser.GameObjects.Image {
    machineType: string;
}

export class ToolbarScene extends Phaser.Scene {
    private isDraggingFactory = false;
    private toolbarHeight: number = 100;
    private yPosition: number = 0;
    private gameData: GameData;

    constructor() {
        super({ key: 'toolbar-scene' });
        this.gameData = GameData.getInstance();
    }

    init(config: ToolbarConfig): void {
        this.toolbarHeight = config.toolbarHeight;
        this.yPosition = config.yPosition;
    }

    create(): void {
        const padding = 20;
        const iconSize = 48;
        const spacing = 60;
        let currentX = padding;

        // Create a background for the toolbar
        this.add.rectangle(0, this.yPosition, window.innerWidth, this.toolbarHeight, 0x2a2a2a)
            .setOrigin(0, 0);

        // Get all available machines
        const machines = this.gameData.getAllMachines();

        // Create an icon for each machine type
        machines.forEach((machine, index) => {
            // Create factory icon
            const factoryIcon = this.createFactoryIcon(
                currentX + iconSize/2,
                this.yPosition + this.toolbarHeight/2,
                machine.name,
                iconSize
            );

            // Add label below icon
            this.add.text(currentX + iconSize/2, this.yPosition + this.toolbarHeight - 25, machine.name, {
                fontSize: '12px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0);

            // Update position for next icon
            currentX += iconSize + spacing;
        });

        // Listen for resize events
        this.events.on('resize', (data: ToolbarConfig) => {
            this.toolbarHeight = data.toolbarHeight;
            this.yPosition = data.yPosition;
            this.handleResize();
        });
    }

    private createFactoryIcon(x: number, y: number, machineType: string, size: number): FactoryIcon {
        // Create unique texture key for this machine type
        const textureKey = `factory-icon-${machineType.toLowerCase().replace(/\s+/g, '-')}`;

        // Generate texture if it doesn't exist
        if (!this.textures.exists(textureKey)) {
            const graphics = this.add.graphics();

            // Draw basic factory shape
            graphics.fillStyle(0x666666);
            graphics.fillRect(0, 0, size, size);
            graphics.lineStyle(2, 0x999999);
            graphics.strokeRect(0, 0, size, size);

            // Add visual indicators for inputs/outputs
            const machine = this.gameData.getMachine(machineType);
            if (machine) {
                const markerSize = 4; // Smaller markers for toolbar icons

                // Draw input markers on left side - compact view
                const inputSpacing = size / (machine.inputCount + 1);
                for (let i = 1; i <= machine.inputCount; i++) {
                    graphics.fillStyle(0x3333ff);
                    graphics.fillRect(0, i * inputSpacing, markerSize, markerSize);
                }

                // Draw output markers on right side - compact view
                const outputSpacing = size / (machine.outputCount + 1);
                for (let i = 1; i <= machine.outputCount; i++) {
                    graphics.fillStyle(0xff3333);
                    graphics.fillRect(size - markerSize, i * outputSpacing, markerSize, markerSize);
                }
            }

            graphics.generateTexture(textureKey, size, size);
            graphics.destroy();

            // Add text after generating the base texture
            const text = this.add.text(x, y, `${machine?.inputCount}→${machine?.outputCount}`, {
                fontSize: '10px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        }

        // Create the icon with the generated texture
        const icon = this.add.image(x, y, textureKey).setInteractive({ draggable: true }) as FactoryIcon;
        icon.machineType = machineType;

        // Setup drag events
        this.setupDragEvents(icon);

        return icon;
    }

    private setupDragEvents(icon: FactoryIcon): void {
        const startPosition = { x: icon.x, y: icon.y };

        icon.on('dragstart', () => {
            this.isDraggingFactory = true;
            icon.setAlpha(0.7);
        });

        icon.on('drag', (pointer: Phaser.Input.Pointer) => {
            icon.x = pointer.x;
            icon.y = pointer.y;
        });

        icon.on('dragend', (pointer: Phaser.Input.Pointer) => {
            this.isDraggingFactory = false;
            icon.setAlpha(1);

            // Reset position
            icon.x = startPosition.x;
            icon.y = startPosition.y;

            // Get the simulation scene and create factory
            const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
            const worldPoint = simulationScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            simulationScene.createFactory(worldPoint.x, worldPoint.y, icon.machineType);
        });
    }

    private handleResize(): void {
        // Update toolbar background
        const rectangles = this.children.list.filter(child => child instanceof Phaser.GameObjects.Rectangle);
        const bg = rectangles[0] as Phaser.GameObjects.Rectangle;
        if (bg) {
            bg.setPosition(0, this.yPosition);
            bg.setSize(window.innerWidth, this.toolbarHeight);
        }

        // Update positions of all factory icons and labels
        const icons = this.children.list.filter(child => child instanceof Phaser.GameObjects.Image) as Phaser.GameObjects.Image[];
        const texts = this.children.list.filter(child => child instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[];

        icons.forEach((icon, index) => {
            icon.setPosition(icon.x, this.yPosition + this.toolbarHeight/2);
            if (texts[index]) {
                texts[index].setPosition(texts[index].x, this.yPosition + this.toolbarHeight - 25);
            }
        });
    }
}