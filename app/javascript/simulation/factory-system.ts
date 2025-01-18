// /app/javascript/simulation/factory-system.ts

import Phaser from 'phaser';
import GameData from './types';
import {Transport} from "./transport-system";

export interface Factory extends Phaser.GameObjects.Container {
    id: string;
    type: string;
    recipe?: string;
    efficiency?: number;
    isSelected?: boolean;
    dragStartRelativeX?: number;
    dragStartRelativeY?: number;
    baseSprite: Phaser.GameObjects.Rectangle;
    inputMarkers: Phaser.GameObjects.Rectangle[];
    outputMarkers: Phaser.GameObjects.Rectangle[];
    inputConnections: Map<number, Transport>;
    outputConnections: Map<number, Transport>;
}

export class FactorySystem {
    private factories: Factory[] = [];
    private selectedFactories: Set<Factory> = new Set();
    private isDragging: boolean = false;
    private gridSize = 64;
    private worldWidth: number;
    private worldHeight: number;
    private gameData: GameData;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.worldWidth = (scene as any).worldWidth || 12000;
        this.worldHeight = (scene as any).worldHeight || 6000;
        this.gameData = GameData.getInstance();
        this.setupInputHandlers();
    }

    private setupInputHandlers(): void {
        let dragStartPointerWorld: { x: number, y: number };

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                const clickedFactory = this.getFactoryAt(pointer.worldX, pointer.worldY);

                if (clickedFactory) {
                    // Handle selection
                    if (pointer.event.ctrlKey || pointer.event.metaKey) {
                        this.toggleFactorySelection(clickedFactory);
                    } else {
                        if (!this.selectedFactories.has(clickedFactory)) {
                            this.deselectAll();
                            this.selectFactory(clickedFactory);
                        }
                    }

                    // Start dragging if factory is selected
                    if (this.selectedFactories.has(clickedFactory)) {
                        this.isDragging = true;
                        dragStartPointerWorld = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

                        this.selectedFactories.forEach(factory => {
                            factory.dragStartRelativeX = factory.x - dragStartPointerWorld.x;
                            factory.dragStartRelativeY = factory.y - dragStartPointerWorld.y;
                        });
                    }
                } else {
                    this.deselectAll();
                }
            }
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                const currentWorldPos = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

                // Calculate potential new positions
                let potentialPositions: { x: number, y: number }[] = [];
                this.selectedFactories.forEach(factory => {
                    if (factory.dragStartRelativeX !== undefined &&
                        factory.dragStartRelativeY !== undefined) {
                        const newX = currentWorldPos.x + factory.dragStartRelativeX;
                        const newY = currentWorldPos.y + factory.dragStartRelativeY;
                        potentialPositions.push({ x: newX, y: newY });
                    }
                });

                // Check boundaries
                const isOutOfBounds = potentialPositions.some(pos => {
                    return pos.x < this.gridSize / 2 ||
                        pos.x > this.worldWidth - this.gridSize / 2 ||
                        pos.y < this.gridSize / 2 ||
                        pos.y > this.worldHeight - this.gridSize / 2;
                });

                // Update positions if in bounds
                if (!isOutOfBounds) {
                    potentialPositions.forEach((pos, index) => {
                        const factory = Array.from(this.selectedFactories)[index];
                        factory.x = Math.round(pos.x / this.gridSize) * this.gridSize;
                        factory.y = Math.round(pos.y / this.gridSize) * this.gridSize;
                    });
                }
            }
        });

        this.scene.input.on('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.selectedFactories.forEach(factory => {
                    delete factory.dragStartRelativeX;
                    delete factory.dragStartRelativeY;
                });
            }
        });
    }

    public createFactory(worldX: number, worldY: number, type: string = 'constructor'): Factory {
        const machine = this.gameData.getMachine(type);
        if (!machine) {
            console.error(`Machine type ${type} not found`);
            // Create a default factory instead of returning undefined
            return this.createDefaultFactory(worldX, worldY);
        }

        // Calculate factory size based on inputs/outputs
        const maxPorts = Math.max(machine.inputCount, machine.outputCount);
        const factoryHeight = (maxPorts + 1) * this.gridSize; // +1 for padding
        const factoryWidth = 3 * this.gridSize; // 2 grid squares wide

        // Snap to grid, centering on the click point
        const snappedX = Math.round(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.round(worldY / this.gridSize) * this.gridSize;

        // Create a container for the factory
        const container = this.scene.add.container(snappedX, snappedY) as Factory;

        // Create base sprite - a larger rectangle
        const baseSprite = this.scene.add.rectangle(0, 0, factoryWidth, factoryHeight, 0x666666);
        baseSprite.setStrokeStyle(2, 0x999999);
        container.add(baseSprite);
        container.baseSprite = baseSprite;

        // Add machine type label
        const label = this.scene.add.text(0, 0, type, {
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 0.5);
        container.add(label);

        container.inputMarkers = [];
        container.outputMarkers = [];

        // Add input markers - one per grid square on left side
        for (let i = 0; i < machine.inputCount; i++) {
            const marker = this.scene.add.rectangle(
                -factoryWidth/2,  // Left side
                -factoryHeight/2 + (i + 1) * this.gridSize,  // Spaced by grid size
                this.gridSize/4,  // Marker size
                this.gridSize/4,
                0x3333ff
            );
            container.add(marker);
            container.inputMarkers.push(marker);

            // Add input label
            const inputLabel = this.scene.add.text(
                -factoryWidth/2 + this.gridSize/3,
                -factoryHeight/2 + (i + 1) * this.gridSize,
                `In ${i + 1}`,
                { fontSize: '12px', color: '#ffffff' }
            ).setOrigin(0, 0.5);
            container.add(inputLabel);
        }

        // Add output markers - one per grid square on right side
        for (let i = 0; i < machine.outputCount; i++) {
            const marker = this.scene.add.rectangle(
                factoryWidth/2,  // Right side
                -factoryHeight/2 + (i + 1) * this.gridSize,  // Spaced by grid size
                this.gridSize/4,
                this.gridSize/4,
                0xff3333
            );
            container.add(marker);
            container.outputMarkers.push(marker);

            // Add output label
            const outputLabel = this.scene.add.text(
                factoryWidth/2 - this.gridSize/3,
                -factoryHeight/2 + (i + 1) * this.gridSize,
                `Out ${i + 1}`,
                { fontSize: '12px', color: '#ffffff' }
            ).setOrigin(1, 0.5);
            container.add(outputLabel);
        }

        // Set container properties
        container.setSize(factoryWidth, factoryHeight);
        container.setInteractive(new Phaser.Geom.Rectangle(-factoryWidth/2, -factoryHeight/2, factoryWidth, factoryHeight),
            Phaser.Geom.Rectangle.Contains);

        container.id = Date.now().toString();
        container.type = type;

        // Add to factories array
        this.factories.push(container);
        this.updateFactoryVisuals(container);

        // Setup factory events
        this.setupFactoryEvents(container);

        return container;
    }

    private createDefaultFactory(worldX: number, worldY: number): Factory {
        const snappedX = Math.round(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.round(worldY / this.gridSize) * this.gridSize;

        const container = this.scene.add.container(snappedX, snappedY) as Factory;

        // Create a simple square factory
        const baseSprite = this.scene.add.rectangle(0, 0, this.gridSize, this.gridSize, 0x666666);
        baseSprite.setStrokeStyle(2, 0x999999);
        container.add(baseSprite);
        container.baseSprite = baseSprite;

        container.inputMarkers = [];
        container.outputMarkers = [];
        container.id = Date.now().toString();
        container.type = 'unknown';

        container.setSize(this.gridSize, this.gridSize);
        container.setInteractive(new Phaser.Geom.Rectangle(-this.gridSize/2, -this.gridSize/2, this.gridSize, this.gridSize),
            Phaser.Geom.Rectangle.Contains);

        this.factories.push(container);
        return container;
    }

    private setupFactoryEvents(factory: Factory): void {
        factory.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                if (pointer.event.ctrlKey || pointer.event.metaKey) {
                    this.toggleFactorySelection(factory);
                } else {
                    if (!this.selectedFactories.has(factory)) {
                        this.deselectAll();
                        this.selectFactory(factory);
                    }
                }
            }
        });
    }

    private getFactoryAt(worldX: number, worldY: number): Factory | undefined {
        return this.factories.find(factory => {
            const bounds = factory.getBounds();
            return bounds.contains(worldX, worldY);
        });
    }

    private selectFactory(factory: Factory): void {
        factory.isSelected = true;
        this.selectedFactories.add(factory);
        this.updateFactoryVisuals(factory);
    }

    private deselectFactory(factory: Factory): void {
        factory.isSelected = false;
        this.selectedFactories.delete(factory);
        this.updateFactoryVisuals(factory);
    }

    private toggleFactorySelection(factory: Factory): void {
        if (factory.isSelected) {
            this.deselectFactory(factory);
        } else {
            this.selectFactory(factory);
        }
    }

    private deselectAll(): void {
        this.selectedFactories.forEach(factory => {
            this.deselectFactory(factory);
        });
    }

    private updateFactoryVisuals(factory: Factory): void {
        if (factory.isSelected) {
            factory.baseSprite.setStrokeStyle(2, 0x00ff00);
        } else {
            factory.baseSprite.setStrokeStyle(2, 0x999999);
        }
    }

    public getFactories(): Factory[] {
        return this.factories;
    }

    public getSelectedFactories(): Factory[] {
        return Array.from(this.selectedFactories);
    }

    public clearFactories(): void {
        this.factories.forEach(factory => factory.destroy());
        this.factories = [];
        this.selectedFactories.clear();
    }

    public destroy(): void {
        this.clearFactories();
    }
}