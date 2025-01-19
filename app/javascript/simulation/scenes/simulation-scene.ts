import {TransportSystem} from "../systems/transport-system";
import {Factory, FactorySystem} from "../systems/factory-system";

interface SimulationData {
    mode: 'sandbox' | 'level';
    levelId?: number;
    availableBuildings?: string[];
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
    private transportSystem!: TransportSystem;
    private factorySystem!: FactorySystem;
    private dragStartPointer: { x: number; y: number } | null = null;

    public gameMode: 'sandbox' | 'level' = 'sandbox';
    public levelId?: number;
    private availableBuildings: string[] = ['factory'];
    private requiredOutput?: {
        itemType: string;
        amount: number;
    }[];

    constructor() {
        super('simulation-scene');
    }

    init(data: SimulationData): void {
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
        // Initialize systems
        this.transportSystem = new TransportSystem(this);
        this.factorySystem = new FactorySystem(this);
        const toolbarHeight = 100;
        this.cameras.main.setViewport(0, 0, window.innerWidth, window.innerHeight - toolbarHeight);

        // Border and grid setup
        this.setupWorldGrid();

        // Camera setup
        this.setupCamera();

        // Setup camera controls
        this.setupCameraControls();

        // Create UI elements if in level mode
        if (this.gameMode === 'level') {
            this.createLevelUI();
        }

        console.log('SimulationScene created');
        this.events.emit('simulation-scene-ready');
    }

    public getFactories(): Factory[] {
        return this.factorySystem.getFactories();
    }

    private setupWorldGrid(): void {
        // Border setup
        const border = this.add.graphics();
        border.lineStyle(this.borderWidth, 0xff0000, 1);
        border.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        // Grid setup
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
    }

    private setupCamera(): void {
        this.cameras.main.setBounds(-100, -100, this.worldWidth + 200, this.worldHeight + 200);
        this.cameras.main.setZoom(0.8);
        this.cameras.main.centerOn(this.worldWidth / 2, this.worldHeight / 2);
    }

    private setupCameraControls(): void {
        // Handle right-click camera pan
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.dragStartPointer = { x: pointer.x, y: pointer.y };
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
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

        // Handle zoom with mouse wheel
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - (deltaY * 0.001);
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.2, 2));
        });
    }

    private createLevelUI(): void {
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

    public createFactory(worldX: number, worldY: number, machineType: string = 'constructor', recipe: string = 'Iron Plate'): void {
        this.factorySystem.createFactory(worldX, worldY, machineType);
    }

    public clearFactories(): void {
        this.factorySystem.clearFactories();
    }

    shutdown(): void {
        this.transportSystem.destroy();
        this.factorySystem.destroy();
    }
}