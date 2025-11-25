import Phaser from "phaser";
import { ConnectionPoint, ConnectionPointOwner, ConnectionType } from "./ConnectionPoint";

/**
 * Represents a junction node for splitting and merging belts.
 * Has 4 connection points (one per side) that auto-configure as inputs/outputs.
 * Maximum of 4 connections, can handle 1→3 split, 3→1 merge, 2→2, etc.
 */
export class Junction extends Phaser.GameObjects.Container implements ConnectionPointOwner {
    private readonly tileSize: number;

    // Visual elements
    private background: Phaser.GameObjects.Arc;
    private highlight: Phaser.GameObjects.Arc;

    // Connection points (one per cardinal direction)
    public connectionPoints: Map<string, ConnectionPoint> = new Map();

    // Selection state
    private isSelected: boolean = false;

    // Size in pixels
    private readonly size: number = 24;

    constructor(scene: Phaser.Scene, x: number, y: number, tileSize: number) {
        super(scene, x, y);

        this.tileSize = tileSize;

        // Create circular background
        this.background = scene.add.circle(0, 0, this.size / 2, 0x888888);
        this.background.setStrokeStyle(3, 0xffffff, 0.8);

        // Create selection highlight
        this.highlight = scene.add.circle(0, 0, this.size / 2 + 4, 0xffff00, 0);
        this.highlight.setStrokeStyle(3, 0xffff00, 1);
        this.highlight.setVisible(false);

        // Add to container
        this.add([this.highlight, this.background]);

        // Add to scene
        scene.add.existing(this);

        // Create connection points on all 4 sides
        this.createConnectionPoints(scene);

        // Make interactive
        this.background.setInteractive({ cursor: 'move' });

        // Set container size for bounds checking
        this.setSize(this.size, this.size);
    }

    /**
     * Create connection points on all four cardinal directions.
     * They start as neutral and auto-configure based on connections.
     */
    private createConnectionPoints(scene: Phaser.Scene): void {
        const offset = this.size / 2 + 4;

        // Top
        const top = new ConnectionPoint(scene, this, 'INPUT', 'TOP', 0, -offset);
        this.connectionPoints.set('TOP', top);

        // Right
        const right = new ConnectionPoint(scene, this, 'OUTPUT', 'RIGHT', offset, 0);
        this.connectionPoints.set('RIGHT', right);

        // Bottom
        const bottom = new ConnectionPoint(scene, this, 'OUTPUT', 'BOTTOM', 0, offset);
        this.connectionPoints.set('BOTTOM', bottom);

        // Left
        const left = new ConnectionPoint(scene, this, 'INPUT', 'LEFT', -offset, 0);
        this.connectionPoints.set('LEFT', left);
    }

    /**
     * Update all connection point positions
     */
    public updateConnectionPoints(): void {
        this.connectionPoints.forEach(point => point.updatePosition());
    }

    /**
     * Move junction by delta amount
     */
    public moveBy(dx: number, dy: number): void {
        this.x += dx;
        this.y += dy;
        this.updateConnectionPoints();
    }

    /**
     * Snap to grid (junctions snap to tile centers)
     */
    public snapToGrid(): void {
        const half = this.tileSize / 2;
        const tileX = Math.round((this.x - half) / this.tileSize);
        const tileY = Math.round((this.y - half) / this.tileSize);

        this.x = tileX * this.tileSize + half;
        this.y = tileY * this.tileSize + half;

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
     * Check if point is inside junction bounds
     */
    public containsPoint(worldX: number, worldY: number): boolean {
        const dist = Phaser.Math.Distance.Between(worldX, worldY, this.x, this.y);
        return dist <= this.size / 2 + 5; // Small padding for easier clicking
    }

    /**
     * Find connection point at world position
     */
    public getConnectionPointAt(worldX: number, worldY: number, threshold: number = 15): ConnectionPoint | null {
        for (const point of this.connectionPoints.values()) {
            const dist = Phaser.Math.Distance.Between(worldX, worldY, point.x, point.y);
            if (dist <= threshold) {
                return point;
            }
        }
        return null;
    }

    /**
     * Get all available connection points
     */
    public getAvailablePoints(): ConnectionPoint[] {
        return Array.from(this.connectionPoints.values()).filter(p => p.isAvailable());
    }

    /**
     * Get count of connected inputs and outputs
     */
    public getConnectionCounts(): { inputs: number; outputs: number } {
        let inputs = 0;
        let outputs = 0;

        this.connectionPoints.forEach(point => {
            if (point.connectedBelt) {
                if (point.type === 'INPUT') {
                    inputs++;
                } else {
                    outputs++;
                }
            }
        });

        return { inputs, outputs };
    }

    /**
     * Update visuals based on connection pattern
     */
    public onConnectionChanged(): void {
        const { inputs, outputs } = this.getConnectionCounts();
        const total = inputs + outputs;

        // Change color based on connection type
        if (total === 0) {
            this.background.setFillStyle(0x888888); // Neutral gray
        } else if (inputs > outputs) {
            this.background.setFillStyle(0x44ff44); // Green for splitter
        } else if (outputs > inputs) {
            this.background.setFillStyle(0xff4444); // Red for merger
        } else {
            this.background.setFillStyle(0x4488ff); // Blue for balanced
        }
    }

    /**
     * Get interactive object
     */
    public getInteractiveObject(): Phaser.GameObjects.Arc {
        return this.background;
    }

    /**
     * Clean up
     */
    public destroyJunction(): void {
        this.connectionPoints.forEach(point => point.destroy());
        this.connectionPoints.clear();
        this.destroy();
    }
}
