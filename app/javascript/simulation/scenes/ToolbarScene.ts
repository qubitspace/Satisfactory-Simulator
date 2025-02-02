// /app/javascript/simulation/scenes/ToolbarScene.ts

import Phaser from 'phaser';
import GameData from '../types';

interface ToolbarConfig {
    toolbarHeight: number;
    yPosition: number;
}

export class ToolbarScene extends Phaser.Scene {
    private toolbarHeight: number = 100;
    private yPosition: number = 0;
    private isDraggingFactory: boolean = false;
    private dragPreview?: Phaser.GameObjects.Rectangle;
    private toolbarBg!: Phaser.GameObjects.Image;
    private factoryEditor!: Phaser.GameObjects.DOMElement;

    constructor() {
        super({ key: 'ToolbarScene' });
    }

    preload(): void {
        this.load.svg('toolbar_bg', '/toolbar_bg.svg', { width: 800, height: 100 });
    }

    init(config: ToolbarConfig): void {
        this.toolbarHeight = config.toolbarHeight;
        this.yPosition = config.yPosition;
    }

    // New helper method to generate recipe options HTML:
    private getRecipeOptionsHtml(): string {
        const gameData = GameData.getInstance();
        const recipes = gameData.getAllRecipes();
        return recipes.map(recipe => `<option value="${recipe.name}">${recipe.name}</option>`).join('');
    }

    create(): void {
        // Replace the plain rectangle with a textured background image
        this.toolbarBg = this.add.image(0, this.yPosition, 'toolbar_bg').setOrigin(0, 0);
        this.toolbarBg.setDisplaySize(window.innerWidth, this.toolbarHeight);

        // Create the factory button over the background image
        const buttonWidth = 100;
        const buttonHeight = 40;
        const button = this.add
            .rectangle(100, this.yPosition + this.toolbarHeight / 2, buttonWidth, buttonHeight, 0x444444)
            .setInteractive({ useHandCursor: true });
        this.add
            .text(100, this.yPosition + this.toolbarHeight / 2, 'Factory', {
                color: '#ffffff',
                fontSize: '16px'
            })
            .setOrigin(0.5);

        // Handle drag start for the factory icon
        button.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDraggingFactory = true;
            this.dragPreview = this.add
                .rectangle(pointer.x, pointer.y, 128, 128, 0x666666)
                .setStrokeStyle(2, 0x999999)
                .setAlpha(0.7);
        });

        // Handle drag movement
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingFactory && this.dragPreview) {
                this.dragPreview.x = pointer.x;
                this.dragPreview.y = pointer.y;
            }
        });

        // Handle drag end: if dropped above the toolbar, request a factory be created in SimulationScene
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isDraggingFactory) {
                if (pointer.y < this.yPosition) {
                    const simScene = this.scene.get('SimulationScene');
                    try {
                        if (simScene && simScene.cameras && simScene.cameras.main) {
                            const worldPoint = simScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
                            simScene.input.emit('create-factory', worldPoint.x, worldPoint.y);
                        }
                    } catch (error) {
                        console.warn('Could not place factory - simulation scene not ready');
                    }
                }
                this.isDraggingFactory = false;
                if (this.dragPreview) {
                    this.dragPreview.destroy();
                    this.dragPreview = undefined;
                }
            }
        });

        // Update background size on window resize
        const resizeHandler = () => {
            this.toolbarBg.setDisplaySize(window.innerWidth, this.toolbarHeight);
        };
        window.addEventListener('resize', resizeHandler);
        this.events.on('shutdown', () => {
            window.removeEventListener('resize', resizeHandler);
        });

        // Create a factory editor panel (hidden by default)
        this.factoryEditor = this.add.dom(
            window.innerWidth / 2,
            this.yPosition + this.toolbarHeight / 2,
            'div',
            'background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; display: inline-block;'
        );
        this.factoryEditor.setOrigin(0.5);
        this.factoryEditor.setVisible(false);
        this.factoryEditor.setHTML(`
          <label>Recipe:
            <select id="recipe-select">
              ${this.getRecipeOptionsHtml()}
            </select>
          </label>
          <br>
          <label>Machine Count:
            <input type="number" id="machine-count" value="1" min="1" style="width: 50px;">
          </label>
          <br>
          <label>Overclock (%):
            <input type="number" id="overclock-percentage" value="100" min="1" max="250" style="width: 60px;">
          </label>
          <br>
          <label>Somerslooped:
            <input type="checkbox" id="somerslooped">
          </label>
        `);
        this.factoryEditor.setOrigin(0.5);
        this.factoryEditor.setVisible(false);

        // When a factory is selected, populate and show the editor.
        this.game.events.on('factory-selected', (factory: any) => {
            this.factoryEditor.setVisible(true);
            const recipeSelect = this.factoryEditor.node.querySelector('#recipe-select') as HTMLSelectElement;
            const machineCountInput = this.factoryEditor.node.querySelector('#machine-count') as HTMLInputElement;
            const overclockInput = this.factoryEditor.node.querySelector('#overclock-percentage') as HTMLInputElement;
            const somersloopedCheckbox = this.factoryEditor.node.querySelector('#somerslooped') as HTMLInputElement;

            if (recipeSelect) recipeSelect.value = factory.targetRecipe || "";
            if (machineCountInput) machineCountInput.value = factory.machineCount;
            if (overclockInput) overclockInput.value = factory.overclockPercentage;
            if (somersloopedCheckbox) somersloopedCheckbox.checked = factory.isSomerslooped;
        });

        // Hide the editor when the factory is deselected
        this.game.events.on('factory-deselected', () => {
            this.factoryEditor.setVisible(false);
        });

        // Setup event listeners on the DOM element.
        const sceneRef = this;
        this.factoryEditor.addListener('change');
        this.factoryEditor.on('change', function () {
            const recipeSelect = sceneRef.factoryEditor.node.querySelector('#recipe-select') as HTMLSelectElement;
            const machineCountInput = sceneRef.factoryEditor.node.querySelector('#machine-count') as HTMLInputElement;
            const overclockInput = sceneRef.factoryEditor.node.querySelector('#overclock-percentage') as HTMLInputElement;
            const somersloopedCheckbox = sceneRef.factoryEditor.node.querySelector('#somerslooped') as HTMLInputElement;

            const config = {
                targetRecipe: recipeSelect ? recipeSelect.value : "",
                machineCount: machineCountInput ? parseInt(machineCountInput.value) : 1,
                overclockPercentage: overclockInput ? parseInt(overclockInput.value) : 100,
                isSomerslooped: somersloopedCheckbox ? somersloopedCheckbox.checked : false
            };
            sceneRef.game.events.emit('update-selected-factory', config);
        });
    }
}