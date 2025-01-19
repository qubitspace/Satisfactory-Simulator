// /app/javascript/simulation/transport-system.ts

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

    private isDraggingPoint: boolean = false;
    private selectedPoint: {
        transport: Transport,
        point: TransportPoint,
        index: number
    } | null = null;
    private lastClickTime: number = 0;

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

        this.scene.events.on('start-belt-drag', (data: any) => {
            this.startNewBeltFromMarker(data.factory, data.marker, data.portIndex, data.portType);
        });

        // Now we rely on pointerdown anywhere in the scene for either (1) dragging an existing belt point or (2) finishing a belt.
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

        // pointerup finishes dragging
        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.leftButtonDown()) return;

            if (this.isDraggingPoint) {
                this.finishDraggingPoint();
            } else if (this.currentTransport) {
                this.finishNewBelt();
            }
        });
    }

    private startNewBeltFromMarker(factory: any, marker: Phaser.GameObjects.Rectangle, portIndex: number, portType: 'input' | 'output'): void {
        // Get world coords of the marker (since marker.x is local to container)
        // factory.x + marker.x to get absolute in the scene, likewise for y.
        const worldX = factory.x + marker.x;
        const worldY = factory.y + marker.y;

        // Create a brand new belt with two points: the “start” point locked to the marker,
        // plus a “temporary” second point that will follow the mouse pointer.
        const newTransport: Transport = {
            id: Date.now().toString(),
            points: [
                {
                    x: worldX,
                    y: worldY,
                    isHandle: true,
                    // Optionally store info about this connection if you want
                    connection: {
                        nodeId: factory.id,
                        nodeType: 'factory',
                        portIndex: portIndex,
                        direction: (portType === 'output') ? 'east' : 'west' // or figure out real direction
                    }
                },
                {
                    x: worldX,
                    y: worldY,
                    isHandle: true
                }
            ],
            graphics: this.scene.add.graphics(),
            type: 'belt'
        };

        this.currentTransport = newTransport;
        this.transports.push(newTransport);
        this.updateTransportVisuals(newTransport);
    }

    private updateNewBeltEndpoint(x: number, y: number): void {
        if (!this.currentTransport) return;
        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        const lastIdx = this.currentTransport.points.length - 1;
        this.currentTransport.points[lastIdx].x = snappedX;
        this.currentTransport.points[lastIdx].y = snappedY;
        this.updateTransportVisuals(this.currentTransport);
    }

    // ADDED: finalize the belt once user lets go
    private finishNewBelt(): void {
        // if the user is near some other marker, you could auto-connect.
        // For now, we just keep the free end.
        this.currentTransport = null;
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
        const pathPoints = this.calculatePath(transport.points);
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

        // If your original code drew or updated handles, do it here.
        // For example, we can show circles at each endpoint:
        for (let i = 0; i < transport.points.length; i++) {
            const p = transport.points[i];
            graphics.lineStyle(2, 0x00ff00);
            graphics.strokeCircle(p.x, p.y, this.handleSize / 2);
        }
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