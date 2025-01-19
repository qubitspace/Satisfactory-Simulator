import GameData, { Machine, Recipe, Item } from '../types';
import { SimulationScene } from './simulation-scene';
import {saveGame, loadGame, deleteSave, getSaves, SaveState} from '../systems/save-system';
import {updateUrlParam} from "../index";

interface GameSceneData {
    mode: 'sandbox' | 'level';
    levelId?: number;
    saveState?: SaveState;
    saveName?: string;
}


export class GameScene extends Phaser.Scene {
    private readonly TOOLBAR_HEIGHT = 100;
    private gameData: GameData = GameData.getInstance();
    private mode: 'sandbox' | 'level' = 'sandbox';
    private levelId?: number;
    private saveName?: string;
    private saveIndicator?: Phaser.GameObjects.Text;

    private loadedFromURLParam = false;

    constructor() {
        super({ key: 'game-scene' });
    }

    init(data: GameSceneData): void {
        this.mode = data.mode;
        this.levelId = data.levelId;
        this.saveName = data.saveName;
        console.log('GameScene init:', this.mode, this.levelId, this.saveName);

        // Stop other scenes
        this.scene.stop('main-menu');
        this.scene.stop('sandbox-select');
        this.scene.stop('level-select');

        // If we have a save state, we'll load it after the simulation scene is created
        if (data.saveState) {
            const simScene = this.scene.get('simulation-scene');
            simScene.events.once('simulation-scene-ready', () => {
                this.loadSaveState(data.saveState!);
            });
        }
    }

    shutdown(): void {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        if (this.mode === 'sandbox' && this.saveName) {
              const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
              try {
                    saveGame(simulationScene, this.saveName);
                    localStorage.setItem('lastActiveSave', this.saveName);
                  } catch (error) {
                  console.error('Auto-save failed:', error);
              }
        }
        this.scene.stop('simulation-scene');
        this.scene.stop('toolbar-scene');
        window.removeEventListener('resize', () => this.handleResize());
    }

    create(): void {
        console.log('[GameScene.create]', 'mode=', this.mode, 'saveName=', this.saveName);

        // 1) Check ?saveName= in the URL
        const urlParams = new URLSearchParams(window.location.search);
        let paramSaveName = urlParams.get('saveName');

        // 2) If no ?saveName, fallback to localStorage's "lastActiveSave"
        if (!paramSaveName) {
            const lastSaved = localStorage.getItem('lastActiveSave');
            if (lastSaved) {
                paramSaveName = lastSaved;
            }
        }

        // 3) If we found a saveName, we do an immediate load if it exists;
        if (this.mode === 'sandbox' && paramSaveName) {
            // We only do this if the game wasn’t specifically launched with a “saveName” in init()
            this.loadedFromURLParam = true;
            const loadedState = loadGame(paramSaveName);
            if (loadedState) {
                this.saveName = paramSaveName;
                const simScene = this.scene.get('simulation-scene');
                simScene.events.once('simulation-scene-ready', () => {
                    this.loadSaveState(loadedState);
                });
            } else {
                // If not found, just create a new empty sim with that name
                this.saveName = paramSaveName;
            }
        }
        // If none of the above apply, we either have this.saveName from init() or we do a new game

        const simulationHeight = window.innerHeight - this.TOOLBAR_HEIGHT;

        // Simulation Scene
        this.scene.launch('simulation-scene', {
            mode: this.mode,
            levelId: this.levelId
        });

        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;

        // Toolbar Scene
        this.scene.launch('toolbar-scene', {
            toolbarHeight: this.TOOLBAR_HEIGHT,
            yPosition: simulationHeight
        });

        // Initialize UI and event listeners
        this.createUI();
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', this.handleBeforeUnload);

        console.log('GameScene.create complete');
        this.events.emit("game-scene-ready");
    }

    private createUI(): void {

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
        if (this.mode !== 'sandbox') return;

        // Generate a default save name if none exists
        if (!this.saveName) {
            const d = new Date();
            this.saveName = `Auto_${d.getFullYear()}_${(d.getMonth()+1)}_${d.getDate()}_${d.getHours()}${d.getMinutes()}`;
        }

        try {
            const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
            saveGame(simulationScene, this.saveName);
            console.log(`Game saved as: ${this.saveName}`);
            this.showSaveIndicator('Game Saved');
            localStorage.setItem('lastActiveSave', this.saveName);
            updateUrlParam('saveName', this.saveName);
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showSaveIndicator('Save Failed!');
        }
    }

    private loadSaveState(saveState: SaveState): void {
        console.log("loadSavedState", saveState);
        const simulationScene = this.scene.get('simulation-scene') as SimulationScene;

        if (!simulationScene) {
            console.error('Failed to get simulation scene');
            return;
        }

        simulationScene.clearFactories();

        // Need to wait for next frame to ensure simulation scene is ready
        this.time.delayedCall(0, () => {
            console.log('Recreating factories from save state:', saveState.factories.length);
            // Recreate factories from save state
            saveState.factories.forEach((f, index) => {
                console.log(`Creating factory ${index + 1}:`, f);
                simulationScene.createFactory(f.x, f.y, f.type, f.recipe);
            });

            console.log('Factory recreation complete');
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

    private handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (this.mode === 'sandbox' && this.saveName) {
            const simulationScene = this.scene.get('simulation-scene') as SimulationScene;
            try {
                saveGame(simulationScene, this.saveName);
                localStorage.setItem('lastActiveSave', this.saveName);
            } catch (error) {
                  console.error('Auto-save on unload failed:', error);
            }
        }
    }
}