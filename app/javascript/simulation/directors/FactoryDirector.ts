// FactoryDirector.ts

import Phaser from 'phaser';
import GameData from '../types';

export interface Factory extends Phaser.GameObjects.Container {
    id: string;
    baseSprite: Phaser.GameObjects.Rectangle;
    inputMarkers: Phaser.GameObjects.Container[];
    outputMarkers: Phaser.GameObjects.Container[];
    isSelected: boolean;
    targetRecipe?: string;
    machineCount: number;
    overclockPercentage: number;
    isSomerslooped: boolean;
}

export class FactoryDirector {
    private scene: Phaser.Scene;
    private factories: Factory[] = [];
    private selectedFactory: Factory | null = null;
    private readonly GRID_SIZE = 64;
    private readonly MARKER_SIZE = 32;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public initialize(): void {
        this.setupInputHandlers();
    }

    private createInputMarker(x: number, y: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);

        // Create the orange square background
        const square = this.scene.add.rectangle(0, 0, this.MARKER_SIZE, this.MARKER_SIZE, 0xFFA500);
        container.add(square);

        // Create arrow pointing right (towards factory)
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, 0x000000);  // Black arrow

        // Draw arrow
        graphics.beginPath();
        graphics.moveTo(-this.MARKER_SIZE/4, 0);  // Start from left side
        graphics.lineTo(this.MARKER_SIZE/4, 0);   // Line to right side
        graphics.moveTo(0, -this.MARKER_SIZE/4);  // Top of arrowhead
        graphics.lineTo(this.MARKER_SIZE/4, 0);   // Right point of arrowhead
        graphics.lineTo(0, this.MARKER_SIZE/4);   // Bottom of arrowhead
        graphics.strokePath();

        container.add(graphics);
        return container;
    }

    private createOutputMarker(x: number, y: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);

        // Create the blue square background
        const square = this.scene.add.rectangle(0, 0, this.MARKER_SIZE, this.MARKER_SIZE, 0x3333FF);
        container.add(square);

        // Create arrow pointing left (away from factory)
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, 0x000000);  // Black arrow

        // Draw arrow
        graphics.beginPath();
        graphics.moveTo(-this.MARKER_SIZE/4, 0);  // Start from left side
        graphics.lineTo(this.MARKER_SIZE/4, 0);   // Line to right side
        graphics.moveTo(0, -this.MARKER_SIZE/4);  // Top of arrowhead
        graphics.lineTo(this.MARKER_SIZE/4, 0);   // Right point of arrowhead
        graphics.lineTo(0, this.MARKER_SIZE/4);   // Bottom of arrowhead
        graphics.strokePath();

        container.add(graphics);
        return container;
    }


    private setupInputHandlers(): void {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                const clickedFactory = this.getFactoryAt(pointer.worldX, pointer.worldY);

                if (clickedFactory) {
                    this.selectFactory(clickedFactory);
                } else {
                    this.clearSelection();
                }
            }
        });
    }

    private resetFactoryVisuals(factory: Factory): void {
        factory.list.forEach(item => item.destroy());

        if (factory.inputMarkers) {
            factory.inputMarkers.forEach(marker => marker.destroy());
        }
        factory.inputMarkers = [];

        if (factory.outputMarkers) {
            factory.outputMarkers.forEach(marker => marker.destroy());
        }
        factory.outputMarkers = [];

        factory.baseSprite?.destroy();
    }

    private drawFactoryVisuals(
        factory: Factory,
        factoryWidth: number,
        factoryHeight: number,
        inputCount: number,
        outputCount: number
    ): void {
        // Create base sprite (grey rectangle)
        const baseSprite = this.scene.add.rectangle(0, 0, factoryWidth, factoryHeight, 0x666666);
        baseSprite.setStrokeStyle(2, 0x999999);
        factory.add(baseSprite);
        factory.baseSprite = baseSprite;

        // Create input markers
        const inputSpacing = factoryHeight / (inputCount + 1);
        for (let i = 0; i < inputCount; i++) {
            const y = -factoryHeight / 2 + inputSpacing * (i + 1);
            const marker = this.createInputMarker(
                -factoryWidth / 2 - this.GRID_SIZE / 2,
                y
            );
            factory.add(marker);
            factory.inputMarkers.push(marker);
        }

        // Create output markers
        const outputSpacing = factoryHeight / (outputCount + 1);
        for (let i = 0; i < outputCount; i++) {
            const y = -factoryHeight / 2 + outputSpacing * (i + 1);
            const marker = this.createOutputMarker(
                factoryWidth / 2 + this.GRID_SIZE / 2,
                y
            );
            factory.add(marker);
            factory.outputMarkers.push(marker);
        }

        // Add or update configuration text
        const configText =
            (factory.getByName('configText') as Phaser.GameObjects.Text) ||
            this.scene
                .add.text(0, factoryHeight / 2 + 10, '', {
                fontSize: '12px',
                color: '#ffffff'
            })
                .setOrigin(0.5)
                .setName('configText');

        if (!factory.getByName('configText')) {
            factory.add(configText);
        }

        this.updateConfigText(factory);
    }

    private setupDraggable(factory: Factory): void {
        factory.setInteractive();
        this.scene.input.setDraggable(factory);

        factory.on('dragstart', (pointer: Phaser.Input.Pointer) => {
            factory.setData('dragOffset', { x: pointer.x - factory.x, y: pointer.y - factory.y });
            factory.setDepth(1);
        });

        factory.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            const snappedX = Math.round(dragX / this.GRID_SIZE) * this.GRID_SIZE;
            const snappedY = Math.round(dragY / this.GRID_SIZE) * this.GRID_SIZE;

            // Only update position if there's no collision at the new position
            if (!this.checkCollision(factory, snappedX, snappedY)) {
                factory.setPosition(snappedX, snappedY);
            }
        });

        factory.on('dragend', () => {
            // Reset depth when dragging ends
            factory.setDepth(0);
        });
    }

    private setupFactory(factory: Factory, inputCount: number = 1, outputCount: number = 1): void {
        // Calculate factory dimensions based on max number of inputs/outputs
        const maxConnections = Math.max(inputCount, outputCount);
        const factoryHeight = maxConnections * this.GRID_SIZE;
        const factoryWidth = 3 * this.GRID_SIZE; // Fixed width of 3 grid cells

        // Update container size
        factory.setSize(factoryWidth, factoryHeight);

        // Clear and redraw visuals
        this.resetFactoryVisuals(factory);
        this.drawFactoryVisuals(factory, factoryWidth, factoryHeight, inputCount, outputCount);

        // Update the interactive (draggable) hit area to match the new size
        this.updateInteractiveArea(factory, factoryWidth, factoryHeight);
    }


    private updateConfigText(factory: Factory): void {
        const configText = factory.getByName('configText') as Phaser.GameObjects.Text;
        if (configText) {
            configText.setText(
                `Recipe: ${factory.targetRecipe || 'None'}\n` +
                `Count: ${factory.machineCount}\n` +
                `Overclock: ${factory.overclockPercentage}%\n` +
                `Somerslooped: ${factory.isSomerslooped}`
            );
        }
    }

    private updateInteractiveArea(factory: Factory, width: number, height: number): void {
        if (factory.input && factory.input.hitArea instanceof Phaser.Geom.Rectangle) {
            factory.input.hitArea.setSize(width, height);
        }
    }

    public createFactory(worldX: number, worldY: number): Factory {
        console.log('createFactory');
        // Snap to grid
        const snappedX = Math.round(worldX / this.GRID_SIZE) * this.GRID_SIZE;
        const snappedY = Math.round(worldY / this.GRID_SIZE) * this.GRID_SIZE;

        // Create container
        const container = this.scene.add.container(snappedX, snappedY) as Factory;
        container.id = Date.now().toString();
        container.machineCount = 1;
        container.overclockPercentage = 100;
        container.isSomerslooped = false;

        // Set up the factory visuals with default 1/1 inputs/outputs
        this.setupFactory(container);

        // Make container draggable using the helper method
        this.setupDraggable(container);

        // Add to factories array
        this.factories.push(container);
        return container;
    }

    public updateFactory(config: {
        targetRecipe?: string;
        machineCount?: number;
        overclockPercentage?: number;
        isSomerslooped?: boolean;
    }): void {
        if (!this.selectedFactory) return;
        console.log('running updateFactory');

        // Update factory properties
        if (config.targetRecipe !== undefined) {
            this.selectedFactory.targetRecipe = config.targetRecipe;

            // Update factory appearance based on recipe
            const gameData = GameData.getInstance();
            const recipe = gameData.getRecipe(config.targetRecipe);
            if (recipe) {
                const machine = gameData.getMachine(recipe.machine);
                if (machine) {
                    this.setupFactory(this.selectedFactory, machine.inputCount, machine.outputCount);
                }
            }
        }

        if (config.machineCount !== undefined) {
            this.selectedFactory.machineCount = config.machineCount;
        }
        if (config.overclockPercentage !== undefined) {
            this.selectedFactory.overclockPercentage = config.overclockPercentage;
        }
        if (config.isSomerslooped !== undefined) {
            this.selectedFactory.isSomerslooped = config.isSomerslooped;
        }

        // Update the configuration text
        this.updateConfigText(this.selectedFactory);
    }

    private getFactoryAt(worldX: number, worldY: number): Factory | null {
        return this.factories.find(factory => {
            const bounds = factory.getBounds();
            return bounds.contains(worldX, worldY);
        }) || null;
    }

    private selectFactory(factory: Factory): void {
        this.clearSelection();
        this.selectedFactory = factory;
        factory.isSelected = true;
        factory.baseSprite.setStrokeStyle(2, 0x00ff00);
        this.scene.game.events.emit('factory-selected', factory);
    }

    private clearSelection(): void {
        if (this.selectedFactory) {
            this.selectedFactory.isSelected = false;
            this.selectedFactory.baseSprite.setStrokeStyle(2, 0x999999);
            this.scene.game.events.emit('factory-deselected', this.selectedFactory);
            this.selectedFactory = null;
        }
    }

    private checkCollision(factory: Factory, x: number, y: number): boolean {
        const testBounds = new Phaser.Geom.Rectangle(
            x - factory.width / 2,
            y - factory.height / 2,
            factory.width,
            factory.height
        );

        return this.factories.some(other => {
            if (other === factory) return false;

            const otherBounds = new Phaser.Geom.Rectangle(
                other.x - other.width / 2,
                other.y - other.height / 2,
                other.width,
                other.height
            );

            return Phaser.Geom.Rectangle.Overlaps(testBounds, otherBounds);
        });
    }

    public destroy(): void {
        this.factories.forEach(factory => factory.destroy());
        this.factories = [];
        this.selectedFactory = null;
    }
}