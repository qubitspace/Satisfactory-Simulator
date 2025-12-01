import Phaser from "phaser";
import { CoreGameScene } from "./CoreGameScene";
import { DataManager } from "../managers/DataManager";
import { Factory } from "../entities/Factory";
import { Junction } from "../entities/Junction";
import { Belt } from "../entities/Belt";
import { ConnectionPoint } from "../entities/ConnectionPoint";
import { BeltEndpoint } from "../entities/BeltEndpoint";

type ToolMode = 'HAND' | 'FACTORY' | 'JUNCTION' | 'BELT' | 'DELETE';

type Entity = Factory | Junction;

/**
 * Main workbench scene for building factories and connecting belts.
 * Completely rewritten with focus on clean UX/UI.
 */
export class WorkbenchSceneNew extends CoreGameScene {
    // Tool state
    private activeTool: ToolMode = 'HAND';
    private factoryToPlace: string | null = null;

    // Entities
    private factories: Factory[] = [];
    private junctions: Junction[] = [];
    private belts: Belt[] = [];

    // Selection
    private selectedEntities: Set<Entity> = new Set();
    private hoveredConnectionPoint: ConnectionPoint | null = null;

    // Belt placement state
    private beltStartPoint: ConnectionPoint | BeltEndpoint | null = null;
    private beltPreview: Phaser.GameObjects.Graphics | null = null;
    private beltEndpoints: BeltEndpoint[] = []; // Track all belt endpoints

    // Factory placement ghost
    private factoryGhost: Phaser.GameObjects.Container | null = null;
    private ghostGraphics: Phaser.GameObjects.Graphics | null = null;

    // Junction ghost
    private junctionGhost: Phaser.GameObjects.Arc | null = null;

    // Dragging state
    private isDragging: boolean = false;
    private dragStart: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
    private draggedBeltEndpoint: BeltEndpoint | null = null;

    // UI
    private uiContainer: HTMLElement | null = null;
    private uiButtons: Map<string, HTMLElement> = new Map();

    // Box selection
    private boxSelectGraphics: Phaser.GameObjects.Graphics | null = null;
    private boxSelectStart: Phaser.Math.Vector2 | null = null;

    constructor() {
        super('WorkbenchSceneNew');
    }

    create() {
        super.create();

        // Load game data if available
        if (this.cache.json.exists('satisfactory_data')) {
            DataManager.getInstance().loadData(this.cache.json.get('satisfactory_data'));
        }

        // Create helpers
        this.createHelpers();

        // Setup input
        this.setupInput();

        // Create UI
        this.createUI();

        // Start with hand tool
        this.setTool('HAND');

        // Load test scene for development
        this.loadTestScene();
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        const pointer = this.input.activePointer;

        // Update factory ghost position
        if (this.activeTool === 'FACTORY' && this.factoryGhost) {
            const snap = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
            this.factoryGhost.setPosition(snap.x, snap.y);
        }

        // Update junction ghost position
        if (this.activeTool === 'JUNCTION' && this.junctionGhost) {
            const snap = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
            const centerX = snap.x + this.TILE_SIZE / 2;
            const centerY = snap.y + this.TILE_SIZE / 2;
            this.junctionGhost.setPosition(centerX, centerY);
        }

        // Update belt preview
        if (this.activeTool === 'BELT' && this.beltStartPoint && this.beltPreview) {
            this.updateBeltPreview(pointer.worldX, pointer.worldY);
        }

        // Update connection point hover states
        this.updateConnectionPointHovers(pointer.worldX, pointer.worldY);

        // Update cursor for hand tool (show 'move' when hovering entities)
        if (this.activeTool === 'HAND' && !this.isDragging) {
            const entity = this.findEntityAt(pointer.worldX, pointer.worldY);
            this.game.canvas.style.cursor = entity ? 'move' : 'default';
        }
    }

    // ===== HELPERS =====

    private createHelpers() {
        // Factory ghost
        this.factoryGhost = this.add.container(0, 0).setDepth(1000).setVisible(false);
        this.ghostGraphics = this.add.graphics();
        this.factoryGhost.add(this.ghostGraphics);

        // Junction ghost
        this.junctionGhost = this.add.circle(0, 0, 12, 0x888888, 0.5).setDepth(1000).setVisible(false);
        this.junctionGhost.setStrokeStyle(2, 0xffffff, 0.8);

        // Belt preview
        this.beltPreview = this.add.graphics().setDepth(1000);

        // Box selection
        this.boxSelectGraphics = this.add.graphics().setDepth(2000);
    }

