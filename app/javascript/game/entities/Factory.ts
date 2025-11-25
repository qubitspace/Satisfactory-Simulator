import Phaser from "phaser";
import { ConnectionPoint, ConnectionPointOwner, ConnectionType, ConnectionSide } from "./ConnectionPoint";

/**
 * Represents a factory building with inputs and outputs.
 * Automatically creates connection points based on configuration.
 */
export class Factory extends Phaser.GameObjects.Container implements ConnectionPointOwner {
    public readonly name: string;
    public readonly gridWidth: number;
    public readonly gridHeight: number;
    private readonly tileSize: number;

    // Visual elements
    private background: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;
    private highlight: Phaser.GameObjects.Rectangle;

    // Connection points
    public inputs: ConnectionPoint[] = [];
    public outputs: ConnectionPoint[] = [];

    // Selection state
    private isSelected: boolean = false;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        name: string,
        gridWidth: number,
        gridHeight: number,
        tileSize: number,
        inputCount: number,
        outputCount: number
    ) {
        super(scene, x, y);

        this.name = name;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.tileSize = tileSize;

        const pixelWidth = gridWidth * tileSize;
        const pixelHeight = gridHeight * tileSize;

        // Set container size (for bounds checking)
        this.setSize(pixelWidth, pixelHeight);

        // Create visual background
        this.background = scene.add.rectangle(
            pixelWidth / 2,
            pixelHeight / 2,
            pixelWidth - 4,
            pixelHeight - 4,
            0x4488cc
        );
        this.background.setStrokeStyle(3, 0xffffff, 0.8);

        // Create label
        this.label = scene.add.text(
            pixelWidth / 2,
            pixelHeight / 2,
            name,
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);

        // Create selection highlight
        this.highlight = scene.add.rectangle(
            pixelWidth / 2,
            pixelHeight / 2,
            pixelWidth + 4,
            pixelHeight + 4,
            0xffff00,
            0
        );
        this.highlight.setStrokeStyle(3, 0xffff00, 1);
        this.highlight.setVisible(false);

        // Add to container
        this.add([this.highlight, this.background, this.label]);

        // Add to scene
        scene.add.existing(this);

        // Create connection points
        this.createConnectionPoints(scene, inputCount, outputCount, pixelWidth, pixelHeight);

        // Make the factory itself interactive (for selection/dragging)
        this.background.setInteractive({ cursor: 'move' });
    }

    /**
     * Creates input and output connection points distributed intelligently around factory edges.
     * Rules:
     * - 1xN machines: inputs on top short side, outputs on bottom short side
     * - Nx1 machines: inputs on left short side, outputs on right short side
     * - Square/rectangular (2x2+): inputs on left long side, outputs on right long side
     */
    private createConnectionPoints(
        scene: Phaser.Scene,
        inputCount: number,
        outputCount: number,
        pixelWidth: number,
        pixelHeight: number
    ): void {
        const isVertical = this.gridWidth === 1 && this.gridHeight > 1;  // 1xN (tall)
        const isHorizontal = this.gridHeight === 1 && this.gridWidth > 1; // Nx1 (wide)
        const isSquare = this.gridWidth === this.gridHeight;

        if (isVertical) {
            // 1xN machine: inputs on TOP, outputs on BOTTOM
            this.createConnectionsOnSide(scene, 'INPUT', 'TOP', inputCount, pixelWidth, 0, -2);
            this.createConnectionsOnSide(scene, 'OUTPUT', 'BOTTOM', outputCount, pixelWidth, pixelHeight + 2, 0);
        } else if (isHorizontal) {
            // Nx1 machine: inputs on LEFT, outputs on RIGHT
            this.createConnectionsOnSide(scene, 'INPUT', 'LEFT', inputCount, 0, -2, pixelHeight);
            this.createConnectionsOnSide(scene, 'OUTPUT', 'RIGHT', outputCount, pixelWidth + 2, 0, pixelHeight);
        } else {
            // Square or rectangular: inputs on LEFT, outputs on RIGHT (default)
            this.createConnectionsOnSide(scene, 'INPUT', 'LEFT', inputCount, 0, -2, pixelHeight);
            this.createConnectionsOnSide(scene, 'OUTPUT', 'RIGHT', outputCount, pixelWidth + 2, 0, pixelHeight);
        }
    }

    /**
     * Helper to create connection points along a specific side
     */
    private createConnectionsOnSide(
        scene: Phaser.Scene,
        type: ConnectionType,
        side: ConnectionSide,
        count: number,
        baseX: number,
        offsetX: number,
        sideLength: number
    ): void {
        const isHorizontalSide = side === 'TOP' || side === 'BOTTOM';

        for (let i = 0; i < count; i++) {
            const spacing = sideLength / (count + 1);
            const position = spacing * (i + 1) - sideLength / 2;

            const point = new ConnectionPoint(
                scene,
                this,
                type,
                side,
                isHorizontalSide ? position : offsetX,
                isHorizontalSide ? offsetX : position
            );

            if (type === 'INPUT') {
                this.inputs.push(point);
            } else {
                this.outputs.push(point);
            }
        }
    }

    /**
     * Update all connection point positions when factory moves
     */
    public updateConnectionPoints(): void {
        [...this.inputs, ...this.outputs].forEach(point => point.updatePosition());
    }

    /**
     * Move factory by delta amount
     */
    public moveBy(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
        this.updateConnectionPoints();
    }

    /**
     * Snap factory to grid
     */
    public snapToGrid(): void {
        this.x = Math.round(this.x / this.tileSize) * this.tileSize;
        this.y = Math.round(this.y / this.tileSize) * this.tileSize;
        this.updateConnectionPoints();
    }

    /**
     * Set selection state
     */
    public setSelected(selected: boolean): void {
        this.isSelected = selected;
        this.highlight.setVisible(selected);

        if (selected) {
            this.background.setStrokeStyle(3, 0xffff00, 1);
        } else {
            this.background.setStrokeStyle(3, 0xffffff, 0.8);
        }
    }

    /**
     * Check if point is inside factory bounds
     */
    public containsPoint(worldX: number, worldY: number): boolean {
        const pixelWidth = this.gridWidth * this.tileSize;
        const pixelHeight = this.gridHeight * this.tileSize;

        return (
            worldX >= this.x &&
            worldX <= this.x + pixelWidth &&
            worldY >= this.y &&
            worldY <= this.y + pixelHeight
        );
    }

    /**
     * Find connection point at world position (or near it)
     */
    public getConnectionPointAt(worldX: number, worldY: number, threshold: number = 15): ConnectionPoint | null {
        const allPoints = [...this.inputs, ...this.outputs];

        for (const point of allPoints) {
            const dist = Phaser.Math.Distance.Between(worldX, worldY, point.x, point.y);
            if (dist <= threshold) {
                return point;
            }
        }

        return null;
    }

    /**
     * Get all available (unconnected) connection points of a specific type
     */
    public getAvailablePoints(type: ConnectionType): ConnectionPoint[] {
        const points = type === 'INPUT' ? this.inputs : this.outputs;
        return points.filter(p => p.isAvailable());
    }

    /**
     * ConnectionPointOwner interface callback
     */
    public onConnectionChanged(): void {
        // Could update visuals or trigger events
    }

    /**
     * Get the interactive game object (for dragging)
     */
    public getInteractiveObject(): Phaser.GameObjects.Rectangle {
        return this.background;
    }

    /**
     * Clean up all resources
     */
    public destroyFactory(): void {
        // Destroy all connection points
        [...this.inputs, ...this.outputs].forEach(point => point.destroy());

        // Destroy the container (and all children)
        this.destroy();
    }
}
