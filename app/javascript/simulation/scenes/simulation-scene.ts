import { Scene } from 'phaser';

interface Factory extends Phaser.GameObjects.Image {
    isSelected?: boolean;
    dragStartX?: number;
    dragStartY?: number;
}

export class SimulationScene extends Scene {
    private gridSize = 64;
    private worldWidth = 12000;
    private worldHeight = 6000;
    private borderWidth = 2;

    private isDraggingFactory = false;
    private factories: Factory[] = [];
    private selectedFactories: Set<Factory> = new Set();
    private dragStartPointer: { x: number; y: number } | null = null;

    constructor() {
        super('simulation-scene');
    }

    create(): void {
        // Previous border and grid setup remains the same...
        const border = this.add.graphics();
        border.lineStyle(this.borderWidth, 0xff0000, 1);
        border.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.8);

        // Draw vertical lines
        for (let x = 0; x < this.worldWidth; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.worldHeight);
        }

        // Draw horizontal lines
        for (let y = 0; y < this.worldHeight; y += this.gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(this.worldWidth, y);
        }

        graphics.strokePath();

        // Camera setup
        this.cameras.main.setBounds(-100, -100, this.worldWidth + 200, this.worldHeight + 200);
        this.cameras.main.setZoom(0.8);

        // Handle canvas right-click drag
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.input.setPollAlways(); // Ensure we keep getting updates even when mouse leaves window
            } else if (pointer.leftButtonDown()) {
                // Left click on empty space deselects all
                const clickedFactory = this.factories.find(factory =>
                    factory.getBounds().contains(pointer.worldX, pointer.worldY)
                );

                if (!clickedFactory) {
                    this.deselectAll();
                }
            }
        });

        // Setup input handlers
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                // Right button for camera pan
                this.dragStartPointer = { x: pointer.x, y: pointer.y };
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Handle camera panning with right mouse button
            if (pointer.rightButtonDown() && this.dragStartPointer) {
                this.cameras.main.scrollX -= (pointer.x - this.dragStartPointer.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - this.dragStartPointer.y) / this.cameras.main.zoom;
                this.dragStartPointer = { x: pointer.x, y: pointer.y };
            }

            // Handle factory dragging
            if (this.isDraggingFactory && pointer.leftButtonDown()) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.selectedFactories.forEach(factory => {
                    if (factory.dragStartX !== undefined && factory.dragStartY !== undefined) {
                        const dx = Math.round((worldPoint.x - factory.dragStartX) / this.gridSize) * this.gridSize;
                        const dy = Math.round((worldPoint.y - factory.dragStartY) / this.gridSize) * this.gridSize;
                        factory.x = factory.dragStartX + dx;
                        factory.y = factory.dragStartY + dy;
                    }
                });
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.rightButtonDown()) {
                this.dragStartPointer = null;
            }
            if (!pointer.leftButtonDown()) {
                this.isDraggingFactory = false;
                this.selectedFactories.forEach(factory => {
                    delete factory.dragStartX;
                    delete factory.dragStartY;
                });
            }
        });

        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - (deltaY * 0.001);
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.2, 2));
        });

        this.cameras.main.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    }
    public createFactory(worldX: number, worldY: number): void {
        const factory = this.add.image(worldX, worldY, 'factory-icon')
            .setInteractive() as Factory;

        // Snap to grid
        factory.x = Math.round(worldX / this.gridSize) * this.gridSize;
        factory.y = Math.round(worldY / this.gridSize) * this.gridSize;

        factory.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                // Handle selection
                if (pointer.event.ctrlKey || pointer.event.metaKey) {
                    this.toggleFactorySelection(factory);
                } else {
                    if (!this.selectedFactories.has(factory)) {
                        this.deselectAll();
                        this.selectFactory(factory);
                    }
                }

                // Start dragging
                if (this.selectedFactories.has(factory)) {
                    this.isDraggingFactory = true;
                    // Store starting positions for all selected factories
                    this.selectedFactories.forEach(f => {
                        f.dragStartX = f.x;
                        f.dragStartY = f.y;
                    });
                }
            }
        });

        // Add to our collection
        this.factories.push(factory);
        this.updateFactoryVisuals(factory);
    }

    private setupInputHandlers(): void {
        // Only set up once
        if (!this.input.listenerCount('pointermove')) {
            // Store initial positions of all selected factories when drag starts
            let dragStartPositions = new Map<Factory, {x: number, y: number}>();

            this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
                if (pointer.rightButtonDown()) {
                    // Camera panning
                    this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                    this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
                } else if (this.isDraggingFactory && dragStartPositions.size > 0) {
                    // Factory dragging
                    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                    const snapX = Math.round(worldPoint.x / this.gridSize) * this.gridSize;
                    const snapY = Math.round(worldPoint.y / this.gridSize) * this.gridSize;

                    // Get the first selected factory as reference for movement
                    const [firstFactory] = this.selectedFactories;
                    const firstStartPos = dragStartPositions.get(firstFactory);

                    if (firstStartPos) {
                        // Calculate total movement from start position
                        const dx = snapX - firstStartPos.x;
                        const dy = snapY - firstStartPos.y;

                        // Move all selected factories relative to their start positions
                        this.selectedFactories.forEach(factory => {
                            const startPos = dragStartPositions.get(factory);
                            if (startPos) {
                                factory.x = startPos.x + dx;
                                factory.y = startPos.y + dy;
                            }
                        });
                    }
                }
            });

            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    const clickedFactory = this.factories.find(factory =>
                        factory.getBounds().contains(pointer.worldX, pointer.worldY)
                    );

                    if (clickedFactory) {
                        // If clicking a factory, store start positions for all selected factories
                        if (this.selectedFactories.has(clickedFactory)) {
                            dragStartPositions.clear();
                            this.selectedFactories.forEach(factory => {
                                dragStartPositions.set(factory, {x: factory.x, y: factory.y});
                            });
                            this.isDraggingFactory = true;
                        }
                    } else {
                        this.deselectAll();
                    }
                }
            });

            this.input.on('pointerup', () => {
                this.isDraggingFactory = false;
                dragStartPositions.clear();
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
}