    // ===== INPUT HANDLING =====

    private setupInput() {
        // Keyboard shortcuts
        this.input.keyboard?.on('keydown-ESC', () => this.cancelCurrentAction());
        this.input.keyboard?.on('keydown-DELETE', () => this.deleteSelected());
        this.input.keyboard?.on('keydown-BACKSPACE', () => this.deleteSelected());
        this.input.keyboard?.on('keydown-ONE', () => this.setTool('HAND'));
        this.input.keyboard?.on('keydown-TWO', () => this.setTool('BELT'));
        this.input.keyboard?.on('keydown-THREE', () => this.setTool('JUNCTION'));

        // Mouse events
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
    }

    private onPointerDown(pointer: Phaser.Input.Pointer) {
        // Right click always cancels
        if (pointer.button === 2) {
            this.cancelCurrentAction();
            return;
        }

        // Only process left click
        if (pointer.button !== 0) return;

        // Delegate to tool-specific handlers
        switch (this.activeTool) {
            case 'FACTORY':
                this.handleFactoryPlacement(pointer);
                break;
            case 'JUNCTION':
                this.handleJunctionPlacement(pointer);
                break;
            case 'BELT':
                this.handleBeltClick(pointer);
                break;
            case 'DELETE':
                this.handleDelete(pointer);
                break;
            case 'HAND':
                this.handleHandClick(pointer);
                break;
        }
    }

    private onPointerMove(pointer: Phaser.Input.Pointer) {
        // Handle dragging
        if (this.isDragging && pointer.isDown) {
            if (this.draggedBeltEndpoint) {
                // Dragging a belt endpoint
                this.draggedBeltEndpoint.updateDragPosition(pointer.worldX, pointer.worldY);
            } else {
                // Dragging entities
                const dx = pointer.worldX - this.dragStart.x;
                const dy = pointer.worldY - this.dragStart.y;

                this.selectedEntities.forEach(entity => {
                    entity.moveBy(dx, dy);
                });

                this.dragStart.set(pointer.worldX, pointer.worldY);

                // Update connected belts
                this.updateConnectedBelts();
            }
        }

        // Handle box selection visual
        if (this.boxSelectStart) {
            const w = pointer.worldX - this.boxSelectStart.x;
            const h = pointer.worldY - this.boxSelectStart.y;

            this.boxSelectGraphics?.clear();
            this.boxSelectGraphics?.fillStyle(0x00aaff, 0.2);
            this.boxSelectGraphics?.fillRect(this.boxSelectStart.x, this.boxSelectStart.y, w, h);
            this.boxSelectGraphics?.lineStyle(2, 0x00aaff, 0.8);
            this.boxSelectGraphics?.strokeRect(this.boxSelectStart.x, this.boxSelectStart.y, w, h);
        }
    }

    private onPointerUp(pointer: Phaser.Input.Pointer) {
        // End dragging
        if (this.isDragging) {
            this.isDragging = false;

            if (this.draggedBeltEndpoint) {
                // End belt endpoint drag
                this.draggedBeltEndpoint.endDrag();
                this.draggedBeltEndpoint = null;
            } else {
                // End entity drag
                // Snap to grid
                this.selectedEntities.forEach(entity => {
                    entity.snapToGrid();
                });

                this.updateConnectedBelts();
            }
        }

        // End box selection
        if (this.boxSelectStart) {
            const dist = Phaser.Math.Distance.Between(
                this.boxSelectStart.x,
                this.boxSelectStart.y,
                pointer.worldX,
                pointer.worldY
            );

            if (dist < 5) {
                // Just a click, deselect all
                this.deselectAll();
            } else {
                // Actual box selection
                this.performBoxSelection(this.boxSelectStart.x, this.boxSelectStart.y, pointer.worldX, pointer.worldY, pointer.event.ctrlKey);
            }

            this.boxSelectStart = null;
            this.boxSelectGraphics?.clear();
        }
    }

    // ===== TOOL HANDLERS =====

    private handleFactoryPlacement(pointer: Phaser.Input.Pointer) {
        if (!this.factoryToPlace) return;

        const snap = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
        const size = DataManager.getInstance().getMachineSize(this.factoryToPlace);

        // Create factory (default 2 inputs, 1 output - can be configured later)
        const factory = new Factory(
            this,
            snap.x,
            snap.y,
            this.factoryToPlace,
            size.w,
            size.h,
            this.TILE_SIZE,
            2, // inputs
            1  // outputs
        );

        this.factories.push(factory);

        // Select the new factory
        this.deselectAll();
        this.selectedEntities.add(factory);
        factory.setSelected(true);

        // Stay in factory placement mode for rapid placement
        // User can press ESC or right-click to exit
    }

