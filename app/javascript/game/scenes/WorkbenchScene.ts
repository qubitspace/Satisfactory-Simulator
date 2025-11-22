import Phaser from "phaser";
import { CoreGameScene } from "./CoreGameScene";
import { DataManager } from "../managers/DataManager";

// --- INTERFACES & ENTITIES ---

interface InteractiveObject {
    select: () => void;
    deselect: () => void;
    destroyObject: () => void;
    moveBy: (dx: number, dy: number) => void;
    containsPoint: (x: number, y: number) => boolean;
    gameObject: Phaser.GameObjects.GameObject;
    x: number;
    y: number;
}

class Factory extends Phaser.GameObjects.Container implements InteractiveObject {
    private highlight: Phaser.GameObjects.Rectangle;
    private tileSize: number;

    constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, tileSize: number) {
        super(scene, x, y);
        this.tileSize = tileSize;
        const pixelW = w * tileSize;
        const pixelH = h * tileSize;

        // Set the logical size of the container to match the factory footprint.
        // For Phaser Containers, (x, y) already act as the top-left corner for
        // our visual rectangle below, so we don't use setOrigin here.
        this.setSize(pixelW, pixelH);

        // Visuals (Top-Left Aligned inside Container)
        const bg = scene.add.rectangle(pixelW / 2, pixelH / 2, pixelW, pixelH, 0x4444aa);
        bg.setStrokeStyle(2, 0xffffff);

        const text = scene.add.text(pixelW / 2, pixelH / 2, label, { fontSize: '10px', color: '#fff' }).setOrigin(0.5);

        // Selection Highlight
        this.highlight = scene.add.rectangle(pixelW / 2, pixelH / 2, pixelW + 4, pixelH + 4, 0xffff00, 0);
        this.highlight.setStrokeStyle(2, 0xffff00, 1);
        this.highlight.setVisible(false);

        this.add([this.highlight, bg, text]);
        scene.add.existing(this);
    }

    select() { this.highlight.setVisible(true); }
    deselect() { this.highlight.setVisible(false); }
    destroyObject() { this.destroy(); }
    get gameObject() { return this; }

    moveBy(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }

    snapToGrid() {
        this.x = Math.round(this.x / this.tileSize) * this.tileSize;
        this.y = Math.round(this.y / this.tileSize) * this.tileSize;
    }

    containsPoint(x: number, y: number): boolean {
        // Simple AABB check using the factory's top-left position as origin
        // (matches the visual footprint of the factory rectangle).
        return x >= this.x && x <= this.x + this.width &&
            y >= this.y && y <= this.y + this.height;
    }
}

class Belt implements InteractiveObject {
    public gameObject: Phaser.GameObjects.Graphics;
    private scene: Phaser.Scene;
    private tileSize: number;
    private h1: Phaser.GameObjects.Arc;
    private h2: Phaser.GameObjects.Arc;
    private isSelected: boolean = false;

    // Per-endpoint selection state so we can treat each end as a draggable item.
    private end1Selected: boolean = false;
    private end2Selected: boolean = false;

    // Coordinates are CENTER of tiles
    public x1: number; public y1: number;
    public x2: number; public y2: number;

    constructor(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number, tileSize: number) {
        this.scene = scene;
        this.tileSize = tileSize;

        // Belt endpoints are defined directly in world coordinates at tile centers.
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;

        this.gameObject = scene.add.graphics();
        this.h1 = this.createHandle(this.x1, this.y1, 1);
        this.h2 = this.createHandle(this.x2, this.y2, 2);

        this.draw();
        this.updateHitArea();
    }

    get x() { return (this.x1 + this.x2) / 2; }
    get y() { return (this.y1 + this.y2) / 2; }
    set x(v) {}
    set y(v) {}

    moveBy(dx: number, dy: number) {
        this.x1 += dx; this.y1 += dy;
        this.x2 += dx; this.y2 += dy;
        this.h1.setPosition(this.x1, this.y1);
        this.h2.setPosition(this.x2, this.y2);
        this.draw();
        this.updateHitArea();
    }

