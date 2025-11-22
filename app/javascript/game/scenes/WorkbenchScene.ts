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

        // Make Interactive
        this.setInteractive(new Phaser.Geom.Rectangle(0, 0, pixelW, pixelH), Phaser.Geom.Rectangle.Contains);
        scene.input.setDraggable(this);
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
        // Simple AABB check (x,y are Top-Left of container)
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

    // Coordinates are CENTER of tiles
    public x1: number; public y1: number;
    public x2: number; public y2: number;

    constructor(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number, tileSize: number) {
        this.scene = scene;
        this.tileSize = tileSize;

        // Offset to Center of Tile
        const offset = tileSize / 2;
        this.x1 = x1 + offset; this.y1 = y1 + offset;
        this.x2 = x2 + offset; this.y2 = y2 + offset;

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

    private createHandle(x: number, y: number, id: number) {
        const handle = this.scene.add.circle(x, y, 4, 0xffff00);
        handle.setStrokeStyle(1, 0x000000);
        handle.setDepth(100);
        handle.setVisible(false);
        handle.setInteractive({ draggable: true });

        handle.on('drag', (pointer: any, dragX: number, dragY: number) => {
            // Snap handle to Tile Center
            const tileX = Math.floor(dragX / this.tileSize);
            const tileY = Math.floor(dragY / this.tileSize);
            const centerX = (tileX * this.tileSize) + (this.tileSize / 2);
            const centerY = (tileY * this.tileSize) + (this.tileSize / 2);

            handle.setPosition(centerX, centerY);

            if (id === 1) { this.x1 = centerX; this.y1 = centerY; }
            else { this.x2 = centerX; this.y2 = centerY; }

            this.draw();
            this.updateHitArea();
        });
        return handle;
    }

    public draw() {
        this.gameObject.clear();
        if (this.isSelected) {
            this.gameObject.lineStyle(6, 0xffff00, 0.5);
            this.drawPath();
        }
        this.gameObject.lineStyle(4, 0xaaaaaa, 1);
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
        const minX = Math.min(this.x1, this.x2) - 8;
        const maxX = Math.max(this.x1, this.x2) + 8;
        const minY = Math.min(this.y1, this.y2) - 8;
        const maxY = Math.max(this.y1, this.y2) + 8;
        this.gameObject.setInteractive(new Phaser.Geom.Rectangle(minX, minY, maxX-minX, maxY-minY), Phaser.Geom.Rectangle.Contains);
        this.scene.input.setDraggable(this.gameObject);
    }

    containsPoint(x: number, y: number) {
        const minX = Math.min(this.x1, this.x2);
        const maxX = Math.max(this.x1, this.x2);
        const minY = Math.min(this.y1, this.y2);
        const maxY = Math.max(this.y1, this.y2);
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    select() { this.isSelected = true; this.h1.setVisible(true); this.h2.setVisible(true); this.draw(); }
    deselect() { this.isSelected = false; this.h1.setVisible(false); this.h2.setVisible(false); this.draw(); }
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
                const hitGameObjects = this.input.hitTestPointer(pointer);
                const hitEntity = this.entities.find(e => hitGameObjects.includes(e.gameObject));

                if (hitEntity) {
                    // Entity Clicked
                    if (pointer.event.ctrlKey) {
                        this.toggleSelection(hitEntity);
                    } else {
                        if (!this.selectedEntities.has(hitEntity)) {
                            this.selectSingle(hitEntity);
                        }
                    }
                } else {
                    // Empty Space Clicked -> Start Box Select
                    this.boxStart = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY);
                }
            }
        });

        // POINTER MOVE (Box Select Visuals)
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
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

        // DRAG (Bulk Move)
        this.input.on('dragstart', (pointer: any, gameObject: any) => {
            const entity = this.entities.find(e => e.gameObject === gameObject);
            // If dragging unselected item, select it first
            if (entity && !this.selectedEntities.has(entity)) {
                this.selectSingle(entity);
            }
        });

        this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
            const entity = this.entities.find(e => e.gameObject === gameObject);
            if (entity) {
                // Calculate World Delta
                const worldDX = (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                const worldDY = (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;

                // Move ALL selected entities
                this.selectedEntities.forEach(e => e.moveBy(worldDX, worldDY));
            }
        });

        this.input.on('dragend', (pointer: any, gameObject: any) => {
            // Snap factories to grid after drag
            this.selectedEntities.forEach(e => {
                if (e instanceof Factory) e.snapToGrid();
            });
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