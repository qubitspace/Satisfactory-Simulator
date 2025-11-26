import Phaser from 'phaser';

/**
 * BeltEndpoint - A draggable connection point between belt segments
 * Unlike ConnectionPoint (which is attached to factories/junctions),
 * BeltEndpoint is a free-standing point that can be repositioned
 */
export class BeltEndpoint extends Phaser.GameObjects.Container {
    private circle: Phaser.GameObjects.Graphics;
    private connectedBelts: Set<any>; // Belts connected to this endpoint
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.connectedBelts = new Set();

        // Create visual representation
        this.circle = scene.add.graphics();
        this.add(this.circle);

        this.drawNormal();

        // Make interactive
        this.setSize(16, 16);
        this.setInteractive(
            new Phaser.Geom.Circle(0, 0, 8),
            Phaser.Geom.Circle.Contains
        );

        // Setup hover effects
        this.on('pointerover', () => {
            if (!this.isDragging) {
                this.drawHover();
            }
        });

        this.on('pointerout', () => {
            if (!this.isDragging) {
                this.drawNormal();
            }
        });

        scene.add.existing(this);
    }

    private drawNormal(): void {
        this.circle.clear();
        this.circle.fillStyle(0x888888, 1);
        this.circle.fillCircle(0, 0, 6);
        this.circle.lineStyle(2, 0x444444, 1);
        this.circle.strokeCircle(0, 0, 6);
    }

    private drawHover(): void {
        this.circle.clear();
        this.circle.fillStyle(0xaaaaaa, 1);
        this.circle.fillCircle(0, 0, 7);
        this.circle.lineStyle(2, 0x666666, 1);
        this.circle.strokeCircle(0, 0, 7);
    }

    private drawDragging(): void {
        this.circle.clear();
        this.circle.fillStyle(0xcccccc, 1);
        this.circle.fillCircle(0, 0, 8);
        this.circle.lineStyle(2, 0x888888, 1);
        this.circle.strokeCircle(0, 0, 8);
    }

    public startDrag(): void {
        this.isDragging = true;
        this.dragStartX = this.x;
        this.dragStartY = this.y;
        this.drawDragging();
        this.setDepth(1000); // Bring to front while dragging
    }

    public updateDragPosition(worldX: number, worldY: number): void {
        if (!this.isDragging) return;

        this.x = worldX;
        this.y = worldY;

        // Update all connected belts
        this.updateConnectedBelts();
    }

    public endDrag(): void {
        this.isDragging = false;
        this.drawNormal();
        this.setDepth(0);
    }

    public cancelDrag(): void {
        if (!this.isDragging) return;

        this.x = this.dragStartX;
        this.y = this.dragStartY;
        this.isDragging = false;
        this.drawNormal();
        this.setDepth(0);

        this.updateConnectedBelts();
    }

    public addBelt(belt: any): void {
        this.connectedBelts.add(belt);
    }

    public removeBelt(belt: any): void {
        this.connectedBelts.delete(belt);

        // If no belts connected, remove this endpoint
        if (this.connectedBelts.size === 0) {
            this.destroy();
        }
    }

    /**
     * Set connected belt (compatible with ConnectionPoint interface)
     */
    public setConnected(belt: any | null): void {
        if (belt === null) {
            // Remove all belts
            this.connectedBelts.clear();
        } else {
            this.addBelt(belt);
        }
    }

    public getConnectedBelts(): Set<any> {
        return this.connectedBelts;
    }

    private updateConnectedBelts(): void {
        this.connectedBelts.forEach(belt => {
            if (belt.updatePath) {
                belt.updatePath();
            }
        });
    }

    /**
     * Get direction vector based on connected belts
     * For output direction: use the incoming belt's direction
     * For input direction: use the opposite of outgoing belt's direction
     */
    public getDirectionVector(): { x: number, y: number } {
        // If we have an incoming direction, that's the direction we continue in
        const incoming = this.getIncomingDirection();
        if (incoming) {
            return incoming;
        }

        // If we have an outgoing direction, we enter in the opposite direction
        const outgoing = this.getOutgoingDirection();
        if (outgoing) {
            return { x: -outgoing.x, y: -outgoing.y };
        }

        // Default to no specific direction - let routing decide
        return { x: 0, y: 0 };
    }

    /**
     * Get the incoming direction from connected belts
     */
    public getIncomingDirection(): { x: number, y: number } | null {
        for (const belt of this.connectedBelts) {
            if (belt.endPoint === this && belt.path && belt.path.length >= 2) {
                const lastSeg = belt.path[belt.path.length - 1];
                const prevSeg = belt.path[belt.path.length - 2];
                const dx = lastSeg.x - prevSeg.x;
                const dy = lastSeg.y - prevSeg.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    return { x: dx / len, y: dy / len };
                }
            }
        }
        return null;
    }

    /**
     * Get the outgoing direction to connected belts
     */
    public getOutgoingDirection(): { x: number, y: number } | null {
        for (const belt of this.connectedBelts) {
            if (belt.startPoint === this && belt.path && belt.path.length >= 2) {
                const firstSeg = belt.path[0];
                const nextSeg = belt.path[1];
                const dx = nextSeg.x - firstSeg.x;
                const dy = nextSeg.y - firstSeg.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0) {
                    return { x: dx / len, y: dy / len };
                }
            }
        }
        return null;
    }

    public getConnectionCount(): number {
        return this.connectedBelts.size;
    }
}
