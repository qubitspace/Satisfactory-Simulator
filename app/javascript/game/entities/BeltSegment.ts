import Phaser from "phaser";

/**
 * Direction a belt segment flows
 */
export type BeltDirection = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';

/**
 * Type of belt segment visual
 */
export type BeltSegmentType = 'STRAIGHT' | 'CORNER';

/**
 * A single grid-aligned belt segment.
 * Belts are built by placing individual segments that connect to form chains.
 */
export class BeltSegment {
    public readonly scene: Phaser.Scene;
    public readonly gridX: number;  // Grid coordinates
    public readonly gridY: number;
    private readonly tileSize: number;

    // Flow direction (which way items travel)
    public flowDirection: BeltDirection;

    // Visual elements
    private graphics: Phaser.GameObjects.Graphics;
    private container: Phaser.GameObjects.Container;

    // Belt layer (for crossing belts)
    public layer: number = 0; // 0 = ground, 1 = elevated, 2 = high

    // Selection state
    private isSelected: boolean = false;
    private isHovered: boolean = false;

    // Connected segments (neighbors)
    public connectedSegments: Map<BeltDirection, BeltSegment> = new Map();

    // Visual type (straight or corner)
    private segmentType: BeltSegmentType = 'STRAIGHT';

    constructor(
        scene: Phaser.Scene,
        gridX: number,
        gridY: number,
        tileSize: number,
        flowDirection: BeltDirection,
        layer: number = 0
    ) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = tileSize;
        this.flowDirection = flowDirection;
        this.layer = layer;

        // Create visual container
        this.container = scene.add.container(
            gridX * tileSize,
            gridY * tileSize
        );
        // Layer affects depth: layer 0 = 40, layer 1 = 45, layer 2 = 50
        this.container.setDepth(40 + layer * 5);

        // Create graphics
        this.graphics = scene.add.graphics();
        this.container.add(this.graphics);

        // Draw initial visual
        this.draw();

