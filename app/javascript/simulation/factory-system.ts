// /app/javascript/simulation/systems/factory-system.ts

import Phaser from 'phaser';

export interface Factory extends Phaser.GameObjects.Image {
    id: string;
    type: string;
    recipe?: string;
    efficiency?: number;
    isSelected?: boolean;
    dragStartRelativeX?: number;
    dragStartRelativeY?: number;
}

export class FactorySystem {
    private factories: Factory[] = [];
    private selectedFactories: Set<Factory> = new Set();
    private isDragging: boolean = false;
    private gridSize = 64;
    private worldWidth: number;
    private worldHeight: number;

    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.worldWidth = (scene as any).worldWidth || 12000;
        this.worldHeight = (scene as any).worldHeight || 6000;
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

    public createFactory(worldX: number, worldY: number, type: string = 'factory'): Factory {
        const snappedX = Math.round(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.round(worldY / this.gridSize) * this.gridSize;

        const factory = this.scene.add.image(snappedX, snappedY, 'factory-icon')
            .setInteractive() as Factory;

        factory.id = Date.now().toString();
        factory.type = type;

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

        this.factories.push(factory);
        this.updateFactoryVisuals(factory);

        return factory;
    }

    private getFactoryAt(worldX: number, worldY: number): Factory | undefined {
        return this.factories.find(factory =>
            factory.getBounds().contains(worldX, worldY)
        );
    }

    private updateDragPositions(currentWorldPos: { x: number, y: number }): void {
        let potentialPositions: { x: number, y: number }[] = [];

        this.selectedFactories.forEach(factory => {
            if (factory.dragStartRelativeX !== undefined &&
                factory.dragStartRelativeY !== undefined) {
                const newX = currentWorldPos.x + factory.dragStartRelativeX;
                const newY = currentWorldPos.y + factory.dragStartRelativeY;
                potentialPositions.push({ x: newX, y: newY });
            }
        });

        // Check if any position is out of bounds
        const isOutOfBounds = potentialPositions.some(pos => {
            return pos.x < this.gridSize / 2 ||
                pos.x > this.scene.scale.width - this.gridSize / 2 ||
                pos.y < this.gridSize / 2 ||
                pos.y > this.scene.scale.height - this.gridSize / 2;
        });

        if (!isOutOfBounds) {
            potentialPositions.forEach((pos, index) => {
                const factory = Array.from(this.selectedFactories)[index];
                factory.x = Math.round(pos.x / this.gridSize) * this.gridSize;
                factory.y = Math.round(pos.y / this.gridSize) * this.gridSize;
            });
        }
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
            factory.setTint(0x00ff00);
        } else {
            factory.clearTint();
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

// TODO: Allow factories to have different machine types and recipies.
// Draw factories with the number of inputs/outputs based on the machine.
// Indicate the input/output item and rate
// Add a way to change the machine type and recipe
// Allow connecting belts to factories to transport items
// Belts should lock to a factory, and you have to do something specific to disconnect it.
// Dragging factories should also drag connected belts