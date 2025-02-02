import { FactoryManager } from '../directors/FactoryManager';

export class SimulationScene extends Phaser.Scene {
    private readonly TOOLBAR_HEIGHT = 100;
    private factoryDirector = new FactoryManager(this);
    private gridSize = 64;
    private worldWidth = 12000;
    private worldHeight = 6000;
    private borderWidth = 2;
    private dragStartPointer: { x: number; y: number } | null = null;

    constructor() {
        super('SimulationScene');
    }

    init(): void {}

    create(): void {
        // Create and initialize the factory director
        this.factoryDirector = new FactoryManager(this);
        this.factoryDirector.initialize();

        // Set up viewport with space for toolbar
        this.cameras.main.setViewport(
            0,
            0,
            window.innerWidth,
            window.innerHeight - this.TOOLBAR_HEIGHT
        );

        // Launch toolbar scene
        this.scene.launch('ToolbarScene', {
            toolbarHeight: this.TOOLBAR_HEIGHT,
            yPosition: window.innerHeight - this.TOOLBAR_HEIGHT
        });

        // Listen for the event emitted from the ToolbarScene when a factory is dropped
        this.input.on('create-factory', (x: number, y: number) => {
            this.factoryDirector.createFactory(x, y);
        });

        this.game.events.on(
            'update-selected-factory',
            (config: {
                targetRecipe?: string;
                machineCount?: number;
                overclockPercentage?: number;
                isSomerslooped?: boolean;
            }) => {
                this.factoryDirector.updateSelectedFactory(config);
            }
        );

        this.setupWorldGrid();
        this.setupCamera();
        this.setupCameraControls();
    }

    private setupWorldGrid(): void {
        // Border setup
        const border = this.add.graphics();
        border.lineStyle(this.borderWidth, 0xff0000, 1);
        border.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        // Grid setup
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.8);

        for (let x = 0; x < this.worldWidth; x += this.gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.worldHeight);
        }

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
        // Right-click camera panning
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

        // Mouse wheel zooming
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.2, 2));
        });
    }
}