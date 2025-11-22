import Phaser from "phaser";

export class CoreGameScene extends Phaser.Scene {
    // Grid Configuration
    public readonly TILE_SIZE = 32;
    protected readonly MAP_WIDTH_TILES = 200;
    protected readonly MAP_HEIGHT_TILES = 200;

    // Tilemap References
    public map!: Phaser.Tilemaps.Tilemap;
    public baseLayer!: Phaser.Tilemaps.TilemapLayer;

    // Camera State
    protected controls: Phaser.Cameras.Scene2D.Camera | null = null;
    protected cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;

    // Zoom Limits
    private minZoom: number = 0.1;
    private readonly MAX_ZOOM: number = 4;

    // Interaction Flags
    public disableScroll: boolean = false;

    private isPanning: boolean = false;
    private dragStartPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();

    constructor(key: string) {
        super({ key });
    }

    preload() {
        // GENERATE A DEBUG GRID TEXTURE
        if (!this.textures.exists('grid_tile')) {
            // FIX: Removed 'add: false' to fix TS error
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.lineStyle(1, 0x333333, 0.5);
            graphics.strokeRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
            graphics.generateTexture('grid_tile', this.TILE_SIZE, this.TILE_SIZE);
            graphics.destroy();
        }
    }

    create() {
        this.game.canvas.oncontextmenu = (e) => e.preventDefault();

        this.createTilemap();
        this.setupCamera();
        this.setupInputs();

        // Listen for window resizing to update zoom limits
        this.scale.on('resize', this.handleResize, this);
    }

    update(time: number, delta: number) {
        this.handleKeyboardPan(delta);
    }

    private createTilemap() {
        this.map = this.make.tilemap({
            tileWidth: this.TILE_SIZE,
            tileHeight: this.TILE_SIZE,
            width: this.MAP_WIDTH_TILES,
            height: this.MAP_HEIGHT_TILES
        });

        const tileset = this.map.addTilesetImage('grid_tile', undefined, this.TILE_SIZE, this.TILE_SIZE);

        if (tileset) {
            this.baseLayer = this.map.createBlankLayer('Ground', tileset, 0, 0)!;
            this.baseLayer.fill(0, 0, 0, this.map.width, this.map.height);
        }
    }

    private setupCamera() {
        this.controls = this.cameras.main;

        const widthInPixels = this.MAP_WIDTH_TILES * this.TILE_SIZE;
        const heightInPixels = this.MAP_HEIGHT_TILES * this.TILE_SIZE;

        // Set bounds so we can't scroll past the edge
        this.controls.setBounds(0, 0, widthInPixels, heightInPixels);

        // Center initially
        this.controls.centerOn(widthInPixels / 2, heightInPixels / 2);

        // Calculate the initial minimum zoom based on screen size
        this.updateMinZoomLimit();
        this.controls.setZoom(this.minZoom);
    }

    private handleResize() {
        if (!this.controls) return;
        this.updateMinZoomLimit();
    }

    /**
     * Calculates the minimum zoom level required to cover the screen.
     * This prevents the camera from seeing "outside" the map bounds.
     */
    private updateMinZoomLimit() {
        if (!this.controls) return;

        const widthInPixels = this.MAP_WIDTH_TILES * this.TILE_SIZE;
        const heightInPixels = this.MAP_HEIGHT_TILES * this.TILE_SIZE;

        const widthRatio = this.scale.width / widthInPixels;
        const heightRatio = this.scale.height / heightInPixels;

        // Use Math.max to ensure the map always COVERS the screen (no black bars).
        // Use Math.min if you want to allow black bars but see the whole map.
        this.minZoom = Math.max(widthRatio, heightRatio);

        // If current zoom is invalid (too zoomed out), clamp it
        if (this.controls.zoom < this.minZoom) {
            this.controls.setZoom(this.minZoom);
        }
    }

    private setupInputs() {
        // --- PANNING (Right Click) ---
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.disableScroll) return;
            if (pointer.button === 1 || pointer.button === 2) {
                this.isPanning = true;
                this.dragStartPos.set(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerup', () => { this.isPanning = false; });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isPanning && this.controls && !this.disableScroll) {
                const deltaX = this.dragStartPos.x - pointer.x;
                const deltaY = this.dragStartPos.y - pointer.y;

                this.controls.scrollX += deltaX / this.controls.zoom;
                this.controls.scrollY += deltaY / this.controls.zoom;

                this.dragStartPos.set(pointer.x, pointer.y);
            }
        });

        // --- ZOOM TO MOUSE (Wheel) ---
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
            if (!this.controls) return;

            // 1. Get world point BEFORE zoom
            const worldPoint = this.controls.getWorldPoint(pointer.x, pointer.y);

            // 2. Calculate new zoom
            const newZoom = this.controls.zoom - this.controls.zoom * 0.001 * deltaY;
            this.controls.zoom = Phaser.Math.Clamp(newZoom, this.minZoom, this.MAX_ZOOM);

            // 3. IMPORTANT: Update camera matrices immediately
            this.controls.preRender();

            // 4. Get world point AFTER zoom
            const newWorldPoint = this.controls.getWorldPoint(pointer.x, pointer.y);

            // 5. Scroll the difference to keep mouse focused
            this.controls.scrollX -= newWorldPoint.x - worldPoint.x;
            this.controls.scrollY -= newWorldPoint.y - worldPoint.y;
        });

        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private handleKeyboardPan(delta: number) {
        if (!this.controls || !this.cursors) return;
        const baseSpeed = 0.5 * delta;
        const adjustedSpeed = baseSpeed / this.controls.zoom;

        if (this.cursors.left.isDown) this.controls.scrollX -= adjustedSpeed;
        else if (this.cursors.right.isDown) this.controls.scrollX += adjustedSpeed;
        if (this.cursors.up.isDown) this.controls.scrollY -= adjustedSpeed;
        else if (this.cursors.down.isDown) this.controls.scrollY += adjustedSpeed;
    }

    // --- HELPER: Snap World Coords to Tilemap ---
    public getSnappedWorldPoint(pointerX: number, pointerY: number): Phaser.Math.Vector2 {
        const tilePoint = this.map.worldToTileXY(pointerX, pointerY);

        // FIX: Handle cases where we point outside the grid (returns null)
        if (!tilePoint) {
            return new Phaser.Math.Vector2(0, 0);
        }

        if (tilePoint.x < 0) tilePoint.x = 0;
        if (tilePoint.y < 0) tilePoint.y = 0;
        if (tilePoint.x >= this.map.width) tilePoint.x = this.map.width - 1;
        if (tilePoint.y >= this.map.height) tilePoint.y = this.map.height - 1;

        const worldPoint = this.map.tileToWorldXY(tilePoint.x, tilePoint.y);

        return new Phaser.Math.Vector2(worldPoint?.x || 0, worldPoint?.y || 0);
    }
}