    private handleJunctionPlacement(pointer: Phaser.Input.Pointer) {
        // Check if user clicked on a BeltEndpoint
        const clickedEndpoint = this.findBeltEndpointAt(pointer.worldX, pointer.worldY);

        if (clickedEndpoint) {
            // Replace belt endpoint with junction
            this.replaceBeltEndpointWithJunction(clickedEndpoint);
            return;
        }

        // Check if user clicked on an existing belt
        const clickedBelt = this.findBeltAt(pointer.worldX, pointer.worldY);

        if (clickedBelt) {
            // Split the belt and insert junction
            this.splitBeltWithJunction(clickedBelt, pointer.worldX, pointer.worldY);
        } else {
            // Place junction normally
            const snap = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
            const centerX = snap.x + this.TILE_SIZE / 2;
            const centerY = snap.y + this.TILE_SIZE / 2;

            const junction = new Junction(this, centerX, centerY, this.TILE_SIZE);
            this.junctions.push(junction);

            // Select new junction
            this.deselectAll();
            this.selectedEntities.add(junction);
            junction.setSelected(true);
        }
    }

    private handleBeltClick(pointer: Phaser.Input.Pointer) {
        // Find what was clicked (ConnectionPoint, BeltEndpoint, or empty space)
        const connectionPoint = this.findConnectionPointAt(pointer.worldX, pointer.worldY);
        const beltEndpoint = this.findBeltEndpointAt(pointer.worldX, pointer.worldY);

        // Determine the target point
        let targetPoint: ConnectionPoint | BeltEndpoint | null = connectionPoint || beltEndpoint;

        if (!this.beltStartPoint) {
            // First click - start belt placement
            if (connectionPoint) {
                // Start from a connection point
                if (!connectionPoint.isAvailable()) {
                    return; // Already connected
                }
                this.beltStartPoint = connectionPoint;
                if ('setHovered' in connectionPoint) {
                    connectionPoint.setHovered(true);
                }
            } else if (beltEndpoint) {
                // Start from an existing belt endpoint
                this.beltStartPoint = beltEndpoint;
            } else {
                // Start in empty space - create a new BeltEndpoint
                const newEndpoint = new BeltEndpoint(this, pointer.worldX, pointer.worldY);
                this.beltEndpoints.push(newEndpoint);
                this.beltStartPoint = newEndpoint;
            }
        } else {
            // Continue belt chain - create segment
            let endPoint: ConnectionPoint | BeltEndpoint;

            if (connectionPoint) {
                // Connecting to a connection point
                if (!connectionPoint.isAvailable()) {
                    return; // Already connected
                }
                // Check compatibility if starting from ConnectionPoint
                if (this.beltStartPoint instanceof ConnectionPoint &&
                    !this.beltStartPoint.canConnectTo(connectionPoint)) {
                    return; // Invalid connection
                }
                endPoint = connectionPoint;
            } else if (beltEndpoint && beltEndpoint !== this.beltStartPoint) {
                // Connecting to an existing belt endpoint
                endPoint = beltEndpoint;
            } else {
                // Create new BeltEndpoint in empty space
                const newEndpoint = new BeltEndpoint(this, pointer.worldX, pointer.worldY);
                this.beltEndpoints.push(newEndpoint);
                endPoint = newEndpoint;
            }

            // Create the belt segment!
            const obstacles = this.getObstacles();
            const belt = new Belt(this, this.beltStartPoint, endPoint, 0, obstacles);
            this.belts.push(belt);

            // Clear start hover state
            if (this.beltStartPoint instanceof ConnectionPoint && 'setHovered' in this.beltStartPoint) {
                this.beltStartPoint.setHovered(false);
            }

            // Continue from this endpoint for next segment
            this.beltStartPoint = endPoint;
            if (endPoint instanceof ConnectionPoint && 'setHovered' in endPoint) {
                endPoint.setHovered(true);
            }
        }
    }

    private handleDelete(pointer: Phaser.Input.Pointer) {
        // Find what was clicked
        const entity = this.findEntityAt(pointer.worldX, pointer.worldY);

        if (entity) {
            this.deleteEntity(entity);
            return;
        }

        // Check for belt
        const belt = this.findBeltAt(pointer.worldX, pointer.worldY);
        if (belt) {
            this.deleteBelt(belt);
        }
    }

