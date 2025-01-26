// /app/javascript/simulation/systems/transport-system.ts

import Phaser from 'phaser';
import {Factory} from "./factory-system";

export interface TransportPoint {
    x: number;
    y: number;
    isHandle?: boolean;
    preferredDirection?: 'north' | 'south' | 'east' | 'west';  // Added this property
    connection?: {
        nodeId: string;
        nodeType: 'factory' | 'splitter' | 'merger';
        portIndex: number;
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
    private isCreatingBeltState: boolean = false;
    private isDraggingPoint: boolean = false;
    private selectedPoint: {
        transport: Transport,
        point: TransportPoint,
        index: number
    } | null = null;
    private lastClickTime: number = 0;
    private gridSize = 64;
    private handleSize = 10;
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInputHandlers();
        this.setupDoubleClickHandler();
    }

    private setupDoubleClickHandler(): void {
        let lastClickTime = 0;
        const doubleClickDelay = 300;

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const currentTime = new Date().getTime();
            const timeSinceLastClick = currentTime - lastClickTime;

            if (timeSinceLastClick < doubleClickDelay) {
                // Double click detected
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const clickedBelt = this.findClickedBelt(worldPoint);

                if (clickedBelt) {
                    this.deleteBelt(clickedBelt);
                }
            }

            lastClickTime = currentTime;
        });
    }

    public deleteBelt(belt: Transport): void {
        console.log("Deleting belt", belt);
        // Remove belt references from connected factories
        const startPoint = belt.points[0];
        const endPoint = belt.points[belt.points.length - 1];

        // Find and cleanup factory connections
        const factorySystem = (this.scene as any).factorySystem;
        if (factorySystem) {
            const factories = factorySystem.getFactories();
            factories.forEach((factory: Factory) => {
                if (factory.connectedBelts?.has(belt)) {
                    factory.connectedBelts.delete(belt);

                    // Clean up input/output connections
                    Array.from(factory.inputConnections.entries()).forEach(([key, value]) => {
                        if (value === belt) {
                            factory.inputConnections.delete(key);
                        }
                    });

                    Array.from(factory.outputConnections.entries()).forEach(([key, value]) => {
                        if (value === belt) {
                            factory.outputConnections.delete(key);
                        }
                    });
                }
            });
        }

        // Remove from transports array
        const index = this.transports.indexOf(belt);
        if (index !== -1) {
            this.transports.splice(index, 1);
        }

        // Destroy graphics
        belt.graphics.destroy();
    }

    private findClickedBelt(point: { x: number, y: number }): Transport | null {
        const clickThreshold = 10; // Distance in pixels to detect click on belt
        const endpointThreshold = 20; // Distance to ignore near endpoints

        for (const belt of this.transports) {
            for (let i = 0; i < belt.points.length - 1; i++) {
                const start = belt.points[i];
                const end = belt.points[i + 1];

                // Check if point is near this belt segment
                const distance = this.pointToLineDistance(point, start, end);

                // If near a belt segment
                if (distance < clickThreshold) {
                    // Check if we're too close to connected endpoints
                    const distanceToStart = Math.sqrt(
                        Math.pow(point.x - start.x, 2) +
                        Math.pow(point.y - start.y, 2)
                    );
                    const distanceToEnd = Math.sqrt(
                        Math.pow(point.x - end.x, 2) +
                        Math.pow(point.y - end.y, 2)
                    );

                    // Only allow deletion if we're not near connected endpoints
                    if ((start.connection && distanceToStart < endpointThreshold) ||
                        (end.connection && distanceToEnd < endpointThreshold)) {
                        continue;
                    }

                    return belt;
                }
            }
        }
        return null;
    }

    private pointToLineDistance(point: { x: number, y: number }, start: { x: number, y: number }, end: { x: number, y: number }): number {
        const A = point.x - start.x;
        const B = point.y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    public isCreatingBelt(): boolean {
        return this.isCreatingBeltState || this.currentTransport !== null;
    }

    private setupInputHandlers(): void {
        this.scene.events.on('start-belt-drag', (data: any) => {
            this.startNewBeltFromMarker(data.factory, data.marker, data.portIndex, data.portType);
        });

        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.leftButtonDown()) return;

            const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const clickedPoint = this.findClickedPoint(worldPoint.x, worldPoint.y);

            if (clickedPoint) {
                this.startDraggingPoint(clickedPoint);
            }
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingPoint && this.selectedPoint) {
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.updatePointDrag(worldPoint.x, worldPoint.y);
            } else if (this.currentTransport) {
                const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                this.updateNewBeltEndpoint(worldPoint.x, worldPoint.y);
            }
        });

        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            // We check if there was a transport in progress, regardless of button state
            if (this.isDraggingPoint) {
                this.finishDraggingPoint();
            } else if (this.currentTransport || this.isCreatingBeltState) {
                this.finishNewBelt();
            }
        });
    }

    public updateBeltEndpoint(transport: Transport, factory: Factory, x: number, y: number) {
        const point = transport.points.find(p => p.connection?.nodeId === factory.id);
        if (point) {
            point.x = x;
            point.y = y;
            this.updateTransportVisuals(transport);
        }
    }

    private connectBeltToFactory(transport: Transport, factory: any, portIndex: number, portType: 'input' | 'output') {
        // Ensure the factory has the required properties
        if (!factory.connectedBelts) {
            factory.connectedBelts = new Set();
        }
        if (!factory.inputConnections) {
            factory.inputConnections = new Map();
        }
        if (!factory.outputConnections) {
            factory.outputConnections = new Map();
        }

        factory.connectedBelts.add(transport);

        if (portType === 'input') {
            factory.inputConnections.set(portIndex, transport);
        } else {
            factory.outputConnections.set(portIndex, transport);
        }
    }

    private startNewBeltFromMarker(factory: any, marker: Phaser.GameObjects.Rectangle, portIndex: number, portType: 'input' | 'output'): void {
        this.isCreatingBeltState = true;

        const worldX = factory.x + marker.x;
        const worldY = factory.y + marker.y;

        // Create connection point - this will be either start or end depending on port type
        const connectionPoint: TransportPoint = {
            x: worldX,
            y: worldY,
            isHandle: true,
            connection: {
                nodeId: factory.id,
                nodeType: 'factory',
                portIndex: portIndex,
                direction: (portType === 'output') ? 'east' : 'west'
            }
        };

        // Create movable point at same initial position
        const movablePoint: TransportPoint = {
            x: worldX,
            y: worldY,
            isHandle: true
        };

        // For output ports, connection is first point. For input ports, it's last point
        const points = portType === 'output'
            ? [connectionPoint, movablePoint]
            : [movablePoint, connectionPoint];

        const newTransport: Transport = {
            id: Date.now().toString(),
            points: points,
            graphics: this.scene.add.graphics(),
            type: 'belt'
        };

        this.connectBeltToFactory(newTransport, factory, portIndex, portType);

        this.currentTransport = newTransport;
        this.transports.push(newTransport);
        this.updateTransportVisuals(newTransport);
    }

    private updateNewBeltEndpoint(x: number, y: number): void {
        if (!this.currentTransport) return;

        // Find which point should be moved (the one without a connection)
        const movablePointIndex = this.currentTransport.points.findIndex(point => !point.connection);
        if (movablePointIndex === -1) return;

        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        this.currentTransport.points[movablePointIndex].x = snappedX;
        this.currentTransport.points[movablePointIndex].y = snappedY;
        this.updateTransportVisuals(this.currentTransport);
    }

    private finishNewBelt(): void {
        this.currentTransport = null;
        this.isCreatingBeltState = false;
    }

    // We still have the old system for dragging endpoints
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

    private startDraggingPoint(clicked: { transport: Transport, point: TransportPoint, index: number }): void {
        this.isDraggingPoint = true;
        this.selectedPoint = clicked;
    }

    private updatePointDrag(x: number, y: number): void {
        if (!this.selectedPoint) return;

        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        this.selectedPoint.point.x = snappedX;
        this.selectedPoint.point.y = snappedY;

        this.updateTransportVisuals(this.selectedPoint.transport);
    }

    private finishDraggingPoint(): void {
        this.isDraggingPoint = false;
        this.selectedPoint = null;
    }

    // The code below is your original path drawing, plus small merges if needed.
    private calculatePath(points: TransportPoint[]): TransportPoint[] {
        if (points.length < 2) return points;

        const path: TransportPoint[] = [];
        let lastDirection: string | null = null;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            path.push(current);

            // auto-snap 90-degree corners
            let dx = next.x - current.x;
            let dy = next.y - current.y;

            let goHorizontalFirst = true;
            if (lastDirection) {
                goHorizontalFirst = lastDirection === 'horizontal' && dx !== 0;
            } else {
                goHorizontalFirst = Math.abs(dx) > Math.abs(dy);
            }

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

    private updateTransportVisuals(transport: Transport): void {
        const pathPoints = this.calculateSmartPath(transport.points);
        const graphics = transport.graphics;
        graphics.clear();

        // Draw main belt line
        graphics.lineStyle(8, 0x666666);
        this.drawBeltPath(graphics, pathPoints);

        // Draw highlight line
        graphics.lineStyle(6, 0x888888);
        this.drawBeltPath(graphics, pathPoints);

        // Draw direction arrows on straight segments
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

        // Draw handle points
        for (const point of transport.points) {
            if (point.isHandle) {
                graphics.lineStyle(2, 0x00ff00);
                graphics.strokeCircle(point.x, point.y, this.handleSize / 2);
            }
        }
    }

    private calculateSmartPath(points: TransportPoint[]): TransportPoint[] {
        if (points.length < 2) return points;

        const path: TransportPoint[] = [];
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Get preferred directions
            const startDirection = current.connection?.direction || current.preferredDirection;
            const endDirection = next.connection?.direction || next.preferredDirection;

            // Add first point
            path.push(current);

            const dx = next.x - current.x;
            const dy = next.y - current.y;

            if (startDirection && endDirection) {
                // Case 3: S-curve with both directions specified
                path.push(...this.calculateSCurve(current, next, startDirection, endDirection));
            } else if (startDirection) {
                // Case 4: Start direction only
                path.push(...this.calculateDirectedPath(current, next, startDirection, true));
            } else if (endDirection) {
                // Case 5: End direction only
                path.push(...this.calculateDirectedPath(current, next, endDirection, false));
            } else {
                // Default case: simple 90-degree routing
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Go horizontal first
                    path.push({ x: next.x, y: current.y });
                } else {
                    // Go vertical first
                    path.push({ x: current.x, y: next.y });
                }
            }
        }

        // Add final point
        path.push(points[points.length - 1]);
        return path;
    }

    private calculateSCurve(
        start: TransportPoint,
        end: TransportPoint,
        startDir: string,
        endDir: string
    ): TransportPoint[] {
        const points: TransportPoint[] = [];
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        if (startDir === 'east' || startDir === 'west') {
            // Move horizontally first
            points.push({ x: midX, y: start.y });
            // Then vertically
            points.push({ x: midX, y: end.y });
        } else {
            // Move vertically first
            points.push({ x: start.x, y: midY });
            // Then horizontally
            points.push({ x: end.x, y: midY });
        }

        return points;
    }

    private calculateDirectedPath(
        start: TransportPoint,
        end: TransportPoint,
        direction: string,
        isStartDirection: boolean
    ): TransportPoint[] {
        const points: TransportPoint[] = [];

        if (isStartDirection) {
            // Follow start direction as far as possible
            if (direction === 'east' || direction === 'west') {
                points.push({ x: end.x, y: start.y });
            } else {
                points.push({ x: start.x, y: end.y });
            }
        } else {
            // Move to align with end direction
            if (direction === 'east' || direction === 'west') {
                points.push({ x: start.x, y: end.y });
            } else {
                points.push({ x: end.x, y: start.y });
            }
        }

        return points;
    }

    private drawBeltPath(graphics: Phaser.GameObjects.Graphics, points: TransportPoint[]): void {
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.strokePath();
    }

    private drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number): void {
        const arrowLength = 12;
        const arrowWidth = 6;

        const tipX = x + Math.cos(angle) * (arrowLength / 2);
        const tipY = y + Math.sin(angle) * (arrowLength / 2);
        const backX = x - Math.cos(angle) * (arrowLength / 2);
        const backY = y - Math.sin(angle) * (arrowLength / 2);

        graphics.beginPath();
        graphics.moveTo(backX, backY);
        graphics.lineTo(tipX, tipY);
        graphics.strokePath();

        const headAngle = Math.PI / 4;
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
        // no keydown off needed since we removed it
    }
}