        // Make interactive
        this.setupInteraction();
    }

    /**
     * Get world position (top-left corner)
     */
    public getWorldPosition(): { x: number; y: number } {
        return {
            x: this.gridX * this.tileSize,
            y: this.gridY * this.tileSize
        };
    }

    /**
     * Get center world position
     */
    public getCenterPosition(): { x: number; y: number } {
        return {
            x: this.gridX * this.tileSize + this.tileSize / 2,
            y: this.gridY * this.tileSize + this.tileSize / 2
        };
    }

    /**
     * Connect this segment to a neighbor
     */
    public connectTo(direction: BeltDirection, segment: BeltSegment): void {
        this.connectedSegments.set(direction, segment);
        this.updateSegmentType();
        this.draw();
    }

    /**
     * Disconnect from a neighbor
     */
    public disconnectFrom(direction: BeltDirection): void {
        this.connectedSegments.delete(direction);
        this.updateSegmentType();
        this.draw();
    }

    /**
     * Update visual type based on connections
     */
    private updateSegmentType(): void {
        const connectionCount = this.connectedSegments.size;

        if (connectionCount === 0) {
            this.segmentType = 'STRAIGHT';
        } else if (connectionCount === 1) {
            this.segmentType = 'STRAIGHT';
        } else {
            // Check if connections are perpendicular (corner) or aligned (straight)
            const directions = Array.from(this.connectedSegments.keys());
            const isCorner = this.areDirectionsPerpendicular(directions[0], directions[1]);
            this.segmentType = isCorner ? 'CORNER' : 'STRAIGHT';
        }
    }

    /**
     * Check if two directions are perpendicular
     */
    private areDirectionsPerpendicular(dir1: BeltDirection, dir2: BeltDirection): boolean {
        const horizontal = ['EAST', 'WEST'];
        const vertical = ['NORTH', 'SOUTH'];

        return (
            (horizontal.includes(dir1) && vertical.includes(dir2)) ||
            (vertical.includes(dir1) && horizontal.includes(dir2))
        );
    }

    /**
     * Draw the belt segment
     */
    private draw(): void {
        this.graphics.clear();

        const width = this.tileSize;
        const beltWidth = 6;
        const halfBelt = beltWidth / 2;

        // Base color varies by layer
        let baseColor = 0x888888;
        if (this.layer === 1) baseColor = 0x999999; // Slightly lighter for elevated
        if (this.layer === 2) baseColor = 0xaaaaaa; // Even lighter for high

        // Override with selection/hover
        let color = baseColor;
        if (this.isSelected) color = 0xffff00;
        else if (this.isHovered) color = 0xaaaaaa;

        // Draw supports for elevated belts
        if (this.layer > 0) {
            this.drawSupports();
        }

        this.graphics.lineStyle(beltWidth, color, 1.0);

        if (this.segmentType === 'STRAIGHT') {
            // Draw straight segment based on flow direction
            if (this.flowDirection === 'NORTH' || this.flowDirection === 'SOUTH') {
                // Vertical
                this.graphics.beginPath();
                this.graphics.moveTo(width / 2, 0);
                this.graphics.lineTo(width / 2, width);
                this.graphics.strokePath();
            } else {
                // Horizontal
                this.graphics.beginPath();
                this.graphics.moveTo(0, width / 2);
                this.graphics.lineTo(width, width / 2);
                this.graphics.strokePath();
            }
        } else {
            // Draw corner - determine which corner based on connections
            const center = width / 2;
            const directions = Array.from(this.connectedSegments.keys());

            if (directions.length >= 2) {
                const [dir1, dir2] = directions;

                // Draw L-shaped corner
                this.graphics.beginPath();

                // Start point based on first direction
                if (dir1 === 'NORTH') this.graphics.moveTo(center, 0);
                else if (dir1 === 'SOUTH') this.graphics.moveTo(center, width);
                else if (dir1 === 'EAST') this.graphics.moveTo(width, center);
                else if (dir1 === 'WEST') this.graphics.moveTo(0, center);

                // Corner point
                this.graphics.lineTo(center, center);

                // End point based on second direction
                if (dir2 === 'NORTH') this.graphics.lineTo(center, 0);
                else if (dir2 === 'SOUTH') this.graphics.lineTo(center, width);
                else if (dir2 === 'EAST') this.graphics.lineTo(width, center);
                else if (dir2 === 'WEST') this.graphics.lineTo(0, center);

                this.graphics.strokePath();
            }
        }

        // Draw direction indicator (small arrow)
        this.drawDirectionArrow();
    }

    /**
     * Draw support pillars for elevated belts
     */
    private drawSupports(): void {
        const center = this.tileSize / 2;
        const supportColor = 0x444444;

        // Draw small vertical lines as supports
        this.graphics.lineStyle(2, supportColor, 0.6);

        if (this.layer === 1) {
            // Single support in center
            this.graphics.beginPath();
            this.graphics.moveTo(center, center + 3);
            this.graphics.lineTo(center, this.tileSize - 2);
            this.graphics.strokePath();
        } else if (this.layer === 2) {
            // Two supports for higher elevation
            this.graphics.beginPath();
            this.graphics.moveTo(center - 6, center + 4);
            this.graphics.lineTo(center - 6, this.tileSize - 2);
            this.graphics.strokePath();

            this.graphics.beginPath();
            this.graphics.moveTo(center + 6, center + 4);
            this.graphics.lineTo(center + 6, this.tileSize - 2);
            this.graphics.strokePath();
        }
    }

    /**
     * Draw a small arrow showing flow direction
     */
    private drawDirectionArrow(): void {
        const center = this.tileSize / 2;
        const arrowSize = 4;

        let angle = 0;
        if (this.flowDirection === 'NORTH') angle = -Math.PI / 2;
        else if (this.flowDirection === 'SOUTH') angle = Math.PI / 2;
        else if (this.flowDirection === 'EAST') angle = 0;
        else if (this.flowDirection === 'WEST') angle = Math.PI;

        this.graphics.fillStyle(0xffffff, 0.6);
        this.graphics.fillTriangle(
            center + Math.cos(angle) * arrowSize,
            center + Math.sin(angle) * arrowSize,
            center + Math.cos(angle + 2.5) * arrowSize * 0.6,
            center + Math.sin(angle + 2.5) * arrowSize * 0.6,
            center + Math.cos(angle - 2.5) * arrowSize * 0.6,
            center + Math.sin(angle - 2.5) * arrowSize * 0.6
        );
    }

    /**
     * Setup interaction
     */
    private setupInteraction(): void {
        const hitArea = new Phaser.Geom.Rectangle(0, 0, this.tileSize, this.tileSize);
        this.container.setSize(this.tileSize, this.tileSize);
        this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.container.on('pointerover', () => {
            this.isHovered = true;
            this.draw();
        });

        this.container.on('pointerout', () => {
            this.isHovered = false;
            this.draw();
        });
    }

    /**
     * Check if a world point is on this segment
     */
    public containsPoint(worldX: number, worldY: number): boolean {
        const wx = this.gridX * this.tileSize;
        const wy = this.gridY * this.tileSize;

        return worldX >= wx &&
               worldX <= wx + this.tileSize &&
               worldY >= wy &&
               worldY <= wy + this.tileSize;
    }

    /**
     * Set selection state
     */
    public setSelected(selected: boolean): void {
        this.isSelected = selected;
        this.draw();
    }

    /**
     * Set hover state
     */
    public setHovered(hovered: boolean): void {
        this.isHovered = hovered;
        this.draw();
    }

    /**
     * Get interactive object
     */
    public getInteractiveObject(): Phaser.GameObjects.Container {
        return this.container;
    }

    /**
     * Get opposite direction
     */
    public static getOppositeDirection(dir: BeltDirection): BeltDirection {
        switch (dir) {
            case 'NORTH': return 'SOUTH';
            case 'SOUTH': return 'NORTH';
            case 'EAST': return 'WEST';
            case 'WEST': return 'EAST';
        }
    }

    /**
     * Rotate flow direction clockwise
     */
    public rotateClockwise(): void {
        const rotationMap: Record<BeltDirection, BeltDirection> = {
            'NORTH': 'EAST',
            'EAST': 'SOUTH',
            'SOUTH': 'WEST',
            'WEST': 'NORTH'
        };
        this.flowDirection = rotationMap[this.flowDirection];
        this.draw();
    }

    /**
     * Rotate flow direction counter-clockwise
     */
    public rotateCounterClockwise(): void {
        const rotationMap: Record<BeltDirection, BeltDirection> = {
            'NORTH': 'WEST',
            'WEST': 'SOUTH',
            'SOUTH': 'EAST',
            'EAST': 'NORTH'
        };
        this.flowDirection = rotationMap[this.flowDirection];
        this.draw();
    }

    /**
     * Get direction from offset
     */
    public static getDirectionFromOffset(dx: number, dy: number): BeltDirection | null {
        if (dx === 1 && dy === 0) return 'EAST';
        if (dx === -1 && dy === 0) return 'WEST';
        if (dx === 0 && dy === 1) return 'SOUTH';
        if (dx === 0 && dy === -1) return 'NORTH';
        return null;
    }

    /**
     * Get offset from direction
     */
    public static getOffsetFromDirection(dir: BeltDirection): { dx: number; dy: number } {
        switch (dir) {
            case 'NORTH': return { dx: 0, dy: -1 };
            case 'SOUTH': return { dx: 0, dy: 1 };
            case 'EAST': return { dx: 1, dy: 0 };
            case 'WEST': return { dx: -1, dy: 0 };
        }
    }

    /**
     * Destroy segment
     */
    public destroy(): void {
        this.container.destroy();
        this.graphics.destroy();
    }
}