    private handleHandClick(pointer: Phaser.Input.Pointer) {
        // Check for BeltEndpoint click first (they're small and should take priority)
        const beltEndpoint = this.findBeltEndpointAt(pointer.worldX, pointer.worldY);

        if (beltEndpoint) {
            // BeltEndpoint clicked - start dragging it
            this.draggedBeltEndpoint = beltEndpoint;
            this.isDragging = true;
            this.dragStart.set(pointer.worldX, pointer.worldY);
            beltEndpoint.startDrag();
            return;
        }

        // Check for entity click
        const entity = this.findEntityAt(pointer.worldX, pointer.worldY);

        if (entity) {
            // Entity clicked
            if (pointer.event.ctrlKey) {
                // Ctrl+click toggles selection
                if (this.selectedEntities.has(entity)) {
                    this.selectedEntities.delete(entity);
                    entity.setSelected(false);
                } else {
                    this.selectedEntities.add(entity);
                    entity.setSelected(true);
                }
            } else {
                // Regular click
                if (!this.selectedEntities.has(entity)) {
                    this.deselectAll();
                    this.selectedEntities.add(entity);
                    entity.setSelected(true);
                }

                // Start dragging
                this.isDragging = true;
                this.dragStart.set(pointer.worldX, pointer.worldY);
            }
        } else {
            // Empty space clicked - start box selection
            this.boxSelectStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
        }
    }

    // ===== BELT HELPERS =====

    private updateBeltPreview(worldX: number, worldY: number) {
        if (!this.beltStartPoint || !this.beltPreview) return;

        this.beltPreview.clear();

        // Find potential end point
        const connectionPoint = this.findConnectionPointAt(worldX, worldY);
        const beltEndpoint = this.findBeltEndpointAt(worldX, worldY);
        const endPoint = connectionPoint || beltEndpoint;

        if (endPoint) {
            // Check if valid connection
            let isValid = true;
            if (this.beltStartPoint instanceof ConnectionPoint && endPoint instanceof ConnectionPoint) {
                isValid = this.beltStartPoint.canConnectTo(endPoint);
            }

            if (isValid && endPoint !== this.beltStartPoint) {
                // Draw valid preview
                this.beltPreview.lineStyle(4, 0x00ff00, 0.6);
                this.drawBeltPath(this.beltPreview, this.beltStartPoint, endPoint);
            } else {
                // Draw to cursor
                this.beltPreview.lineStyle(4, 0xffff00, 0.3);
                this.beltPreview.beginPath();
                this.beltPreview.moveTo(this.beltStartPoint.x, this.beltStartPoint.y);
                this.beltPreview.lineTo(worldX, worldY);
                this.beltPreview.strokePath();
            }
        } else {
            // Draw to cursor (will create new BeltEndpoint)
            this.beltPreview.lineStyle(4, 0x88ff88, 0.5);
            this.beltPreview.beginPath();
            this.beltPreview.moveTo(this.beltStartPoint.x, this.beltStartPoint.y);
            this.beltPreview.lineTo(worldX, worldY);
            this.beltPreview.strokePath();
        }
    }

    private drawBeltPath(graphics: Phaser.GameObjects.Graphics, start: ConnectionPoint | BeltEndpoint, end: ConnectionPoint | BeltEndpoint) {
        // Simple L-shaped preview
        graphics.beginPath();
        graphics.moveTo(start.x, start.y);

        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);

        if (dx > dy) {
            // Horizontal first
            graphics.lineTo(end.x, start.y);
            graphics.lineTo(end.x, end.y);
        } else {
            // Vertical first
            graphics.lineTo(start.x, end.y);
            graphics.lineTo(end.x, end.y);
        }