    // Snap both endpoints back to the nearest tile centers so belts always
    // live on the same grid as factories.
    snapToGrid() {
        const half = this.tileSize / 2;

        const snapPoint = (value: number) => {
            // Convert from world coordinate back to tile index, assuming
            // values are meant to be near tile centers.
            const tile = Math.round((value - half) / this.tileSize);
            return (tile * this.tileSize) + half;
        };

        this.x1 = snapPoint(this.x1);
        this.y1 = snapPoint(this.y1);
        this.x2 = snapPoint(this.x2);
        this.y2 = snapPoint(this.y2);

        this.h1.setPosition(this.x1, this.y1);
        this.h2.setPosition(this.x2, this.y2);
        this.draw();
        this.updateHitArea();
    }

    private createHandle(x: number, y: number, id: number) {
        const handle = this.scene.add.circle(x, y, 4, 0xffff00);
        handle.setStrokeStyle(1, 0x000000);
        handle.setDepth(100);
        handle.setVisible(false);
        handle.setInteractive({ draggable: true });

        // Clicking a handle adjusts which endpoints are considered "selected".
        // - Without Ctrl: select only this endpoint.
        // - With Ctrl: toggle this endpoint while leaving the other as-is.
        handle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const isCtrl = (pointer.event as any)?.ctrlKey;

            if (isCtrl) {
                if (id === 1) this.end1Selected = !this.end1Selected;
                else this.end2Selected = !this.end2Selected;
            } else {
                this.end1Selected = (id === 1);
                this.end2Selected = (id === 2);
            }

            // Ensure at least one endpoint remains selected so dragging always
            // moves something.
            if (!this.end1Selected && !this.end2Selected) {
                if (id === 1) this.end1Selected = true; else this.end2Selected = true;
            }

            this.updateHandleStyles();
        });

        handle.on('drag', (pointer: any, dragX: number, dragY: number) => {
            // Snap handle (or entire belt) to tile centers based on drag.
            const tileX = Math.floor(dragX / this.tileSize);
            const tileY = Math.floor(dragY / this.tileSize);
            const centerX = (tileX * this.tileSize) + (this.tileSize / 2);
            const centerY = (tileY * this.tileSize) + (this.tileSize / 2);

            // We support two modes:
            //  - If BOTH endpoints are selected, dragging either moves the
            //    entire belt while keeping it aligned to the grid.
            //  - If only this endpoint is selected, dragging moves just this
            //    endpoint while the other stays anchored.
            if (id === 1) {
                if (this.end1Selected && this.end2Selected) {
                    const dx = centerX - this.x1;
                    const dy = centerY - this.y1;
                    this.x1 += dx; this.y1 += dy;
                    this.x2 += dx; this.y2 += dy;
                } else {
                    this.x1 = centerX; this.y1 = centerY;
                }
            } else {
                if (this.end1Selected && this.end2Selected) {
                    const dx = centerX - this.x2;
                    const dy = centerY - this.y2;
                    this.x1 += dx; this.y1 += dy;
                    this.x2 += dx; this.y2 += dy;
                } else {
                    this.x2 = centerX; this.y2 = centerY;
                }
            }

            // Update handle positions to match the new endpoints.
            this.h1.setPosition(this.x1, this.y1);
            this.h2.setPosition(this.x2, this.y2);

            this.draw();
            this.updateHitArea();
        });
        return handle;
    }

    public draw() {
        this.gameObject.clear();
        if (this.isSelected) {
            // Thicker highlight to make selected belts visually wider
            this.gameObject.lineStyle(10, 0xffff00, 0.5);
            this.drawPath();
        }
        // Base belt width increased for better visibility and click targeting
        this.gameObject.lineStyle(6, 0xaaaaaa, 1);
        this.drawPath();
    }

    private drawPath() {
        this.gameObject.beginPath();
        this.gameObject.moveTo(this.x1, this.y1);
        this.gameObject.lineTo(this.x2, this.y1);
        this.gameObject.lineTo(this.x2, this.y2);
        this.gameObject.strokePath();
    }

    private updateHitArea() {
        // Use a generous padding so clicking anywhere near the drawn belt selects it.
        const padding = 12;
        const minX = Math.min(this.x1, this.x2) - padding;
        const maxX = Math.max(this.x1, this.x2) + padding;
        const minY = Math.min(this.y1, this.y2) - padding;
        const maxY = Math.max(this.y1, this.y2) + padding;
        this.gameObject.setInteractive(new Phaser.Geom.Rectangle(minX, minY, maxX-minX, maxY-minY), Phaser.Geom.Rectangle.Contains);
    }

    containsPoint(x: number, y: number) {
        // Treat the belt as an "L"-shaped path made of two thick line segments.
        // This mirrors how we actually draw the belt, so clicking on the
        // visible belt behaves like a collision check against those segments.

        const padding = 12; // should roughly match updateHitArea padding

        const minX = Math.min(this.x1, this.x2);
        const maxX = Math.max(this.x1, this.x2);
        const minY = Math.min(this.y1, this.y2);
        const maxY = Math.max(this.y1, this.y2);

        // Horizontal segment: from (x1, y1) to (x2, y1)
        const onHorizontal =
            x >= minX - padding && x <= maxX + padding &&
            Math.abs(y - this.y1) <= padding;

        // Vertical segment: from (x2, y1) to (x2, y2)
        const onVertical =
            y >= minY - padding && y <= maxY + padding &&
            Math.abs(x - this.x2) <= padding;

        return onHorizontal || onVertical;
    }

    // Update handle visuals based on per-endpoint selection state.
    private updateHandleStyles() {
        this.h1.setFillStyle(this.end1Selected ? 0xffff00 : 0x888888);
        this.h2.setFillStyle(this.end2Selected ? 0xffff00 : 0x888888);
    }

    select() {
        this.isSelected = true;
        // When a belt is selected we show both endpoint handles, but leave
        // their "selected" state empty. The player then clicks a handle to
        // choose which endpoint to drag; Ctrl+click can enable both ends to
        // move the entire belt together.
        this.end1Selected = false;
        this.end2Selected = false;
        this.h1.setVisible(true);
        this.h2.setVisible(true);
        this.updateHandleStyles();
        this.draw();
    }

    deselect() {
        this.isSelected = false;
        this.end1Selected = false;
        this.end2Selected = false;
        this.h1.setVisible(false);
        this.h2.setVisible(false);
        this.draw();
    }
    destroyObject() { this.h1.destroy(); this.h2.destroy(); this.gameObject.destroy(); }
}


