// /app/javascript/simulation/scenes/toolbar-scene.ts

import { SimulationScene } from './simulation-scene';
import GameData from '../types';

interface ToolbarConfig {
    toolbarHeight: number;
    yPosition: number;
}

interface FactoryIcon extends Phaser.GameObjects.Image {
    machineType: string;
}

export class ToolbarScene extends Phaser.Scene {
    private isDraggingFactory = false;
    private toolbarHeight: number = 100;
    private yPosition: number = 0;
    private gameData: GameData;

    // Factory browser variables
    private readonly ICONS_PER_PAGE = 6;  // Number of factory icons visible at once
    private currentPage: number = 0;
    private machines: string[] = [];
    private leftArrow?: Phaser.GameObjects.Text;
    private rightArrow?: Phaser.GameObjects.Text;
    private factoryContainer?: Phaser.GameObjects.Container;

    // Action button container
    private actionContainer?: Phaser.GameObjects.Container;
    private selectedFactory?: any = null;

    constructor() {
        super({key: 'toolbar-scene'});
        this.gameData = GameData.getInstance();
    }

    init(config: ToolbarConfig): void {
        this.toolbarHeight = config.toolbarHeight;
        this.yPosition = config.yPosition;
    }

    create(): void {
        // Create toolbar background
        this.add.rectangle(0, this.yPosition, window.innerWidth, this.toolbarHeight, 0x2a2a2a)
            .setOrigin(0, 0);

        // Create divider line
        this.add.line(
            window.innerWidth / 2,
            this.yPosition,
            0,
            0,
            0,
            this.toolbarHeight,
            0x444444
        ).setOrigin(0.5, 0);

        // Get all available machines
        this.machines = this.gameData.getAllMachines().map(m => m.name);

        // Create containers
        this.createFactoryBrowser();
        this.createActionPanel();

        // Listen for resize events
        this.events.on('resize', (data: ToolbarConfig) => {
            this.toolbarHeight = data.toolbarHeight;
            this.yPosition = data.yPosition;
            this.handleResize();
        });

        // Listen for factory selection events
        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
        simulationScene.events.on('factory-selected', this.handleFactorySelection, this);
        simulationScene.events.on('factory-deselected', this.handleFactoryDeselection, this);
    }

    private createFactoryBrowser(): void {
        const browserWidth = window.innerWidth / 2;

        // Create container for factory icons
        this.factoryContainer = this.add.container(0, 0);

        // Create navigation arrows
        this.leftArrow = this.add.text(20, this.yPosition + this.toolbarHeight / 2, '←', {
            fontSize: '32px',
            color: '#ffffff'
        })
            .setOrigin(0, 0.5)
            .setInteractive()
            .on('pointerdown', () => this.changePage(-1));

        this.rightArrow = this.add.text(browserWidth - 20, this.yPosition + this.toolbarHeight / 2, '→', {
            fontSize: '32px',
            color: '#ffffff'
        })
            .setOrigin(1, 0.5)
            .setInteractive()
            .on('pointerdown', () => this.changePage(1));

        // Initial page display
        this.updateFactoryIcons();
        this.updateArrowVisibility();
    }

    private createActionPanel(): void {
        const actionWidth = window.innerWidth / 2;
        this.actionContainer = this.add.container(actionWidth, 0);

        // Create action buttons (initially hidden)
        this.createActionButtons();
        this.setActionButtonsVisible(false);
    }

    private createActionButtons(): void {
        if (!this.actionContainer) return;

        const buttonStyle = {
            fontSize: '16px',
            backgroundColor: '#444444',
            padding: {x: 10, y: 5},
            color: '#ffffff'
        };

        const spacing = 120;
        const y = this.yPosition + this.toolbarHeight / 2;
        let x = 80;

        // Delete button
        const deleteButton = this.add.text(x, y, 'Delete', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.handleDelete());
        this.actionContainer.add(deleteButton);

        // Rotate button
        x += spacing;
        const rotateButton = this.add.text(x, y, 'Rotate', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.handleRotate());
        this.actionContainer.add(rotateButton);

        // Configure button
        x += spacing;
        const configButton = this.add.text(x, y, 'Configure', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.handleConfigure());
        this.actionContainer.add(configButton);
    }


    private updateFactoryIcons(): void {
        if (!this.factoryContainer) return;

        // Clear existing icons by destroying all children
        this.factoryContainer.each((child: Phaser.GameObjects.GameObject) => {
            child.destroy();
        });
        this.factoryContainer.removeAll();

        // Also clean up any labels that might be outside the container
        this.children.list
            .filter((child: Phaser.GameObjects.GameObject) =>
                child instanceof Phaser.GameObjects.Text &&
                child.y < this.yPosition && // Above the toolbar base
                child.x < window.innerWidth / 2) // In the factory browser section
            .forEach((child: Phaser.GameObjects.GameObject) => child.destroy());

        const startIndex = this.currentPage * this.ICONS_PER_PAGE;
        const endIndex = Math.min(startIndex + this.ICONS_PER_PAGE, this.machines.length);
        const browserWidth = window.innerWidth / 2;
        const iconSpacing = browserWidth / (this.ICONS_PER_PAGE + 1);

        for (let i = startIndex; i < endIndex; i++) {
            const machine = this.machines[i];
            const x = (i - startIndex + 1) * iconSpacing;
            const y = this.yPosition + this.toolbarHeight / 2;

            const icon = this.createFactoryIcon(x, y, machine, 48);
            this.factoryContainer.add(icon);
        }
    }

