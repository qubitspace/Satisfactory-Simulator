
interface Factory extends Phaser.GameObjects.Image {
    isSelected?: boolean;
    dragStartRelativeX?: number;
    dragStartRelativeY?: number;
}


interface SimulationData {
    mode: 'sandbox' | 'level';
    levelId?: number;
    availableBuildings?: string[]; // Buildings will all be available for sandbox, but levels will have a specific set of unlocked buildings
    // similarly there will be a set of recipes that are available for levels
    requiredOutput?: {
        itemType: string;
        amount: number;
    }[];
}

export class SimulationScene extends Phaser.Scene {
    private gridSize = 64;
    private worldWidth = 12000;
    private worldHeight = 6000;
    private borderWidth = 2;

    private isDraggingFactory = false;
    public factories: Factory[] = [];
    private selectedFactories: Set<Factory> = new Set();
    private dragStartPointer: { x: number; y: number } | null = null;

    public gameMode: 'sandbox' | 'level' = 'sandbox';
    public levelId?: number;
    private availableBuildings: string[] = ['factory']; // todo: Should be available machines, as levels will have different machines available (ex: constructor, assembler, etc)
    // todo: Should have a list of recipes available for each level
    private requiredOutput?: {
        itemType: string;
        amount: number;
    }[];

    constructor() {
        super('simulation-scene');
    }

    init(data: SimulationData): void {
        // Reset all properties to their default state
        this.factories = [];
        this.selectedFactories.clear();
        this.dragStartPointer = null;
        this.isDraggingFactory = false;

        // Set mode-specific properties
        this.gameMode = data.mode;
        this.levelId = data.levelId;

        if (data.mode === 'level') {
            // Apply level-specific constraints
            this.availableBuildings = data.availableBuildings || ['factory'];
            this.requiredOutput = data.requiredOutput;

            // Tutorial level might be smaller
            if (this.levelId === 1) {
                this.worldWidth = 6000;
                this.worldHeight = 3000;
            }
        } else {
            // Sandbox mode - everything is available
            this.availableBuildings = ['factory', 'smelter', 'constructor', 'assembler'];
            this.requiredOutput = undefined;
        }
    }

    create(): void {
        // Border and grid setup
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
                this.dragStartPointer = { x: pointer.x, y: pointer.y };
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

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Handle camera panning with right mouse button
            if (pointer.rightButtonDown() && this.dragStartPointer) {
                this.cameras.main.scrollX -= (pointer.x - this.dragStartPointer.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - this.dragStartPointer.y) / this.cameras.main.zoom;
                this.dragStartPointer = { x: pointer.x, y: pointer.y };
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.rightButtonDown()) {
                this.dragStartPointer = null;
            }
        });

        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - (deltaY * 0.001);
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.2, 2));
        });

        this.setupInputHandlers();

        this.cameras.main.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    }

    private createLevelUI(): void {
        // Add UI elements specific to level mode
        const padding = 10;
        let yPosition = padding;

        // Show available buildings
        this.add.text(padding, yPosition, 'Available Buildings:', {
            fontSize: '16px',
            color: '#ffffff'
        });
        yPosition += 25;

        this.availableBuildings.forEach(building => {
            this.add.text(padding + 10, yPosition, `- ${building}`, {
                fontSize: '14px',
                color: '#cccccc'
            });
            yPosition += 20;
        });

        // Show required output if exists
        if (this.requiredOutput) {
            yPosition += 30;
            this.add.text(padding, yPosition, 'Required Output:', {
                fontSize: '16px',
                color: '#ffffff'
            });
            yPosition += 25;

            this.requiredOutput.forEach(requirement => {
                this.add.text(padding + 10, yPosition,
                    `- ${requirement.amount}/min ${requirement.itemType}`, {
                        fontSize: '14px',
                        color: '#cccccc'
                    });
                yPosition += 20;
            });
        }
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
            }
        });

        // Add to our collection
        this.factories.push(factory);
        this.updateFactoryVisuals(factory);
    }

    public clearFactories(): void {
        this.factories.forEach(factory => factory.destroy());
        this.factories = [];
        this.selectedFactories.clear();
    }

    private setupInputHandlers(): void {
        let dragStartPointerWorld: { x: number, y: number };

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                const clickedFactory = this.factories.find(factory =>
                    factory.getBounds().contains(pointer.worldX, pointer.worldY)
                );

                if (clickedFactory) {
                    // If clicking a factory, start dragging if it's selected
                    if (this.selectedFactories.has(clickedFactory)) {
                        this.isDraggingFactory = true;
                        dragStartPointerWorld = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                        // Calculate and store the relative position of each selected factory to the drag start point
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

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingFactory && dragStartPointerWorld) {
                // Get current world position
                const currentWorldPos = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                // Calculate potential new positions based on relative drag
                let potentialPositions: { x: number, y: number }[] = [];
                this.selectedFactories.forEach(factory => {
                    if (factory.dragStartRelativeX !== undefined && factory.dragStartRelativeY !== undefined) {
                        const newX = currentWorldPos.x + factory.dragStartRelativeX;
                        const newY = currentWorldPos.y + factory.dragStartRelativeY;
                        potentialPositions.push({ x: newX, y: newY });
                    }
                });

                // Check if any potential position is out of bounds
                let isOutOfBounds = potentialPositions.some(pos => {
                    return pos.x < this.gridSize / 2 || pos.x > this.worldWidth - this.gridSize / 2 ||
                        pos.y < this.gridSize / 2 || pos.y > this.worldHeight - this.gridSize / 2;
                });

                // If not out of bounds, move the factories
                if (!isOutOfBounds) {
                    potentialPositions.forEach((pos, index) => {
                        const factory = Array.from(this.selectedFactories)[index];
                        factory.x = Math.round(pos.x / this.gridSize) * this.gridSize;
                        factory.y = Math.round(pos.y / this.gridSize) * this.gridSize;
                    });
                }
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            this.isDraggingFactory = false;
            dragStartPointerWorld = { x: 0, y: 0 };
            this.selectedFactories.forEach(factory => {
                delete factory.dragStartRelativeX;
                delete factory.dragStartRelativeY;
            });
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
            factory.setTint(0x00ff00);
        } else {
            factory.clearTint();
        }
    }
}