// --- MAIN SCENE ---

type ToolMode = 'HAND' | 'FACTORY' | 'BELT';

export class WorkbenchScene extends CoreGameScene {
    // Selection
    private selectedEntities: Set<InteractiveObject> = new Set();

    // Tools
    private activeTool: ToolMode = 'HAND';
    private factoryToPlace: string | null = null;

    // Belt State
    private beltStep: 'NONE' | 'START_PLACED' = 'NONE';
    private beltStartPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    // Visual Helpers
    private beltPreview: Phaser.GameObjects.Graphics | null = null;
    private ghost: Phaser.GameObjects.Container | null = null;
    private ghostGraphics: Phaser.GameObjects.Graphics | null = null;
    private boxSelectGraphics: Phaser.GameObjects.Graphics | null = null;
    private boxStart: Phaser.Math.Vector2 | null = null;

    private entities: InteractiveObject[] = [];
    private uiButtons: Map<string, HTMLElement> = new Map();

    // Drag state managed manually using world coordinates, so we don't rely
    // on Phaser's internal hit areas (which were previously offset).
    private isDraggingEntities: boolean = false;
    private lastDragWorldPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    constructor() { super('WorkbenchScene'); }

    create() {
        super.create(); // Initialize Grid

        if (this.cache.json.exists('satisfactory_data')) {
            DataManager.getInstance().loadData(this.cache.json.get('satisfactory_data'));
        }

        this.createUI();
        this.createHelpers();
        this.setupInputLogic();
        this.resetToHand();
    }

