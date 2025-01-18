// /app/javascript/simulation/systems/transport-system.ts

import Phaser from 'phaser';

export interface TransportPoint {
    x: number;
    y: number;
    isHandle?: boolean;
    connection?: {
        nodeId: string;  // ID of factory or logistic node
        nodeType: 'factory' | 'splitter' | 'merger';
        portIndex: number;  // Index of the input/output port
        direction: 'north' | 'south' | 'east' | 'west';
    };
}

export interface Transport {
    id: string;
    points: TransportPoint[];
    graphics: Phaser.GameObjects.Graphics;
    type: 'belt' | 'pipe';
}

export class TransportSystem {
    private currentTransport: Transport | null = null;
    private transports: Transport[] = [];
    private isPlacing: boolean = false;
    private isDraggingPoint: boolean = false;
    private selectedPoint: {
        transport: Transport,
        point: TransportPoint,
        index: number
    } | null = null;
    private lastClickTime: number = 0;
    private type: 'belt' | 'pipe' = 'belt';
    private gridSize = 64;
    private handleSize = 10;
    private connectingToTransport: Transport | null = null;
    private connectingFromPoint: TransportPoint | null = null;


    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInputHandlers();
    }

    private setupInputHandlers(): void {
        this.scene.input.keyboard?.on('keydown-B', () => {
            this.type = 'belt';
        });

        this.scene.input.keyboard?.on('keydown-P', () => {
            this.type = 'pipe';
        });

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const clickedPoint = this.findClickedPoint(worldPoint.x, worldPoint.y);

            if (pointer.rightButtonDown()) {
                // Right click - delete point or transport
                if (clickedPoint) {
                    this.handlePointDeletion(clickedPoint);
                }
            } else if (pointer.middleButtonDown()) {
                // Middle click - start or extend transport
                if (clickedPoint && this.isEndpoint(clickedPoint)) {
                    this.startExtending(clickedPoint.transport, clickedPoint.point, clickedPoint.index);
                } else {
                    this.startPlacement(worldPoint.x, worldPoint.y);
                }
            } else if (pointer.leftButtonDown() && clickedPoint) {
                // Left click - drag point
                this.startDragging(clickedPoint);
            }
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

            if (this.isPlacing) {
                this.updatePlacement(worldPoint.x, worldPoint.y);
            } else if (this.isDraggingPoint) {
                this.updatePointDrag(worldPoint.x, worldPoint.y);
            }
        });

        this.scene.input.on('pointerup', () => {
            if (this.isPlacing) {
                this.finishPlacement();
            }
            if (this.isDraggingPoint) {
                this.finishDragging();
            }
        });
    }

    private calculatePath(points: TransportPoint[]): TransportPoint[] {
        if (points.length < 2) return points;

        const path: TransportPoint[] = [];
        let lastDirection: string | null = null;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            path.push(current);

            // Determine preferred direction
            let dx = next.x - current.x;
            let dy = next.y - current.y;

            // Get connection direction if it exists
            const connectionDir = current.connection?.direction;

            // Decide primary direction
            let goHorizontalFirst = true;

            if (connectionDir) {
                // Use connection direction
                goHorizontalFirst = ['east', 'west'].includes(connectionDir);
            } else if (lastDirection) {
                // Try to maintain last direction if possible
                goHorizontalFirst = lastDirection === 'horizontal' && dx !== 0;
            } else {
                // Choose shortest path
                goHorizontalFirst = Math.abs(dx) > Math.abs(dy);
            }

            // Add corner point
            if (dx !== 0 && dy !== 0) {
                if (goHorizontalFirst) {
                    path.push({ x: next.x, y: current.y });
                    lastDirection = 'vertical';
                } else {
                    path.push({ x: current.x, y: next.y });
                    lastDirection = 'horizontal';
                }
            } else {
                lastDirection = dx !== 0 ? 'horizontal' : 'vertical';
            }
        }

        path.push(points[points.length - 1]);
        return path;
    }

    private handlePointDeletion({ transport, point, index }: { transport: Transport, point: TransportPoint, index: number }): void {
        if (transport.points.length <= 2) {
            // If only two points, delete the whole transport
            const transportIndex = this.transports.indexOf(transport);
            if (transportIndex !== -1) {
                transport.graphics.destroy();
                this.transports.splice(transportIndex, 1);
            }
        } else {
            // Remove just this point
            transport.points.splice(index, 1);
            this.updateTransportVisuals(transport);
        }
    }

    private findClickedPoint(x: number, y: number): { transport: Transport, point: TransportPoint, index: number } | null {
        for (const transport of this.transports) {
            for (let i = 0; i < transport.points.length; i++) {
                const point = transport.points[i];
                const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
                if (distance <= this.handleSize) {
                    return { transport, point, index: i };
                }
            }
        }
        return null;
    }

    private isEndpoint(clicked: { transport: Transport, index: number }): boolean {
        return clicked.index === 0 || clicked.index === clicked.transport.points.length - 1;
    }

    private startDragging(clicked: { transport: Transport, point: TransportPoint, index: number }): void {
        this.isDraggingPoint = true;
        this.selectedPoint = clicked;
    }

    private updatePointDrag(x: number, y: number): void {
        if (!this.isDraggingPoint || !this.selectedPoint) return;

        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        // Update the point's position
        this.selectedPoint.point.x = snappedX;
        this.selectedPoint.point.y = snappedY;

        // Update the transport's visuals
        this.updateTransportVisuals(this.selectedPoint.transport);
    }

    private finishDragging(): void {
        this.isDraggingPoint = false;
        this.selectedPoint = null;
    }

    private startExtending(transport: Transport, point: TransportPoint, pointIndex: number): void {
        this.isPlacing = true;
        this.currentTransport = transport;

        if (pointIndex === 0) {
            // Extending from start - add new point at start
            transport.points.unshift({
                x: point.x,
                y: point.y,
                isHandle: true
            });
        } else {
            // Extending from end - add new point at end
            transport.points.push({
                x: point.x,
                y: point.y,
                isHandle: true
            });
        }

        this.updateTransportVisuals(transport);
    }

    private startPlacement(x: number, y: number): void {
        if (this.isPlacing) return;

        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        this.isPlacing = true;
        this.currentTransport = {
            id: Date.now().toString(),
            points: [{
                x: snappedX,
                y: snappedY,
                isHandle: true
            }],
            graphics: this.scene.add.graphics(),
            type: this.type
        };

        this.updateTransportVisuals(this.currentTransport);
    }

    private updatePlacement(x: number, y: number): void {
        if (!this.isPlacing || !this.currentTransport) return;

        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        if (this.currentTransport.points.length > 1) {
            // Update last point
            const lastPoint = this.currentTransport.points[this.currentTransport.points.length - 1];
            lastPoint.x = snappedX;
            lastPoint.y = snappedY;
        } else {
            // Add new end point
            this.currentTransport.points.push({
                x: snappedX,
                y: snappedY,
                isHandle: true
            });
        }

        this.updateTransportVisuals(this.currentTransport);
    }

    private finishPlacement(): void {
        if (!this.isPlacing || !this.currentTransport) return;

        if (!this.transports.includes(this.currentTransport)) {
            // Only add to transports if it's a new transport
            this.transports.push(this.currentTransport);
        }

        this.isPlacing = false;
        this.currentTransport = null;
    }

    private updateTransportVisuals(transport: Transport): void {
        const pathPoints = this.calculatePath(transport.points);
        const graphics = transport.graphics;

        graphics.clear();

        // Draw main belt line
        graphics.lineStyle(8, 0x666666);  // Base color
        this.drawBeltPath(graphics, pathPoints);

        // Draw highlight line
        graphics.lineStyle(6, 0x888888);  // Lighter color for dimension
        this.drawBeltPath(graphics, pathPoints);

        // Draw direction arrows only on straight segments
        graphics.lineStyle(2, 0xffff00);
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const current = pathPoints[i];
            const next = pathPoints[i + 1];

            if (current.x === next.x || current.y === next.y) {
                const midX = (current.x + next.x) / 2;
                const midY = (current.y + next.y) / 2;
                const angle = Math.atan2(next.y - current.y, next.x - current.x);
                this.drawArrow(graphics, midX, midY, angle);
            }
        }

        // Draw connection points
        transport.points.forEach(point => {
            if (point.connection) {
                graphics.lineStyle(2, 0x00ff00);
                graphics.strokeCircle(point.x, point.y, 8);
            }
        });
    }

    private drawBeltPath(graphics: Phaser.GameObjects.Graphics, points: TransportPoint[]): void {
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }

        graphics.strokePath();
    }

    private findEndpointConnection(x: number, y: number): { transport: Transport, point: TransportPoint } | null {
        const snapDistance = this.handleSize;

        for (const transport of this.transports) {
            // Only check first and last points
            const points = [
                transport.points[0],
                transport.points[transport.points.length - 1]
            ];

            for (const point of points) {
                const distance = Phaser.Math.Distance.Between(x, y, point.x, point.y);
                if (distance <= snapDistance) {
                    return { transport, point };
                }
            }
        }

        return null;
    }

    private startExtendingTransport(transport: Transport, point: TransportPoint): void {
        this.isPlacing = true;
        this.connectingToTransport = transport;
        this.connectingFromPoint = point;

        // Create a new temporary transport for visual feedback
        this.currentTransport = {
            id: Date.now().toString(),
            points: [
                { x: point.x, y: point.y, isHandle: true }
            ],
            graphics: this.scene.add.graphics(),
            type: transport.type
        };
    }

    private updatePointPosition(point: TransportPoint, worldX: number, worldY: number): void {
        const snappedX = Math.round(worldX / this.gridSize) * this.gridSize;
        const snappedY = Math.round(worldY / this.gridSize) * this.gridSize;

        point.x = snappedX;
        point.y = snappedY;

        // Find and update the transport that contains this point
        const transport = this.transports.find(t =>
            t.points.includes(point)
        );

        if (transport) {
            this.updateTransportVisuals(transport);
        }
    }


    private drawArrows(graphics: Phaser.GameObjects.Graphics, points: TransportPoint[]): void {
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Draw arrow at midpoint of horizontal segment
            if (current.x !== next.x) {
                const midX = (current.x + next.x) / 2;
                const y = current.y;
                this.drawArrow(graphics, midX, y, current.x < next.x ? 0 : Math.PI);
            }

            // Draw arrow at midpoint of vertical segment
            if (current.y !== next.y) {
                const x = next.x;
                const midY = (current.y + next.y) / 2;
                this.drawArrow(graphics, x, midY, current.y < next.y ? Math.PI/2 : -Math.PI/2);
            }
        }
    }

    private drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number): void {
        const arrowLength = 12;
        const arrowWidth = 6;

        graphics.lineStyle(2, 0xffff00);

        // Calculate arrow points
        const tipX = x + Math.cos(angle) * (arrowLength/2);
        const tipY = y + Math.sin(angle) * (arrowLength/2);
        const backX = x - Math.cos(angle) * (arrowLength/2);
        const backY = y - Math.sin(angle) * (arrowLength/2);

        // Draw arrow base line
        graphics.beginPath();
        graphics.moveTo(backX, backY);
        graphics.lineTo(tipX, tipY);
        graphics.strokePath();

        // Draw arrow head
        const headAngle = Math.PI / 4;  // 45 degrees
        graphics.beginPath();
        graphics.moveTo(tipX, tipY);
        graphics.lineTo(
            tipX - Math.cos(angle - headAngle) * arrowWidth,
            tipY - Math.sin(angle - headAngle) * arrowWidth
        );
        graphics.moveTo(tipX, tipY);
        graphics.lineTo(
            tipX - Math.cos(angle + headAngle) * arrowWidth,
            tipY - Math.sin(angle + headAngle) * arrowWidth
        );
        graphics.strokePath();
    }

    public destroy(): void {
        this.transports.forEach(transport => {
            transport.graphics.destroy();
        });

        if (this.currentTransport) {
            this.currentTransport.graphics.destroy();
        }

        this.scene.input.keyboard?.off('keydown-B');
        this.scene.input.keyboard?.off('keydown-P');
    }
}

// TODO:
// Make belts create one section at a time, but can be extended with additional sections.
// Connected belts should lock to other belts (if the direction is correct) and moving the connection point should apply to both.
// You would have to have a way of disconnecting belts.

// Basically, I need a way to create long complex belts that act as a single entity to connect an output of one factory to an input of another factory.