import Phaser from "phaser";
import { CoreGameScene } from "./CoreGameScene";
import { DataManager } from "../managers/DataManager";

// Define the available tools
enum ToolMode {
    HAND = 'HAND',
    BUILD_FACTORY = 'BUILD_FACTORY',
    BUILD_SPAWN = 'BUILD_SPAWN',
    BUILD_SINK = 'BUILD_SINK',
    BUILD_BELT = 'BUILD_BELT',
    DELETE = 'DELETE'
}

interface WorkbenchConfig {
    mode: 'SANDBOX' | 'CAMPAIGN';
    levelData?: any;
}

export class WorkbenchScene extends CoreGameScene {
    private currentMode: ToolMode = ToolMode.HAND;

    // Build State
    private selectedMachineName: string | null = null;
    private ghost: Phaser.GameObjects.Container | null = null;
    private ghostGraphics: Phaser.GameObjects.Graphics | null = null;

    // Belt State
    private isPlacingBelt: boolean = false;
    private beltStartPos: Phaser.Math.Vector2 | null = null;
    private beltPreview: Phaser.GameObjects.Graphics | null = null;

    // Entities
    private factories: Phaser.GameObjects.Group | null = null;

    // Configuration
    private config: WorkbenchConfig = { mode: 'SANDBOX' };

    constructor() {
        super('WorkbenchScene');
    }

    preload() {
        // Ensure assets are loaded in your BootScene or here
    }

    init(data: WorkbenchConfig) {
        if (data && data.mode) {
            this.config = data;
        }
        console.log(`Initializing Workbench in ${this.config.mode} mode`);
    }

    create() {
        super.create(); // Setup grid, camera, inputs

        // Initialize DataManager
        if (this.cache.json.exists('satisfactory_data')) {
            DataManager.getInstance().loadData(this.cache.json.get('satisfactory_data'));
        } else {
            console.warn("Data not found: satisfactory_data");
        }

        this.factories = this.add.group();

        // Setup Workbench Specifics
        this.createUI();
        this.setupInteraction();
        this.createGhost();

        // Mode Specific Setup
        if (this.config.mode === 'CAMPAIGN') {
            this.setupCampaignUI();
        } else {
            this.setupSandboxUI();
        }
    }

    override update(time: number, delta: number) {
        super.update(time, delta); // Keep camera panning working
        this.updateGhost();
        this.updateBeltPreview();
    }

    // --- UI SYSTEM (DOM Overlay) ---

    private createUI() {
        const container = document.createElement('div');
        // Styles
        Object.assign(container.style, {
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            padding: '10px',
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            fontFamily: 'Arial, sans-serif'
        });

        // Helper to make buttons
        const createBtn = (label: string, mode: ToolMode, machineName?: string) => {
            const btn = document.createElement('button');
            btn.innerText = label;
            Object.assign(btn.style, {
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px'
            });

            // Hover effects for polish
            btn.onmouseover = () => btn.style.backgroundColor = '#666';
            btn.onmouseout = () => btn.style.backgroundColor = '#444';

            btn.onclick = () => this.setTool(mode, machineName);
            container.appendChild(btn);
        };

        createBtn("✋ Hand", ToolMode.HAND);
        createBtn("🏭 Smelter", ToolMode.BUILD_FACTORY, "Smelter");
        createBtn("🏭 Constructor", ToolMode.BUILD_FACTORY, "Constructor");
        createBtn("📦 Spawn", ToolMode.BUILD_SPAWN);
        createBtn("📥 Sink", ToolMode.BUILD_SINK);
        createBtn("🔗 Belt", ToolMode.BUILD_BELT);
        createBtn("❌ Delete", ToolMode.DELETE);

        document.body.appendChild(container);

        // Cleanup on scene shutdown to prevent duplicate UI
        this.events.on('shutdown', () => {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        });
    }

