import Phaser from "phaser"

export class CoreGameScene extends Phaser.Scene {
    protected readonly TILE_SIZE = 64;
    protected readonly MAP_WIDTH = 8000;
    protected readonly MAP_HEIGHT = 8000;
    protected readonly MIN_X = -this.MAP_WIDTH / 2;
    protected readonly MAX_X = this.MAP_WIDTH / 2;
    protected readonly MIN_Y = -this.MAP_HEIGHT / 2;
    protected readonly MAX_Y = this.MAP_HEIGHT / 2;

    protected controls: Phaser.Cameras.Scene2D.Camera | null = null;
    protected cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;

    private isDragging: boolean = false;
    private dragStartPos: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
    private minZoom: number = 0.1;

    constructor(key: string) {
        super({ key });
    }

    create() {
        // DISABLE CONTEXT MENU (Right Click Menu)
        this.game.canvas.oncontextmenu = (e) => e.preventDefault();

        this.createGridTexture();
        this.setupCamera();
        this.setupInputs();
        this.scale.on('resize', this.handleResize, this);
    }

    update(time: number, delta: number) {
        this.handleKeyboardPan(delta);
    }

    private setupCamera() {
        this.controls = this.cameras.main;
        this.controls.setBounds(this.MIN_X, this.MIN_Y, this.MAP_WIDTH, this.MAP_HEIGHT);
        this.controls.centerOn(0, 0);
        this.updateMinZoomLimit();
        this.controls.setZoom(1);
    }

    private handleResize() {
        if (!this.controls) return;
        this.updateMinZoomLimit();
        if (this.controls.zoom < this.minZoom) {
            this.controls.setZoom(this.minZoom);
        }
    }

    private updateMinZoomLimit() {
        const widthRatio = this.scale.width / this.MAP_WIDTH;
        const heightRatio = this.scale.height / this.MAP_HEIGHT;
        this.minZoom = Math.max(widthRatio, heightRatio);
    }

    private setupInputs() {
        // 1. Mouse Pan: Left (0) OR Right (2)
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Check for Left Button OR Right Button
            if (pointer.button === 0 || pointer.button === 2) {
                // If we are clicking on a game object (UI/Factory), don't drag immediately
                // (This logic is usually handled by the object consuming the event,
                // but for global drag, we check inputs).

                // Only drag if we are in "Hand" mode?
                // For now, Core handles the mechanics, Workbench will filter if we are allowed to drag.
                this.isDragging = true;
                this.dragStartPos.set(pointer.x, pointer.y);
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
            this.input.setDefaultCursor('default');
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging && this.controls) {
                const deltaX = this.dragStartPos.x - pointer.x;
                const deltaY = this.dragStartPos.y - pointer.y;

                this.controls.scrollX += deltaX / this.controls.zoom;
                this.controls.scrollY += deltaY / this.controls.zoom;

                this.dragStartPos.set(pointer.x, pointer.y);
            }
        });

        // 2. Zoom
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
            if (!this.controls) return;
            const worldPoint = this.controls.getWorldPoint(pointer.x, pointer.y);
            const newZoom = this.controls.zoom - this.controls.zoom * 0.001 * deltaY;
            this.controls.zoom = Phaser.Math.Clamp(newZoom, this.minZoom, 4);
            (this.controls as any).preRender();
            const newWorldPoint = this.controls.getWorldPoint(pointer.x, pointer.y);
            this.controls.scrollX -= newWorldPoint.x - worldPoint.x;
            this.controls.scrollY -= newWorldPoint.y - worldPoint.y;
        });

        // 3. Keyboard
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    private handleKeyboardPan(delta: number) {
        if (!this.controls || !this.cursors) return;
        const baseSpeed = 1.0 * delta;
        const adjustedSpeed = baseSpeed / this.controls.zoom;

        if (this.cursors.left.isDown) this.controls.scrollX -= adjustedSpeed;
        else if (this.cursors.right.isDown) this.controls.scrollX += adjustedSpeed;

        if (this.cursors.up.isDown) this.controls.scrollY -= adjustedSpeed;
        else if (this.cursors.down.isDown) this.controls.scrollY += adjustedSpeed;
    }

    // --- HELPERS FOR CHILDREN ---

    /** Draws grid lines */
    protected createGridTexture() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(this.MIN_X, this.MIN_Y, this.MAP_WIDTH, this.MAP_HEIGHT);

        graphics.lineStyle(1, 0x333333, 0.5);
        for (let x = this.MIN_X; x <= this.MAX_X; x += this.TILE_SIZE) {
            graphics.moveTo(x, this.MIN_Y);
            graphics.lineTo(x, this.MAX_Y);
        }
        for (let y = this.MIN_Y; y <= this.MAX_Y; y += this.TILE_SIZE) {
            graphics.moveTo(this.MIN_X, y);
            graphics.lineTo(this.MAX_X, y);
        }
        graphics.strokePath();

        // Borders
        const borderThickness = 20;
        graphics.lineStyle(borderThickness, 0x555555, 1);
        graphics.strokeRect(this.MIN_X - borderThickness/2, this.MIN_Y - borderThickness/2, this.MAP_WIDTH + borderThickness, this.MAP_HEIGHT + borderThickness);
    }
}