    override update(time: number, delta: number) {
        super.update(time, delta);

        const pointer = this.input.activePointer;

        // Ghost Follow Logic
        if (this.activeTool === 'FACTORY' && this.ghost) {
            const snap = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
            this.ghost.setPosition(snap.x, snap.y);
        }

        // Belt Preview Logic
        if (this.activeTool === 'BELT' && this.beltStep === 'START_PLACED' && this.beltPreview) {
            const snapTopLeft = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
            const snapX = snapTopLeft.x + (this.TILE_SIZE / 2);
            const snapY = snapTopLeft.y + (this.TILE_SIZE / 2);

            this.beltPreview.clear();
            this.beltPreview.lineStyle(4, 0xffff00, 0.5);
            this.beltPreview.beginPath();
            this.beltPreview.moveTo(this.beltStartPos.x, this.beltStartPos.y);
            this.beltPreview.lineTo(snapX, this.beltStartPos.y);
            this.beltPreview.lineTo(snapX, snapY);
            this.beltPreview.strokePath();
        }
    }

    private createHelpers() {
        this.ghost = this.add.container(0, 0).setDepth(1000).setVisible(false);
        this.ghostGraphics = this.add.graphics();
        this.ghost.add(this.ghostGraphics);

        this.beltPreview = this.add.graphics().setDepth(1000);
        this.boxSelectGraphics = this.add.graphics().setDepth(2000);
    }

    // --- INPUT HANDLER ---

    private setupInputLogic() {
        // Keyboard Shortcuts
        this.input.keyboard?.on('keydown-ESC', () => this.resetToHand());
        this.input.keyboard?.on('keydown-DELETE', () => this.deleteSelected());
        this.input.keyboard?.on('keydown-BACKSPACE', () => this.deleteSelected());

        // POINTER DOWN
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 2) { this.resetToHand(); return; } // Right click cancel
            if (pointer.button !== 0) return; // Only Left Click for tools

            // 1. Factory Tool
            if (this.activeTool === 'FACTORY') {
                const snap = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
                this.createFactory(snap.x, snap.y, this.factoryToPlace!);
                this.resetToHand();
                return;
            }

            // 2. Belt Tool
            if (this.activeTool === 'BELT') {
                const snapTopLeft = this.getSnappedWorldPoint(pointer.worldX, pointer.worldY);
                const snapX = snapTopLeft.x + (this.TILE_SIZE / 2);
                const snapY = snapTopLeft.y + (this.TILE_SIZE / 2);

                if (this.beltStep === 'NONE') {
                    this.beltStartPos.set(snapX, snapY);
                    this.beltStep = 'START_PLACED';
                } else {
                    this.createBelt(this.beltStartPos.x, this.beltStartPos.y, snapX, snapY);
                    this.beltStep = 'NONE';
                    this.beltPreview?.clear();
                }
                return;
            }