    private setupCampaignUI() {
        if (!this.config.levelData) return;
        const level = this.config.levelData;
        this.add.text(10, 10, `OBJECTIVE: Produce ${level.targetRate} ${level.targetItem}/min`, {
            fontSize: '20px',
            color: '#ffaa00',
            backgroundColor: '#000000aa',
            padding: { x: 5, y: 5}
        }).setScrollFactor(0);
    }

    private setupSandboxUI() {
        this.add.text(10, 10, 'SANDBOX MODE - No Limits', {
            fontSize: '20px',
            color: '#00ff00',
            backgroundColor: '#000000aa',
            padding: { x: 5, y: 5}
        }).setScrollFactor(0);
    }

    private setTool(mode: ToolMode, machineName?: string) {
        this.currentMode = mode;
        this.selectedMachineName = machineName || null;
        this.isPlacingBelt = false;
        this.beltStartPos = null;

        if (this.beltPreview) this.beltPreview.clear();
        console.log(`Tool changed to: ${mode} ${machineName ? `(${machineName})` : ''}`);
    }

    // --- GHOST & PLACEMENT SYSTEM ---

    private createGhost() {
        this.ghost = this.add.container(0, 0);
        this.ghostGraphics = this.add.graphics();
        this.ghost.add(this.ghostGraphics);
        this.ghost.setDepth(1000);
        this.ghost.setVisible(false);
    }

    private updateGhost() {
        if (!this.ghost || !this.ghostGraphics) return;

        const pointer = this.input.activePointer;
        // Convert screen mouse to world coordinates (accounts for zoom/pan)
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // Snap to Grid
        const snapX = Math.round(worldPoint.x / this.TILE_SIZE) * this.TILE_SIZE;
        const snapY = Math.round(worldPoint.y / this.TILE_SIZE) * this.TILE_SIZE;

        const isBuilding = (
            this.currentMode === ToolMode.BUILD_FACTORY ||
            this.currentMode === ToolMode.BUILD_SPAWN ||
            this.currentMode === ToolMode.BUILD_SINK
        );

        this.ghost.setVisible(isBuilding);
        if (!isBuilding) return;

        this.ghost.setPosition(snapX, snapY);

        // Redraw Ghost visual
        this.ghostGraphics.clear();

        let size = { w: 1, h: 1 };
        let color = 0xffffff;

        if (this.currentMode === ToolMode.BUILD_FACTORY && this.selectedMachineName) {
            size = DataManager.getInstance().getMachineSize(this.selectedMachineName);
            color = 0x00aaff;
        } else if (this.currentMode === ToolMode.BUILD_SPAWN) {
            color = 0x00ff00;
        } else if (this.currentMode === ToolMode.BUILD_SINK) {
            size = { w: 2, h: 2 };
            color = 0xff0000;
        }

        this.ghostGraphics.fillStyle(color, 0.4);
        this.ghostGraphics.fillRect(-(size.w * this.TILE_SIZE)/2, -(size.h * this.TILE_SIZE)/2, size.w * this.TILE_SIZE, size.h * this.TILE_SIZE);
        this.ghostGraphics.lineStyle(2, color, 0.8);
        this.ghostGraphics.strokeRect(-(size.w * this.TILE_SIZE)/2, -(size.h * this.TILE_SIZE)/2, size.w * this.TILE_SIZE, size.h * this.TILE_SIZE);
    }

    // --- INTERACTION LOGIC ---