        graphics.strokePath();
    }

    private cancelBeltPlacement() {
        if (this.beltStartPoint) {
            if ('setHovered' in this.beltStartPoint) {
                this.beltStartPoint.setHovered(false);
            }
            this.beltStartPoint = null;
        }
        this.beltPreview?.clear();
    }

    /**
     * Split a belt by inserting a junction at the clicked position.
     * Creates two new belts connecting through the junction.
     */
    private splitBeltWithJunction(belt: Belt, clickX: number, clickY: number) {
        // Store original connection points
        const originalStart = belt.startPoint;
        const originalEnd = belt.endPoint;

        // Snap junction to grid near click point
        const snap = this.getSnappedWorldPoint(clickX, clickY);
        const junctionX = snap.x + this.TILE_SIZE / 2;
        const junctionY = snap.y + this.TILE_SIZE / 2;

        // Create junction at click position
        const junction = new Junction(this, junctionX, junctionY, this.TILE_SIZE);
        this.junctions.push(junction);

        // Determine which connection points to use on the junction
        // We want to create a flow: originalStart -> junction -> originalEnd
        // Figure out which sides of the junction align with the belt direction

        const startDir = originalStart.getDirectionVector();
        const endDir = originalEnd.getDirectionVector();

        // Find best connection points on junction for entry and exit
        const entryPoint = this.findBestJunctionPoint(junction, originalStart, junctionX, junctionY);
        const exitPoint = this.findBestJunctionPoint(junction, originalEnd, junctionX, junctionY);

        if (!entryPoint || !exitPoint || entryPoint === exitPoint) {
            // Failed to find suitable points, cleanup and abort
            junction.destroyJunction();
            const idx = this.junctions.indexOf(junction);
            if (idx > -1) this.junctions.splice(idx, 1);
            return;
        }

        // Delete the original belt
        this.deleteBelt(belt);

        // Create two new belts
        const obstacles = this.getObstacles();
        const belt1 = new Belt(this, originalStart, entryPoint, 0, obstacles);
        this.belts.push(belt1);

        const belt2 = new Belt(this, exitPoint, originalEnd, 0, obstacles);
        this.belts.push(belt2);

        // Select the new junction
        this.deselectAll();
        this.selectedEntities.add(junction);
        junction.setSelected(true);

        console.log('Belt split with junction');
    }

    /**
     * Replace a BeltEndpoint with a Junction, reconnecting all attached belts.
     */
    private replaceBeltEndpointWithJunction(endpoint: BeltEndpoint) {
        // Create junction at endpoint position
        const junction = new Junction(this, endpoint.x, endpoint.y, this.TILE_SIZE);
        this.junctions.push(junction);

        // Get all belts connected to this endpoint
        const connectedBelts = Array.from(endpoint.getConnectedBelts());

        // Reconnect each belt to the junction
        for (const belt of connectedBelts) {
            // Determine if this endpoint is the start or end of the belt
            const isStart = belt.startPoint === endpoint;
            const otherPoint = isStart ? belt.endPoint : belt.startPoint;

            // Find best junction point to connect to
            const junctionPoint = this.findBestJunctionPointForBelt(junction, otherPoint, endpoint.x, endpoint.y, isStart);

            if (!junctionPoint) {
                console.warn('Could not find suitable junction point for belt');
                continue;
            }

            // Delete old belt
            this.deleteBelt(belt);

            // Create new belt with junction connection
            const obstacles = this.getObstacles();
            let newBelt: Belt;
            if (isStart) {
                newBelt = new Belt(this, junctionPoint, otherPoint, 0, obstacles);
            } else {
                newBelt = new Belt(this, otherPoint, junctionPoint, 0, obstacles);
            }
            this.belts.push(newBelt);
        }

        // Remove the endpoint from our list and destroy it
        const idx = this.beltEndpoints.indexOf(endpoint);
        if (idx > -1) {
            this.beltEndpoints.splice(idx, 1);
        }
        endpoint.destroy();

        // Select the new junction
        this.deselectAll();
        this.selectedEntities.add(junction);
        junction.setSelected(true);

        console.log('Belt endpoint replaced with junction');
    }

    /**
     * Find the best connection point on a junction to connect to a given connection point.
     */
    private findBestJunctionPoint(
        junction: Junction,
        targetPoint: ConnectionPoint,
        junctionX: number,
        junctionY: number
    ): ConnectionPoint | null {
        // Calculate which side of the junction is closest to the target
        const dx = targetPoint.x - junctionX;
        const dy = targetPoint.y - junctionY;

        let bestSide: string;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal alignment - use left or right
            bestSide = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
            // Vertical alignment - use top or bottom
            bestSide = dy > 0 ? 'BOTTOM' : 'TOP';
        }

        const point = junction.connectionPoints.get(bestSide);
        return point?.isAvailable() ? point : null;
    }

    /**
     * Find the best connection point on a junction to connect to a belt endpoint or connection point.
     * Similar to findBestJunctionPoint but works with BeltConnection types.
     */
    private findBestJunctionPointForBelt(
        junction: Junction,
        targetPoint: ConnectionPoint | BeltEndpoint,
        junctionX: number,
        junctionY: number,
        isOutput: boolean
    ): ConnectionPoint | null {
        // Calculate which side of the junction is closest to the target
        const dx = targetPoint.x - junctionX;
        const dy = targetPoint.y - junctionY;

        let bestSide: string;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal alignment - use left or right
            bestSide = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
            // Vertical alignment - use top or bottom
            bestSide = dy > 0 ? 'BOTTOM' : 'TOP';
        }

        const point = junction.connectionPoints.get(bestSide);
        return point?.isAvailable() ? point : null;
    }

    // ===== CONNECTION POINT HELPERS =====

    private updateConnectionPointHovers(worldX: number, worldY: number) {
        const newHovered = this.findConnectionPointAt(worldX, worldY);

        if (newHovered !== this.hoveredConnectionPoint) {
            // Clear old hover
            if (this.hoveredConnectionPoint && this.hoveredConnectionPoint !== this.beltStartPoint) {
                this.hoveredConnectionPoint.setHovered(false);
            }

            // Set new hover
            this.hoveredConnectionPoint = newHovered;
            if (this.hoveredConnectionPoint && this.hoveredConnectionPoint !== this.beltStartPoint) {
                this.hoveredConnectionPoint.setHovered(true);
            }
        }
    }

    private findConnectionPointAt(worldX: number, worldY: number, threshold: number = 20): ConnectionPoint | null {
        // Check factories
        for (const factory of this.factories) {
            const point = factory.getConnectionPointAt(worldX, worldY, threshold);
            if (point) return point;
        }

        // Check junctions
        for (const junction of this.junctions) {
            const point = junction.getConnectionPointAt(worldX, worldY, threshold);
            if (point) return point;
        }

        return null;
    }

    private findBeltEndpointAt(worldX: number, worldY: number, threshold: number = 20): BeltEndpoint | null {
        for (const endpoint of this.beltEndpoints) {
            const dx = worldX - endpoint.x;
            const dy = worldY - endpoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= threshold) {
                return endpoint;
            }
        }
        return null;
    }

    // ===== ENTITY HELPERS =====

    private findEntityAt(worldX: number, worldY: number): Entity | null {
        // Check factories (reverse order for top-most first)
        for (let i = this.factories.length - 1; i >= 0; i--) {
            if (this.factories[i].containsPoint(worldX, worldY)) {
                return this.factories[i];
            }
        }

        // Check junctions
        for (let i = this.junctions.length - 1; i >= 0; i--) {
            if (this.junctions[i].containsPoint(worldX, worldY)) {
                return this.junctions[i];
            }
        }

        return null;
    }

    private findBeltAt(worldX: number, worldY: number): Belt | null {
        for (let i = this.belts.length - 1; i >= 0; i--) {
            if (this.belts[i].containsPoint(worldX, worldY)) {
                return this.belts[i];
            }
        }
        return null;
    }

    private performBoxSelection(x1: number, y1: number, x2: number, y2: number, additive: boolean) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        if (!additive) {
            this.deselectAll();
        }

        // Select factories
        for (const factory of this.factories) {
            const inBox = factory.x >= minX && factory.x <= maxX && factory.y >= minY && factory.y <= maxY;
            if (inBox) {
                this.selectedEntities.add(factory);
                factory.setSelected(true);
            }
        }

        // Select junctions
        for (const junction of this.junctions) {
            const inBox = junction.x >= minX && junction.x <= maxX && junction.y >= minY && junction.y <= maxY;
            if (inBox) {
                this.selectedEntities.add(junction);
                junction.setSelected(true);
            }
        }
    }

    // ===== SELECTION =====

    private deselectAll() {
        this.selectedEntities.forEach(entity => entity.setSelected(false));
        this.selectedEntities.clear();
    }

    // ===== DELETION =====

    private deleteSelected() {
        this.selectedEntities.forEach(entity => this.deleteEntity(entity));
        this.selectedEntities.clear();
    }

    private deleteEntity(entity: Entity) {
        // Find and delete connected belts
        const connectedBelts = this.findConnectedBelts(entity);
        connectedBelts.forEach(belt => this.deleteBelt(belt));

        // Remove from lists
        if (entity instanceof Factory) {
            const idx = this.factories.indexOf(entity);
            if (idx > -1) this.factories.splice(idx, 1);
            entity.destroyFactory();
        } else if (entity instanceof Junction) {
            const idx = this.junctions.indexOf(entity);
            if (idx > -1) this.junctions.splice(idx, 1);
            entity.destroyJunction();
        }

        this.selectedEntities.delete(entity);
    }

    private deleteBelt(belt: Belt) {
        const idx = this.belts.indexOf(belt);
        if (idx > -1) this.belts.splice(idx, 1);
        belt.destroyBelt();
    }

    private findConnectedBelts(entity: Entity): Belt[] {
        const connected: Belt[] = [];

        if (entity instanceof Factory) {
            [...entity.inputs, ...entity.outputs].forEach(point => {
                if (point.connectedBelt) {
                    connected.push(point.connectedBelt);
                }
            });
        } else if (entity instanceof Junction) {
            entity.connectionPoints.forEach(point => {
                if (point.connectedBelt) {
                    connected.push(point.connectedBelt);
                }
            });
        }

        return connected;
    }

    /**
     * Get all obstacles (factories and junctions) for belt routing
     */
    private getObstacles(): { x: number; y: number; width: number; height: number }[] {
        const obstacles: { x: number; y: number; width: number; height: number }[] = [];

        // Add all factories
        for (const factory of this.factories) {
            obstacles.push({
                x: factory.x,
                y: factory.y,
                width: factory.gridWidth * this.TILE_SIZE,
                height: factory.gridHeight * this.TILE_SIZE
            });
        }

        // Add all junctions (as small circular obstacles, approximated as squares)
        for (const junction of this.junctions) {
            const size = 24; // Junction visual size (radius 12 * 2)
            obstacles.push({
                x: junction.x - size / 2,
                y: junction.y - size / 2,
                width: size,
                height: size
            });
        }

        return obstacles;
    }

    private updateConnectedBelts() {
        // Get current obstacles
        const obstacles = this.getObstacles();

        // Update all belts to redraw with new connection point positions and avoid obstacles
        this.belts.forEach(belt => {
            belt.updatePath(obstacles);
        });
    }

    // ===== TOOL MANAGEMENT =====

    private setTool(tool: ToolMode, factoryName?: string) {
        // Clean up previous tool state (but don't recursively call setTool)
        this.cleanupToolState();

        this.activeTool = tool;

        // Setup new tool
        switch (tool) {
            case 'FACTORY':
                this.factoryToPlace = factoryName || 'Smelter';
                this.setupFactoryGhost();
                this.factoryGhost?.setVisible(true);
                break;

            case 'JUNCTION':
                this.junctionGhost?.setVisible(true);
                break;

            case 'BELT':
                // Belt tool ready
                break;

            case 'DELETE':
                // Delete tool ready
                break;

            case 'HAND':
            default:
                // Hand tool ready
                break;
        }

        this.updateUIButtons();
        this.updateCursor();
    }

    /**
     * Update cursor based on active tool
     */
    private updateCursor() {
        const canvas = this.game.canvas;

        switch (this.activeTool) {
            case 'HAND':
                canvas.style.cursor = 'default';
                break;
            case 'FACTORY':
            case 'JUNCTION':
                canvas.style.cursor = 'crosshair';
                break;
            case 'BELT':
                canvas.style.cursor = 'cell';
                break;
            case 'DELETE':
                canvas.style.cursor = 'not-allowed';
                break;
            default:
                canvas.style.cursor = 'default';
        }
    }

    private cleanupToolState() {
        // Clean up visual elements without changing the active tool
        this.cancelBeltPlacement();
        this.factoryGhost?.setVisible(false);
        this.junctionGhost?.setVisible(false);
    }

    private setupFactoryGhost() {
        if (!this.factoryToPlace || !this.ghostGraphics) return;

        const size = DataManager.getInstance().getMachineSize(this.factoryToPlace);
        const w = size.w * this.TILE_SIZE;
        const h = size.h * this.TILE_SIZE;

        this.ghostGraphics.clear();
        this.ghostGraphics.fillStyle(0x4488cc, 0.4);
        this.ghostGraphics.fillRect(0, 0, w, h);
        this.ghostGraphics.lineStyle(2, 0xffffff, 0.8);
        this.ghostGraphics.strokeRect(0, 0, w, h);
    }

    private cancelCurrentAction() {
        // Just switch to hand tool (cleanup happens in setTool)
        this.setTool('HAND');
    }

    // ===== UI =====

    private createUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            padding: '12px',
            background: 'rgba(20, 20, 30, 0.95)',
            border: '2px solid #4488cc',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            userSelect: 'none',
            fontFamily: 'Arial, sans-serif',
            zIndex: '1000'
        });

        const createBtn = (id: string, icon: string, label: string, onClick: () => void) => {
            const btn = document.createElement('div');
            btn.innerHTML = `<div style="font-size: 20px; margin-bottom: 2px;">${icon}</div><div style="font-size: 10px;">${label}</div>`;

            Object.assign(btn.style, {
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: '#2a2a3a',
                color: '#fff',
                borderRadius: '8px',
                border: '2px solid #444',
                textAlign: 'center',
                minWidth: '60px',
                transition: 'all 0.2s'
            });

            btn.onmouseenter = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.backgroundColor = '#3a3a4a';
                    btn.style.borderColor = '#666';
                }
            };

            btn.onmouseleave = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.backgroundColor = '#2a2a3a';
                    btn.style.borderColor = '#444';
                }
            };

            btn.onmousedown = (e) => {
                e.preventDefault();
                onClick();
            };

            container.appendChild(btn);
            this.uiButtons.set(id, btn);
        };

        // Create buttons
        createBtn('hand', '✋', 'Hand (1)', () => this.setTool('HAND'));
        createBtn('belt', '🔗', 'Belt (2)', () => this.setTool('BELT'));
        createBtn('junction', '⊕', 'Junction (3)', () => this.setTool('JUNCTION'));
        createBtn('smelter', '🏭', 'Smelter', () => this.setTool('FACTORY', 'Smelter'));
        createBtn('constructor', '🔨', 'Constructor', () => this.setTool('FACTORY', 'Constructor'));
        createBtn('delete', '🗑️', 'Delete', () => this.setTool('DELETE'));

        document.body.appendChild(container);
        this.uiContainer = container;

        // Clean up on shutdown
        this.events.on('shutdown', () => {
            if (this.uiContainer?.parentNode) {
                this.uiContainer.parentNode.removeChild(this.uiContainer);
            }
        });

        this.updateUIButtons();
    }

    private updateUIButtons() {
        this.uiButtons.forEach((btn, id) => {
            let active = false;

            if (this.activeTool === 'HAND' && id === 'hand') active = true;
            if (this.activeTool === 'BELT' && id === 'belt') active = true;
            if (this.activeTool === 'JUNCTION' && id === 'junction') active = true;
            if (this.activeTool === 'DELETE' && id === 'delete') active = true;
            if (this.activeTool === 'FACTORY' && this.factoryToPlace) {
                if (id === this.factoryToPlace.toLowerCase()) active = true;
            }

            if (active) {
                btn.classList.add('active');
                btn.style.backgroundColor = '#4488cc';
                btn.style.borderColor = '#66aaff';
            } else {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#2a2a3a';
                btn.style.borderColor = '#444';
            }
        });
    }

    // ===== TEST SCENE LOADER =====

    /**
     * Load a test scene with pre-placed factories and belts for development.
     * Comment out the call in create() to disable.
     */
    private loadTestScene() {
        // Calculate center of map
        const centerX = (this.MAP_WIDTH_TILES * this.TILE_SIZE) / 2;
        const centerY = (this.MAP_HEIGHT_TILES * this.TILE_SIZE) / 2;

        // Create a vertical chain: Smelter -> Smelter -> Constructor
        const smelter1 = new Factory(
            this,
            centerX - 100,
            centerY - 200,
            'Smelter',
            1, 2,
            this.TILE_SIZE,
            2, 1  // 2 inputs, 1 output
        );
        this.factories.push(smelter1);

        const smelter2 = new Factory(
            this,
            centerX - 100,
            centerY,
            'Smelter',
            1, 2,
            this.TILE_SIZE,
            2, 1  // 2 inputs, 1 output
        );
        this.factories.push(smelter2);

        const constructor1 = new Factory(
            this,
            centerX + 100,
            centerY,
            'Constructor',
            2, 2,
            this.TILE_SIZE,
            1, 1  // 1 input, 1 output (was 2, 1)
        );
        this.factories.push(constructor1);

        // Create a junction for testing
        const junction1 = new Junction(
            this,
            centerX + 16,
            centerY - 100,
            this.TILE_SIZE
        );
        this.junctions.push(junction1);

        // Connect them with belts
        const obstacles = this.getObstacles();

        // Smelter1 output -> Smelter2 input
        if (smelter1.outputs[0] && smelter2.inputs[0]) {
            const belt1 = new Belt(this, smelter1.outputs[0], smelter2.inputs[0], 0, obstacles);
            this.belts.push(belt1);
        }

        // Smelter2 output -> Constructor input
        if (smelter2.outputs[0] && constructor1.inputs[0]) {
            const belt2 = new Belt(this, smelter2.outputs[0], constructor1.inputs[0], 0, obstacles);
            this.belts.push(belt2);
        }

        // Smelter1 second input -> Junction (for testing complex routing)
        if (smelter1.inputs[1] && junction1.connectionPoints.get('RIGHT')) {
            const belt3 = new Belt(this, junction1.connectionPoints.get('RIGHT')!, smelter1.inputs[1], 0, obstacles);
            this.belts.push(belt3);
        }

        console.log('Test scene loaded: 3 factories, 1 junction, 3 belts');
    }
}