    private createFactoryIcon(x: number, y: number, machineType: string, size: number): Phaser.GameObjects.Container {
        // Create container for the icon and its label
        const container = this.add.container(x, y);

        // Create unique texture key for this machine type
        const textureKey = `factory-icon-${machineType.toLowerCase().replace(/\s+/g, '-')}`;

        // Generate texture if it doesn't exist
        if (!this.textures.exists(textureKey)) {
            const graphics = this.add.graphics();

            // Draw basic factory shape
            graphics.fillStyle(0x666666);
            graphics.fillRect(0, 0, size, size);
            graphics.lineStyle(2, 0x999999);
            graphics.strokeRect(0, 0, size, size);

            // Add visual indicators for inputs/outputs
            const machine = this.gameData.getMachine(machineType);
            if (machine) {
                const markerSize = 4; // Smaller markers for toolbar icons

                // Draw input markers on left side - compact view
                const inputSpacing = size / (machine.inputCount + 1);
                for (let i = 1; i <= machine.inputCount; i++) {
                    graphics.fillStyle(0x3333ff);
                    graphics.fillRect(0, i * inputSpacing, markerSize, markerSize);
                }

                // Draw output markers on right side - compact view
                const outputSpacing = size / (machine.outputCount + 1);
                for (let i = 1; i <= machine.outputCount; i++) {
                    graphics.fillStyle(0xff3333);
                    graphics.fillRect(size - markerSize, i * outputSpacing, markerSize, markerSize);
                }
            }

            graphics.generateTexture(textureKey, size, size);
            graphics.destroy();
        }

        // Create the icon
        const icon = this.add.image(0, 0, textureKey).setInteractive({draggable: true}) as FactoryIcon;
        icon.machineType = machineType;

        // Add text above icon
        const label = this.add.text(0, -size / 2 - 5, machineType, {
            fontSize: '12px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5, 1);

        // Add both icon and label to container
        container.add([icon, label]);

        // Setup drag events
        this.setupDragEvents(container, icon);

        return container;
    }

    private setupDragEvents(container: Phaser.GameObjects.Container, icon: FactoryIcon): void {
        const startPosition = {x: container.x, y: container.y};

        icon.on('dragstart', () => {
            this.isDraggingFactory = true;
            container.setAlpha(0.7);
        });

        icon.on('drag', (pointer: Phaser.Input.Pointer) => {
            container.x = pointer.x;
            container.y = pointer.y;
        });

        icon.on('dragend', (pointer: Phaser.Input.Pointer) => {
            this.isDraggingFactory = false;
            container.setAlpha(1);

            // Reset position
            container.x = startPosition.x;
            container.y = startPosition.y;

            // Get the simulation scene and create factory
            const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
            const worldPoint = simulationScene.cameras.main.getWorldPoint(pointer.x, pointer.y);

            // Only create if dragged onto the simulation scene (above toolbar)
            if (pointer.y < this.yPosition) {
                simulationScene.createFactory(worldPoint.x, worldPoint.y, icon.machineType);
            }
        });
    }

    private updateArrowVisibility(): void {
        if (!this.leftArrow || !this.rightArrow) return;

        const maxPages = Math.ceil(this.machines.length / this.ICONS_PER_PAGE);

        this.leftArrow.setAlpha(this.currentPage > 0 ? 1 : 0.3);
        this.rightArrow.setAlpha(this.currentPage < maxPages - 1 ? 1 : 0.3);
    }

    private changePage(delta: number): void {
        const maxPages = Math.ceil(this.machines.length / this.ICONS_PER_PAGE);
        const newPage = this.currentPage + delta;

        if (newPage >= 0 && newPage < maxPages) {
            this.currentPage = newPage;
            this.updateFactoryIcons();
            this.updateArrowVisibility();
        }
    }

    private handleFactorySelection(factory: any): void {
        this.selectedFactory = factory;
        this.setActionButtonsVisible(true);
    }

    private handleFactoryDeselection(): void {
        this.selectedFactory = null;
        this.setActionButtonsVisible(false);
    }

    private setActionButtonsVisible(visible: boolean): void {
        if (!this.actionContainer) return;
        this.actionContainer.setAlpha(visible ? 1 : 0.3);
    }

    private handleDelete(): void {
        if (!this.selectedFactory) return;
        // Implement delete functionality
        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
        // Add delete logic here
    }

    private handleRotate(): void {
        if (!this.selectedFactory) return;
        // Implement rotate functionality
        // Add rotate logic here
    }

    private handleConfigure(): void {
        if (!this.selectedFactory) return;
        // Implement configure functionality
        // Add configure logic here
    }

    private handleResize(): void {
        // Update toolbar background
        const rectangles = this.children.list.filter(child => child instanceof Phaser.GameObjects.Rectangle);
        const bg = rectangles[0] as Phaser.GameObjects.Rectangle;
        if (bg) {
            bg.setPosition(0, this.yPosition);
            bg.setSize(window.innerWidth, this.toolbarHeight);
        }

        // Update divider line position
        const divider = this.children.list.find(child =>
            child instanceof Phaser.GameObjects.Line) as Phaser.GameObjects.Line;
        if (divider) {
            divider.setPosition(window.innerWidth / 2, this.yPosition);
        }

        // Update browser width and icon positions
        this.updateFactoryIcons();

        // Update arrow positions
        if (this.leftArrow && this.rightArrow) {
            this.leftArrow.setPosition(20, this.yPosition + this.toolbarHeight / 2);
            this.rightArrow.setPosition(window.innerWidth / 2 - 20, this.yPosition + this.toolbarHeight / 2);
        }

        // Update action panel position
        if (this.actionContainer) {
            this.actionContainer.setPosition(window.innerWidth / 2, 0);
        }
    }
}