    private setupInteraction() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) { // Left Click
                this.handleLeftClick(pointer);
            }
        });

        this.input.keyboard?.on('keydown-ESC', () => {
            this.setTool(ToolMode.HAND);
        });
    }

    private handleLeftClick(pointer: Phaser.Input.Pointer) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const snapX = Math.round(worldPoint.x / this.TILE_SIZE) * this.TILE_SIZE;
        const snapY = Math.round(worldPoint.y / this.TILE_SIZE) * this.TILE_SIZE;

        switch (this.currentMode) {
            case ToolMode.BUILD_FACTORY:
            case ToolMode.BUILD_SPAWN:
            case ToolMode.BUILD_SINK:
                this.placeEntity(snapX, snapY);
                break;

            case ToolMode.BUILD_BELT:
                this.handleBeltClick(snapX, snapY);
                break;
            // Hand and Delete handled by object interactivity
        }
    }

    // --- ENTITY PLACEMENT ---

    private placeEntity(x: number, y: number) {
        let label = "Entity";
        let size = { w: 1, h: 1 };
        let color = 0x888888;

        if (this.currentMode === ToolMode.BUILD_FACTORY && this.selectedMachineName) {
            label = this.selectedMachineName;
            size = DataManager.getInstance().getMachineSize(label);
            color = 0x4444aa;
        } else if (this.currentMode === ToolMode.BUILD_SPAWN) {
            label = "Spawn";
            color = 0x44aa44;
        } else if (this.currentMode === ToolMode.BUILD_SINK) {
            label = "Sink";
            size = { w: 2, h: 2 };
            color = 0xaa4444;
        }

        const container = this.add.container(x, y);
        container.setSize(size.w * this.TILE_SIZE, size.h * this.TILE_SIZE);

        const rect = this.add.rectangle(0, 0, size.w * this.TILE_SIZE, size.h * this.TILE_SIZE, color);
        rect.setStrokeStyle(2, 0xffffff);

        const text = this.add.text(0, 0, label, { fontSize: '14px', color: '#fff', align: 'center' }).setOrigin(0.5);

        container.add([rect, text]);

        // Interaction
        rect.setInteractive();

        rect.on('pointerdown', (pointer: any) => {
            // Stop propagation so we don't trigger 'handleLeftClick' on the scene too
            // (though currently handled by mode checks, this is safer)
            pointer.event.stopPropagation();

            if (this.currentMode === ToolMode.DELETE) {
                container.destroy();
            }
        });

        this.input.setDraggable(rect);

        rect.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (this.currentMode === ToolMode.HAND) {
                // Update position based on world point (snapped)
                const worldP = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const sX = Math.round(worldP.x / this.TILE_SIZE) * this.TILE_SIZE;
                const sY = Math.round(worldP.y / this.TILE_SIZE) * this.TILE_SIZE;
                container.setPosition(sX, sY);
            }
        });

        this.factories?.add(container);
    }

    // --- BELT LOGIC ---

    private handleBeltClick(x: number, y: number) {
        if (!this.isPlacingBelt) {
            this.isPlacingBelt = true;
            this.beltStartPos = new Phaser.Math.Vector2(x, y);
            if (!this.beltPreview) this.beltPreview = this.add.graphics().setDepth(500);
        } else {
            if (this.beltStartPos) {
                this.placeBeltSegment(this.beltStartPos.x, this.beltStartPos.y, x, y);
            }
            this.isPlacingBelt = false;
            this.beltStartPos = null;
            this.beltPreview?.clear();
        }
    }

    private updateBeltPreview() {
        if (!this.isPlacingBelt || !this.beltStartPos || !this.beltPreview) return;

        const pointer = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const snapX = Math.round(worldPoint.x / this.TILE_SIZE) * this.TILE_SIZE;
        const snapY = Math.round(worldPoint.y / this.TILE_SIZE) * this.TILE_SIZE;

        this.beltPreview.clear();
        this.beltPreview.lineStyle(10, 0xffcc00, 0.8);

        // Draw L Shape
        this.beltPreview.beginPath();
        this.beltPreview.moveTo(this.beltStartPos.x, this.beltStartPos.y);
        this.beltPreview.lineTo(snapX, this.beltStartPos.y);
        this.beltPreview.lineTo(snapX, snapY);
        this.beltPreview.strokePath();
    }

    private placeBeltSegment(x1: number, y1: number, x2: number, y2: number) {
        const belt = this.add.graphics();
        belt.lineStyle(8, 0xaaaaaa, 1); // Grey

        belt.beginPath();
        belt.moveTo(x1, y1);
        belt.lineTo(x2, y1);
        belt.lineTo(x2, y2);
        belt.strokePath();

        console.log(`Belt placed: (${x1},${y1}) -> (${x2},${y1}) -> (${x2},${y2})`);
    }
}