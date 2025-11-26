import Phaser from "phaser";
import { ConnectionPoint } from "./ConnectionPoint";
import { BeltEndpoint } from "./BeltEndpoint";
import { generateSmartPath, Point } from "../utils/BeltRouting";

/**
 * BeltConnection can be either a factory/junction ConnectionPoint or a free-standing BeltEndpoint
 */
export type BeltConnection = ConnectionPoint | BeltEndpoint;

/**
 * Represents a belt connection between two connection points.
 * Can connect to factory/junction ConnectionPoints or free-standing BeltEndpoints.
 * Automatically routes using orthogonal pathfinding.
 */
export class Belt {
    public readonly startPoint: BeltConnection;
    public readonly endPoint: BeltConnection;

    // Visual elements
    private graphics: Phaser.GameObjects.Graphics;
    private hitArea: Phaser.GameObjects.Graphics;

    // Path waypoints
    public path: Point[] = [];

    // Belt properties
    public layer: number = 0; // For crossing belts at different heights (0, 1, 2)

    // Selection state
    private isSelected: boolean = false;

    // Scene reference
    private scene: Phaser.Scene;

    constructor(
        scene: Phaser.Scene,
        startPoint: BeltConnection,
        endPoint: BeltConnection,
        layer: number = 0
    ) {
        this.scene = scene;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.layer = layer;

        // Create graphics for rendering
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(50 + layer * 10); // Higher layers render above lower ones

        // Create hit area graphics (invisible, larger, for easier clicking)
        this.hitArea = scene.add.graphics();
        this.hitArea.setDepth(50 + layer * 10);

        // Mark connection points as connected
        this.startPoint.setConnected(this);
        this.endPoint.setConnected(this);

        // Generate the path
        this.updatePath();

        // Make interactive
        this.setupInteraction();
    }

    /**
     * Generate routing path between connection points.
     * Call this when connection points move to update the belt path.
     */
    public updatePath(): void {
        const start = { x: this.startPoint.x, y: this.startPoint.y };
        const end = { x: this.endPoint.x, y: this.endPoint.y };

        const startDir = this.startPoint.getDirectionVector();
        const endDir = this.endPoint.getDirectionVector();

        this.path = generateSmartPath(start, end, startDir, endDir);

        this.draw();
        this.updateHitArea();
    }

    /**
     * Draw the belt path
     */
    private draw(): void {
        this.graphics.clear();
        this.hitArea.clear();

        if (this.path.length < 2) return;

        // Determine color based on layer (for visual distinction)
        const layerColors = [0x999999, 0xaaaaaa, 0xbbbbbb];
        const baseColor = layerColors[this.layer] || 0x999999;
        const width = 6;

        // Draw hit area (thicker, invisible)
        this.hitArea.lineStyle(width + 10, 0xff0000, 0); // Invisible but interactive
        this.drawPath(this.hitArea);

        // Draw selection highlight
        if (this.isSelected) {
            this.graphics.lineStyle(width + 4, 0xffff00, 0.6);
            this.drawPath(this.graphics);
        }

        // Draw main belt
        this.graphics.lineStyle(width, baseColor, 1.0);
        this.drawPath(this.graphics);

        // Draw layer indicator if not ground level
        if (this.layer > 0) {
            this.graphics.lineStyle(1, 0xffffff, 0.3);
            this.graphics.lineStyle(width - 2, baseColor, 0.5);
            this.drawPath(this.graphics);
        }

        // Draw directional arrows along the path
        this.drawDirectionArrows();
    }

    /**
     * Draw the path using the waypoints
     */
    private drawPath(g: Phaser.GameObjects.Graphics): void {
        g.beginPath();
        g.moveTo(this.path[0].x, this.path[0].y);

        for (let i = 1; i < this.path.length; i++) {
            g.lineTo(this.path[i].x, this.path[i].y);
        }

        g.strokePath();
    }

