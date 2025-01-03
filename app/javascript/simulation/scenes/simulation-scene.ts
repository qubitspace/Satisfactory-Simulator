// app/javascript/simulation/scenes/simulation-scene.ts
import { Scene } from 'phaser';

export class SimulationScene extends Scene {
    private gridSize = 64;
    private worldWidth = 12000;
    private worldHeight = 6000;
    private borderWidth = 2;

    private isDraggingFactory = false;
    private factories: Phaser.GameObjects.Image[] = [];
    private activeFactory: Phaser.GameObjects.Image | null = null;

    constructor() {
        super('simulation-scene');
    }

    create(): void {
        // Create border
        const border = this.add.graphics();
        border.lineStyle(this.borderWidth, 0xff0000, 1);
        border.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        // Create grid graphics
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

        // Setup camera controls with larger bounds
        this.cameras.main.setBounds(-100, -100, this.worldWidth + 200, this.worldHeight + 200);
        this.cameras.main.setZoom(0.8); // Start slightly zoomed out

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const clickedFactory = this.factories.find(factory =>
                factory.getBounds().contains(pointer.worldX, pointer.worldY)
            );
            if (!clickedFactory) {
                this.isDraggingFactory = false;
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (pointer.isDown && !this.isDraggingFactory) {
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            }
        });

        // Enable zoom with mouse wheel
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom - (deltaY * 0.001);
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.2, 2)); // Allow more zoom out
        });

        // Center the camera initially
        this.cameras.main.centerOn(this.worldWidth / 2, this.worldHeight / 2);

    }

    public createFactory(worldX: number, worldY: number): void {
        const factory = this.add.image(worldX, worldY, 'factory-icon')
            .setInteractive();

        // Snap to grid
        const snapToGrid = (value: number) => Math.round(value / this.gridSize) * this.gridSize;
        factory.x = snapToGrid(worldX);
        factory.y = snapToGrid(worldY);

        // Setup factory dragging
        factory.on('pointerdown', () => {
            this.isDraggingFactory = true;
            this.activeFactory = factory;
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingFactory && this.activeFactory) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.activeFactory.x = snapToGrid(worldPoint.x);
                this.activeFactory.y = snapToGrid(worldPoint.y);
            }
        });

        factory.on('pointerup', () => {
            this.isDraggingFactory = false;
            this.activeFactory = null;
        });

        this.factories.push(factory);
    }

    public startDraggingNewFactory(worldX: number, worldY: number): void {
        // Create factory at the dropped position
        const factory = this.add.image(worldX, worldY, 'factory-icon')
            .setInteractive({ draggable: true });

        // Snap to grid
        const snapToGrid = (value: number) => Math.round(value / this.gridSize) * this.gridSize;
        factory.x = snapToGrid(worldX);
        factory.y = snapToGrid(worldY);

        this.factories.push(factory);

        // Start dragging the newly created factory immediately
        this.input.setDraggable(factory);
        factory.emit('dragstart', this.input.activePointer, factory.x, factory.y);
    }
}