// FactoryManager.ts

import Phaser from 'phaser';
import GameData from '../types';

export interface Factory extends Phaser.GameObjects.Container {
    id: string;
    baseSprite: Phaser.GameObjects.Rectangle;
    inputMarker: Phaser.GameObjects.Rectangle;
    outputMarker: Phaser.GameObjects.Rectangle;
    isSelected: boolean;
    targetRecipe?: string;
    machineCount: number;
    overclockPercentage: number;
    isSomerslooped: boolean;
}

export class FactoryManager {
    private scene: Phaser.Scene;
    private factories: Factory[] = [];
    private selectedFactory: Factory | null = null;
    private readonly GRID_SIZE = 64;
    private readonly FACTORY_WIDTH = 128;
    private readonly FACTORY_HEIGHT = 128;
    private readonly MARKER_SIZE = 16;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public initialize(): void {
        this.setupInputHandlers();
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

    public createFactory(worldX: number, worldY: number): Factory {
        // Snap to grid
        const snappedX = Math.round(worldX / this.GRID_SIZE) * this.GRID_SIZE;
        const snappedY = Math.round(worldY / this.GRID_SIZE) * this.GRID_SIZE;

        // Create container
        const container = this.scene.add.container(snappedX, snappedY) as Factory;
        container.id = Date.now().toString();
        container.machineCount = 1;
        container.overclockPercentage = 100;
        container.isSomerslooped = false;

        // Create base sprite (grey rectangle)
        const baseSprite = this.scene.add.rectangle(0, 0, this.FACTORY_WIDTH, this.FACTORY_HEIGHT, 0x666666);
        baseSprite.setStrokeStyle(2, 0x999999);
        container.add(baseSprite);
        container.baseSprite = baseSprite;

        // Add input marker (blue square on left)
        const inputMarker = this.scene.add.rectangle(
            -this.FACTORY_WIDTH/2,
            0,
            this.MARKER_SIZE,
            this.MARKER_SIZE,
            0x3333ff
        );
        container.add(inputMarker);
        container.inputMarker = inputMarker;

        // Add output marker (red square on right)
        const outputMarker = this.scene.add.rectangle(
            this.FACTORY_WIDTH/2,
            0,
            this.MARKER_SIZE,
            this.MARKER_SIZE,
            0xff3333
        );
        container.add(outputMarker);
        container.outputMarker = outputMarker;

        // Make container interactive and draggable
        container.setSize(this.FACTORY_WIDTH, this.FACTORY_HEIGHT);
        container.setInteractive(
            new Phaser.Geom.Rectangle(
                0,
                0,
                this.FACTORY_WIDTH,
                this.FACTORY_HEIGHT
            ),
            Phaser.Geom.Rectangle.Contains
        );

        // Enable dragging with grid snapping
        this.scene.input.setDraggable(container);

        // When dragging starts, store the pointer offset relative to the container's position.
        container.on('dragstart', (pointer: Phaser.Input.Pointer) => {
            container.setData('dragOffset', { x: pointer.x - container.x, y: pointer.y - container.y });
        });

        container.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            // Snap to grid while dragging
            const snappedX = Math.round(dragX / this.GRID_SIZE) * this.GRID_SIZE;
            const snappedY = Math.round(dragY / this.GRID_SIZE) * this.GRID_SIZE;
            container.setPosition(snappedX, snappedY);
        });

        const configText = this.scene.add.text(0, this.FACTORY_HEIGHT / 2 + 10, '', { fontSize: '12px', color: '#ffffff' });
        configText.setOrigin(0.5);
        configText.setName('configText');
        container.add(configText);

        // Add to factories array
        this.factories.push(container);
        return container;
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

    public updateSelectedFactory(config: {
        targetRecipe?: string;
        machineCount?: number;
        overclockPercentage?: number;
        isSomerslooped?: boolean;
    }): void {
        if (!this.selectedFactory) return;

        // If the target recipe has been updated, update the factory markers.
        if (config.targetRecipe !== undefined) {
            this.selectedFactory.targetRecipe = config.targetRecipe;

            const gameData = GameData.getInstance();
            const recipe = gameData.getRecipe(config.targetRecipe);
            if (recipe) {
                const machine = gameData.getMachine(recipe.machine);
                if (machine) {
                    // Remove existing markers (the default markers and any previously added ones).
                    if (this.selectedFactory.inputMarker) {
                        this.selectedFactory.inputMarker.destroy();
                        this.selectedFactory.inputMarker = undefined as any;
                    }
                    if (this.selectedFactory.outputMarker) {
                        this.selectedFactory.outputMarker.destroy();
                        this.selectedFactory.outputMarker = undefined as any;
                    }
                    if ((this.selectedFactory as any).inputMarkers) {
                        (this.selectedFactory as any).inputMarkers.forEach((marker: Phaser.GameObjects.GameObject) => marker.destroy());
                    }
                    if ((this.selectedFactory as any).outputMarkers) {
                        (this.selectedFactory as any).outputMarkers.forEach((marker: Phaser.GameObjects.GameObject) => marker.destroy());
                    }

                    // Create new input markers based on machine.inputCount.
                    const inputMarkers: Phaser.GameObjects.Rectangle[] = [];
                    const spacingInput = this.FACTORY_HEIGHT / (machine.inputCount + 1);
                    for (let i = 0; i < machine.inputCount; i++) {
                        const y = -this.FACTORY_HEIGHT / 2 + spacingInput * (i + 1);
                        const marker = this.scene.add.rectangle(-this.FACTORY_WIDTH / 2, y, this.MARKER_SIZE, this.MARKER_SIZE, 0x3333ff);
                        this.selectedFactory.add(marker);
                        inputMarkers.push(marker);
                    }

                    // Create new output markers based on machine.outputCount.
                    const outputMarkers: Phaser.GameObjects.Rectangle[] = [];
                    const spacingOutput = this.FACTORY_HEIGHT / (machine.outputCount + 1);
                    for (let i = 0; i < machine.outputCount; i++) {
                        const y = -this.FACTORY_HEIGHT / 2 + spacingOutput * (i + 1);
                        const marker = this.scene.add.rectangle(this.FACTORY_WIDTH / 2, y, this.MARKER_SIZE, this.MARKER_SIZE, 0xff3333);
                        this.selectedFactory.add(marker);
                        outputMarkers.push(marker);
                    }

                    // Store the new markers (for later cleanup if needed)
                    (this.selectedFactory as any).inputMarkers = inputMarkers;
                    (this.selectedFactory as any).outputMarkers = outputMarkers;
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

        // Update the debug text inside the factory container.
        const configText = this.selectedFactory.getByName('configText') as Phaser.GameObjects.Text;
        if (configText) {
            configText.setText(
                `Recipe: ${this.selectedFactory.targetRecipe || 'None'}\n` +
                `Count: ${this.selectedFactory.machineCount}\n` +
                `Overclock: ${this.selectedFactory.overclockPercentage}%\n` +
                `Somerslooped: ${this.selectedFactory.isSomerslooped}`
            );
        }
    }

    public destroy(): void {
        this.factories.forEach(factory => factory.destroy());
        this.factories = [];
        this.selectedFactory = null;
    }
}