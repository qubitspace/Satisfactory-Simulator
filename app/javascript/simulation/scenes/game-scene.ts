import GameData, { Machine, Recipe, Item } from '../types';
import { SimulationScene } from './simulation-scene';
import {saveGame, loadGame, deleteSave, getSaves, SaveState} from '../save-system';

interface GameSceneData {
    mode: 'sandbox' | 'level';
    levelId?: number;
    saveState?: SaveState;
    saveName?: string;
}


export class GameScene extends Phaser.Scene {
    private gameData: GameData = GameData.getInstance();
    private mode: 'sandbox' | 'level' = 'sandbox';
    private levelId?: number;
    private saveName?: string;
    private readonly TOOLBAR_HEIGHT = 100;
    private autoSaveInterval: number = 5 * 60 * 1000; // 5 minutes
    private lastAutoSave: number = Date.now();
    private saveIndicator?: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'game-scene' });
    }

    init(data: GameSceneData): void {
        this.mode = data.mode;
        this.levelId = data.levelId;
        this.saveName = data.saveName;

        // Stop other scenes
        this.scene.stop('main-menu');
        this.scene.stop('sandbox-select');
        this.scene.stop('level-select');

        // If we have a save state, we'll load it after the simulation scene is created
        if (data.saveState) {
            this.events.once('create-complete', () => {
                this.loadSaveState(data.saveState!);
            });
        }
    }

    create(): void {
        const simulationHeight = window.innerHeight - this.TOOLBAR_HEIGHT;

        this.scene.launch('simulation-scene', {
            mode: this.mode,
            levelId: this.levelId
        });

        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
        simulationScene.cameras.main.setViewport(0, 0, window.innerWidth, simulationHeight);

        // Launch the toolbar
        this.scene.launch('toolbar-scene', {
            toolbarHeight: this.TOOLBAR_HEIGHT,
            yPosition: simulationHeight
        });

        // Create main UI elements
        this.createUI();

        // Create save indicator
        this.saveIndicator = this.add.text(window.innerWidth - 150, 10, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 8, y: 4 }
        });
        this.saveIndicator.setDepth(100);
        this.saveIndicator.setScrollFactor(0);
        this.saveIndicator.setVisible(false);

        window.addEventListener('resize', () => this.handleResize());

        // Emit create complete event for save loading
        this.events.emit('create-complete');
    }

    private createUI(): void {
        // Back button
        const backButton = this.add.text(100, 50, 'Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                // Confirm if in sandbox mode to prevent accidental data loss
                if (this.mode === 'sandbox') {
                    this.showExitConfirmation();
                } else {
                    this.exitToMenu();
                }
            });

        // Add save button for sandbox mode
        if (this.mode === 'sandbox') {
            const saveButton = this.add.text(250, 50, 'Save', {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#444444',
                padding: { x: 15, y: 8 }
            })
                .setInteractive()
                .on('pointerdown', () => this.saveGame());
        }

        // Add level-specific UI
        if (this.mode === 'level') {
            const objectivesButton = this.add.text(window.innerWidth - 150, 50, 'Objectives', {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#444444',
                padding: { x: 15, y: 8 }
            })
                .setInteractive()
                .on('pointerdown', () => {
                    console.log('Show objectives');
                });

            const checkButton = this.add.text(window.innerWidth - 150, 100, 'Check Level', {
                fontSize: '24px',
                color: '#ffffff',
                backgroundColor: '#444444',
                padding: { x: 15, y: 8 }
            })
                .setInteractive()
                .on('pointerdown', () => {
                    this.checkLevelCompletion();
                });
        }
    }

    private showExitConfirmation(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const dialogBg = this.add.rectangle(centerX, centerY, 400, 200, 0x333333);
        const dialog = this.add.container(centerX, centerY);

        const text = this.add.text(0, -30, 'Exit without saving?', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const saveAndExitButton = this.add.text(100, 30, 'Save & Exit', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                this.saveGame();
                this.exitToMenu();
            });

        const exitButton = this.add.text(0, 30, 'Exit', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#ff4444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                this.exitToMenu();
            });

        const cancelButton = this.add.text(-100, 30, 'Cancel', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                dialog.destroy();
                dialogBg.destroy();
            });

        dialog.add([text, saveAndExitButton, exitButton, cancelButton]);
    }

    private saveGame(): void {
        if (this.mode !== 'sandbox' || !this.saveName) return;

        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
        saveGame(simulationScene, this.saveName);
        this.lastAutoSave = Date.now();
        this.showSaveIndicator('Game Saved');
    }

    private loadSaveState(saveState: SaveState): void {
        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;

        // Clear existing factories first
        simulationScene.clearFactories();

        // Need to wait for next frame to ensure simulation scene is ready
        this.time.delayedCall(0, () => {
            // Recreate factories from save state
            saveState.factories.forEach((factory: { x: any; y: any; }) => {
                const worldX = factory.x;
                const worldY = factory.y;
                simulationScene.createFactory(worldX, worldY);
                // TODO: Restore factory configuration when implemented
            });

            this.showSaveIndicator('Game Loaded');
        });
    }


    private showSaveIndicator(message: string): void {
        if (!this.saveIndicator) return;

        this.saveIndicator.setText(message);
        this.saveIndicator.setVisible(true);

        this.time.delayedCall(2000, () => {
            if (this.saveIndicator) {
                this.saveIndicator.setVisible(false);
            }
        });
    }

    private exitToMenu(): void {
        // Stop all game-related scenes
        this.scene.stop('simulation-scene');
        this.scene.stop('toolbar-scene');
        this.scene.stop();

        // Return to appropriate menu
        if (this.mode === 'sandbox') {
            this.scene.start('sandbox-select');
        } else {
            this.scene.start('level-select');
        }
    }

    private handleResize(): void {
        const simulationHeight = window.innerHeight - this.TOOLBAR_HEIGHT;

        const simulationScene = this.scene.get('simulation-scene');
        simulationScene.cameras.main.setViewport(0, 0, window.innerWidth, simulationHeight);

        this.scene.get('toolbar-scene').events.emit('resize', {
            toolbarHeight: this.TOOLBAR_HEIGHT,
            yPosition: simulationHeight
        });

        // Update save indicator position
        if (this.saveIndicator) {
            this.saveIndicator.setPosition(window.innerWidth - 150, 10);
        }
    }

    private checkLevelCompletion(): void {
        console.log('Checking level completion for level:', this.levelId);
        // TODO: Implement level completion checking
    }

    shutdown(): void {
        this.scene.stop('simulation-scene');
        this.scene.stop('toolbar-scene');
        window.removeEventListener('resize', () => this.handleResize());
    }
}