            // 3. Hand Tool (Select / Box / Drag)
            if (this.activeTool === 'HAND') {
                // Collision-style hit test using each entity's geometry
                // (factories use their footprint, belts their L-shaped path).
                let hitEntity: InteractiveObject | undefined;
                for (let i = this.entities.length - 1; i >= 0; i--) {
                    const e = this.entities[i];
                    if (e.containsPoint(pointer.worldX, pointer.worldY)) {
                        hitEntity = e;
                        break;
                    }
                }

                if (hitEntity) {
                    // Entity Clicked
                    if (pointer.event.ctrlKey) {
                        this.toggleSelection(hitEntity);
                    } else {
                        if (!this.selectedEntities.has(hitEntity)) {
                            this.selectSingle(hitEntity);
                        }
                    }

                    // Prepare for manual dragging of selected entities.
                    //
                    // Factories: always allow whole-entity drag when clicked.
                    // Belts: allow whole-entity drag only when clicking the
                    // "middle" of the belt, not near either endpoint. Endpoint
                    // movement is handled separately via the little handle
                    // circles on each end.
                    if (hitEntity instanceof Factory) {
                        this.isDraggingEntities = true;
                        this.lastDragWorldPos.set(pointer.worldX, pointer.worldY);
                    } else if (hitEntity instanceof Belt) {
                        const belt = hitEntity as Belt;

                        // If the click is very close to an endpoint, we treat
                        // it as an endpoint interaction (the handle drag code
                        // will take over) and DO NOT start whole-belt drag
                        // from the scene.
                        const distToEnd1 = Phaser.Math.Distance.Between(
                            pointer.worldX,
                            pointer.worldY,
                            belt.x1,
                            belt.y1
                        );
                        const distToEnd2 = Phaser.Math.Distance.Between(
                            pointer.worldX,
                            pointer.worldY,
                            belt.x2,
                            belt.y2
                        );

                        // Handle radius is 4px; use a slightly larger
                        // threshold so that clicks clearly on the handle (or
                        // very near it) don't initiate whole-belt dragging.
                        const endpointClickRadius = 10;

                        if (distToEnd1 > endpointClickRadius && distToEnd2 > endpointClickRadius) {
                            // Clicked in the "middle" of the belt -> enable
                            // whole-belt drag using the shared entity drag
                            // logic (moves all selected entities together).
                            this.isDraggingEntities = true;
                            this.lastDragWorldPos.set(pointer.worldX, pointer.worldY);
                        } else {
                            // Near an endpoint: let the endpoint handle logic
                            // take care of movement instead.
                            this.isDraggingEntities = false;
                        }
                    } else {
                        this.isDraggingEntities = false;
                    }
                } else {
                    // Empty Space Clicked -> Start Box Select
                    this.isDraggingEntities = false;
                    this.boxStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
                }
            }
        });

        // POINTER MOVE (Box Select Visuals)
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Manual drag logic: move all selected entities by world-space delta
            if (this.isDraggingEntities && pointer.isDown) {
                const worldDX = pointer.worldX - this.lastDragWorldPos.x;
                const worldDY = pointer.worldY - this.lastDragWorldPos.y;

                this.selectedEntities.forEach(e => e.moveBy(worldDX, worldDY));

                this.lastDragWorldPos.set(pointer.worldX, pointer.worldY);
            }

            if (this.boxStart) {
                const w = pointer.worldX - this.boxStart.x;
                const h = pointer.worldY - this.boxStart.y;

                this.boxSelectGraphics?.clear();
                this.boxSelectGraphics?.fillStyle(0x00aaff, 0.2);
                this.boxSelectGraphics?.fillRect(this.boxStart.x, this.boxStart.y, w, h);
                this.boxSelectGraphics?.lineStyle(1, 0x00aaff);
                this.boxSelectGraphics?.strokeRect(this.boxStart.x, this.boxStart.y, w, h);
            }
        });

        // POINTER UP (Box Select Logic)
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            // Finish drag, snapping factories back to the grid
            if (this.isDraggingEntities) {
                this.isDraggingEntities = false;
                this.selectedEntities.forEach(e => {
                    if (e instanceof Factory) {
                        e.snapToGrid();
                    } else if (e instanceof Belt) {
                        // Snap belt endpoints back onto the tile grid so
                        // belts and factories always share the same grid.
                        (e as Belt).snapToGrid();
                    }
                });
            }

            if (this.boxStart) {
                // If dragged less than 5px, treat as a "Click on nothing" -> Deselect All
                if (Phaser.Math.Distance.Between(this.boxStart.x, this.boxStart.y, pointer.worldX, pointer.worldY) < 5) {
                    this.deselectAll();
                } else {
                    // Box Selection Logic
                    const minX = Math.min(this.boxStart.x, pointer.worldX);
                    const maxX = Math.max(this.boxStart.x, pointer.worldX);
                    const minY = Math.min(this.boxStart.y, pointer.worldY);
                    const maxY = Math.max(this.boxStart.y, pointer.worldY);

                    // Find entities inside
                    const hits = this.entities.filter(e => {
                        return e.x >= minX && e.x <= maxX && e.y >= minY && e.y <= maxY;
                    });

                    if (!pointer.event.ctrlKey) this.deselectAll();
                    hits.forEach(e => this.selectedEntities.add(e));
                    this.updateVisuals();
                }

                this.boxStart = null;
                this.boxSelectGraphics?.clear();
            }
        });
    }

    // --- ACTIONS ---

    private resetToHand() {
        this.activeTool = 'HAND';
        this.factoryToPlace = null;
        this.beltStep = 'NONE';
        this.beltPreview?.clear();
        this.ghost?.setVisible(false);
        this.updateUIButtons();
    }

    public startPlacingFactory(name: string) {
        this.activeTool = 'FACTORY';
        this.factoryToPlace = name;
        this.beltStep = 'NONE';

        const size = DataManager.getInstance().getMachineSize(name);
        const pixelW = size.w * this.TILE_SIZE;
        const pixelH = size.h * this.TILE_SIZE;

        this.ghostGraphics?.clear();
        this.ghostGraphics?.fillStyle(0x00aaff, 0.4);
        this.ghostGraphics?.fillRect(0, 0, pixelW, pixelH); // Top-Left aligned
        this.ghostGraphics?.lineStyle(2, 0xffffff, 0.8);
        this.ghostGraphics?.strokeRect(0, 0, pixelW, pixelH);
        this.ghost?.setVisible(true);

        this.updateUIButtons();
    }

    public startPlacingBelt() {
        this.activeTool = 'BELT';
        this.beltStep = 'NONE';
        this.ghost?.setVisible(false);
        this.updateUIButtons();
    }

    private createFactory(x: number, y: number, name: string) {
        const size = DataManager.getInstance().getMachineSize(name);
        const f = new Factory(this, x, y, size.w, size.h, name, this.TILE_SIZE);
        this.entities.push(f);
        this.selectSingle(f);
    }

    private createBelt(x1: number, y1: number, x2: number, y2: number) {
        const b = new Belt(this, x1, y1, x2, y2, this.TILE_SIZE);
        this.entities.push(b);
    }

    private deleteSelected() {
        this.selectedEntities.forEach(e => {
            e.destroyObject();
            const idx = this.entities.indexOf(e);
            if (idx > -1) this.entities.splice(idx, 1);
        });
        this.selectedEntities.clear();
    }

    // --- SELECTION HELPERS ---

    private selectSingle(ent: InteractiveObject) {
        this.deselectAll();
        this.selectedEntities.add(ent);
        this.updateVisuals();
    }

    private toggleSelection(ent: InteractiveObject) {
        if (this.selectedEntities.has(ent)) this.selectedEntities.delete(ent);
        else this.selectedEntities.add(ent);
        this.updateVisuals();
    }

    private deselectAll() {
        this.selectedEntities.clear();
        this.updateVisuals();
    }

    private updateVisuals() {
        this.entities.forEach(e => {
            if (this.selectedEntities.has(e)) e.select();
            else e.deselect();
        });
    }

    // --- UI ---

    private createUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '10px', padding: '15px',
            background: 'rgba(30, 30, 30, 0.95)', border: '1px solid #555', borderRadius: '12px',
            userSelect: 'none', fontFamily: 'Arial'
        });

        const createBtn = (id: string, label: string, onClick: () => void) => {
            const btn = document.createElement('div');
            btn.innerText = label;
            Object.assign(btn.style, {
                padding: '10px 15px', cursor: 'pointer',
                backgroundColor: '#444', color: '#fff',
                borderRadius: '6px', border: '1px solid #666',
                fontSize: '14px', fontWeight: 'bold'
            });
            // Handle drag-to-click transition if needed, or just plain click
            btn.onmousedown = (e) => { e.preventDefault(); onClick(); };

            container.appendChild(btn);
            this.uiButtons.set(id, btn);
        };

        createBtn('factory_smelter', "🏭 Smelter", () => this.startPlacingFactory("Smelter"));
        createBtn('factory_constructor', "🔨 Constructor", () => this.startPlacingFactory("Constructor"));
        createBtn('tool_belt', "🔗 Belt", () => this.startPlacingBelt());
        createBtn('cancel', "❌ Cancel", () => this.resetToHand());

        document.body.appendChild(container);
        this.events.on('shutdown', () => { if(container.parentNode) container.parentNode.removeChild(container); });
    }

    private updateUIButtons() {
        this.uiButtons.forEach((btn, id) => {
            let active = false;
            if (this.activeTool === 'BELT' && id === 'tool_belt') active = true;
            if (this.activeTool === 'FACTORY' && this.factoryToPlace) {
                if (id === `factory_${this.factoryToPlace.toLowerCase()}`) active = true;
            }
            btn.style.backgroundColor = active ? '#00cc44' : '#444';
            btn.style.borderColor = active ? '#fff' : '#666';
        });
    }
}