    /**
     * Draw small arrows to indicate flow direction
     */
    private drawDirectionArrows(): void {
        const arrowSpacing = 40;
        const arrowSize = 6;

        // Calculate total path length
        let totalLength = 0;
        for (let i = 1; i < this.path.length; i++) {
            const dx = this.path[i].x - this.path[i - 1].x;
            const dy = this.path[i].y - this.path[i - 1].y;
            totalLength += Math.sqrt(dx * dx + dy * dy);
        }

        // Draw arrows at intervals
        let currentLength = arrowSpacing / 2;
        while (currentLength < totalLength) {
            const pos = this.getPointAlongPath(currentLength);
            if (pos) {
                this.drawArrow(pos.x, pos.y, pos.angle);
            }
            currentLength += arrowSpacing;
        }
    }

    /**
     * Get a point along the path at a specific distance
     */
    private getPointAlongPath(distance: number): { x: number; y: number; angle: number } | null {
        let accumulated = 0;

        for (let i = 1; i < this.path.length; i++) {
            const p1 = this.path[i - 1];
            const p2 = this.path[i];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);

            if (accumulated + segmentLength >= distance) {
                // Point is on this segment
                const t = (distance - accumulated) / segmentLength;
                return {
                    x: p1.x + dx * t,
                    y: p1.y + dy * t,
                    angle: Math.atan2(dy, dx)
                };
            }

            accumulated += segmentLength;
        }

        return null;
    }

    /**
     * Draw a small directional arrow
     */
    private drawArrow(x: number, y: number, angle: number): void {
        const size = 4;

        this.graphics.fillStyle(0xffffff, 0.6);
        this.graphics.fillTriangle(
            x + Math.cos(angle) * size, y + Math.sin(angle) * size,
            x + Math.cos(angle + 2.5) * size * 0.6, y + Math.sin(angle + 2.5) * size * 0.6,
            x + Math.cos(angle - 2.5) * size * 0.6, y + Math.sin(angle - 2.5) * size * 0.6
        );
    }

    /**
     * Setup interaction for selection
     */
    private setupInteraction(): void {
        // Create hit area using path bounds
        this.updateHitArea();
    }

    /**
     * Update the hit area for clicking
     */
    private updateHitArea(): void {
        if (this.path.length < 2) return;

        // Calculate bounds
        let minX = this.path[0].x;
        let maxX = this.path[0].x;
        let minY = this.path[0].y;
        let maxY = this.path[0].y;

        for (const point of this.path) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }

        const padding = 15;
        const bounds = new Phaser.Geom.Rectangle(
            minX - padding,
            minY - padding,
            maxX - minX + padding * 2,
            maxY - minY + padding * 2
        );

        this.hitArea.setInteractive(bounds, Phaser.Geom.Rectangle.Contains);
    }

    /**
     * Check if a world point is on this belt
     */
    public containsPoint(worldX: number, worldY: number): boolean {
        const threshold = 10;

        for (let i = 1; i < this.path.length; i++) {
            const p1 = this.path[i - 1];
            const p2 = this.path[i];

            const dist = this.pointToSegmentDistance(worldX, worldY, p1.x, p1.y, p2.x, p2.y);
            if (dist <= threshold) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate distance from point to line segment
     */
    private pointToSegmentDistance(
        px: number, py: number,
        x1: number, y1: number,
        x2: number, y2: number
    ): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;

        return Math.sqrt((px - nearestX) * (px - nearestX) + (py - nearestY) * (py - nearestY));
    }

    /**
     * Set selection state
     */
    public setSelected(selected: boolean): void {
        this.isSelected = selected;
        this.draw();
    }

    /**
     * Change belt layer (for crossing over other belts)
     */
    public setLayer(layer: number): void {
        this.layer = Phaser.Math.Clamp(layer, 0, 2);
        this.graphics.setDepth(50 + this.layer * 10);
        this.hitArea.setDepth(50 + this.layer * 10);
        this.draw();
    }

    /**
     * Get interactive graphics object
     */
    public getInteractiveObject(): Phaser.GameObjects.Graphics {
        return this.hitArea;
    }

    /**
     * Clean up and disconnect
     */
    public destroyBelt(): void {
        // Disconnect from connection points
        this.startPoint.setConnected(null);
        this.endPoint.setConnected(null);

        // Destroy graphics
        this.graphics.destroy();
        this.hitArea.destroy();
    }
}
