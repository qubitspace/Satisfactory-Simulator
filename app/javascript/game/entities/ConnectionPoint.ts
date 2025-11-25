import Phaser from "phaser";
import { Belt } from "./Belt";

export type ConnectionType = 'INPUT' | 'OUTPUT';
export type ConnectionSide = 'TOP' | 'RIGHT' | 'BOTTOM' | 'LEFT';

export interface ConnectionPointOwner {
    x: number;
    y: number;
    onConnectionChanged?: () => void;
}

/**
 * Represents a connection point (input or output port) on a Factory or Junction.
 * Handles visual representation and connection management.
 */
export class ConnectionPoint {
    public readonly type: ConnectionType;
    public readonly side: ConnectionSide;
    public readonly owner: ConnectionPointOwner;

    // World position (calculated from owner position + offset)
    public x: number = 0;
    public y: number = 0;

    // Visual elements
    private circle: Phaser.GameObjects.Arc;
    private arrow?: Phaser.GameObjects.Triangle;

    // Connection state
    public connectedBelt: Belt | null = null;
    private isHovered: boolean = false;

    // Relative position offset from owner (in pixels)
    private offsetX: number;
    private offsetY: number;

    constructor(
        scene: Phaser.Scene,
        owner: ConnectionPointOwner,
        type: ConnectionType,
        side: ConnectionSide,
        offsetX: number,
        offsetY: number
    ) {
        this.owner = owner;
        this.type = type;
        this.side = side;
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        // Calculate initial world position
        this.updatePosition();

        // Create visual representation
        const color = type === 'INPUT' ? 0x44ff44 : 0xff4444;
        this.circle = scene.add.circle(this.x, this.y, 6, color);
        this.circle.setStrokeStyle(2, 0xffffff);
        this.circle.setDepth(100);
        this.circle.setAlpha(0.8);

        // Add directional arrow indicator
        this.arrow = this.createArrow(scene);

        // Make interactive
        this.circle.setInteractive({ cursor: 'pointer' });
    }

    private createArrow(scene: Phaser.Scene): Phaser.GameObjects.Triangle {
        const arrowSize = 8;
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0;

        // Arrow points in direction of flow (into input, out of output)
        const isInput = this.type === 'INPUT';

        switch (this.side) {
            case 'TOP':
                x1 = 0; y1 = isInput ? -arrowSize : arrowSize;
                x2 = -arrowSize/2; y2 = isInput ? arrowSize : -arrowSize;
                x3 = arrowSize/2; y3 = isInput ? arrowSize : -arrowSize;
                break;
            case 'RIGHT':
                x1 = isInput ? -arrowSize : arrowSize; y1 = 0;
                x2 = isInput ? arrowSize : -arrowSize; y2 = -arrowSize/2;
                x3 = isInput ? arrowSize : -arrowSize; y3 = arrowSize/2;
                break;
            case 'BOTTOM':
                x1 = 0; y1 = isInput ? arrowSize : -arrowSize;
                x2 = -arrowSize/2; y2 = isInput ? -arrowSize : arrowSize;
                x3 = arrowSize/2; y3 = isInput ? -arrowSize : arrowSize;
                break;
            case 'LEFT':
                x1 = isInput ? arrowSize : -arrowSize; y1 = 0;
                x2 = isInput ? -arrowSize : arrowSize; y2 = -arrowSize/2;
                x3 = isInput ? -arrowSize : arrowSize; y3 = arrowSize/2;
                break;
        }

        const arrow = scene.add.triangle(
            this.x, this.y,
            x1, y1, x2, y2, x3, y3,
            0xffffff, 0.6
        );
        arrow.setDepth(101);

        return arrow;
    }

    /**
     * Update world position based on owner's current position
     */
    public updatePosition(): void {
        this.x = this.owner.x + this.offsetX;
        this.y = this.owner.y + this.offsetY;

        if (this.circle) {
            this.circle.setPosition(this.x, this.y);
        }
        if (this.arrow) {
            this.arrow.setPosition(this.x, this.y);
        }
    }

    /**
     * Check if this point can connect to another
     */
    public canConnectTo(other: ConnectionPoint): boolean {
        // Can't connect to self or same owner
        if (this === other || this.owner === other.owner) {
            return false;
        }

        // Input can only connect to output and vice versa
        if (this.type === other.type) {
            return false;
        }

        // Can't have multiple connections (for now)
        if (this.connectedBelt !== null || other.connectedBelt !== null) {
            return false;
        }

        return true;
    }

    /**
     * Set connection state
     */
    public setConnected(belt: Belt | null): void {
        this.connectedBelt = belt;
        this.updateVisuals();
        this.owner.onConnectionChanged?.();
    }

    /**
     * Set hover state for visual feedback
     */
    public setHovered(hovered: boolean): void {
        this.isHovered = hovered;
        this.updateVisuals();
    }

    /**
     * Check if this connection is available for new belts
     */
    public isAvailable(): boolean {
        return this.connectedBelt === null;
    }

    /**
     * Update visual appearance based on state
     */
    private updateVisuals(): void {
        const baseColor = this.type === 'INPUT' ? 0x44ff44 : 0xff4444;

        if (this.connectedBelt) {
            // Connected: solid and brighter
            this.circle.setFillStyle(baseColor);
            this.circle.setAlpha(1.0);
            this.circle.setScale(1.2);
        } else if (this.isHovered) {
            // Hovered: pulsing effect
            this.circle.setFillStyle(0xffff00);
            this.circle.setAlpha(1.0);
            this.circle.setScale(1.4);
        } else {
            // Default: translucent
            this.circle.setFillStyle(baseColor);
            this.circle.setAlpha(0.6);
            this.circle.setScale(1.0);
        }
    }

    /**
     * Get the Phaser game object for event handling
     */
    public getInteractiveObject(): Phaser.GameObjects.Arc {
        return this.circle;
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        this.circle.destroy();
        this.arrow?.destroy();
    }

    /**
     * Get direction vector for belt routing.
     * Represents the direction the belt travels as it passes through this connection.
     * - For OUTPUTs: direction belt exits (away from machine)
     * - For INPUTs: direction belt enters (into machine from outside)
     */
    public getDirectionVector(): { x: number, y: number } {
        const isInput = this.type === 'INPUT';

        switch (this.side) {
            case 'TOP':
                // Input on top: belt enters from above going down
                // Output on top: belt exits going up
                return { x: 0, y: isInput ? 1 : -1 };
            case 'RIGHT':
                // Input on right: belt enters from right going left
                // Output on right: belt exits going right
                return { x: isInput ? -1 : 1, y: 0 };
            case 'BOTTOM':
                // Input on bottom: belt enters from below going up
                // Output on bottom: belt exits going down
                return { x: 0, y: isInput ? -1 : 1 };
            case 'LEFT':
                // Input on left: belt enters from left going right
                // Output on left: belt exits going left
                return { x: isInput ? 1 : -1, y: 0 };
        }
    }
}
