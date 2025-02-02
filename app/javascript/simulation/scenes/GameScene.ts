import GameData, { Machine, Recipe, Item } from '../types';
import { SimulationScene } from './SimulationScene';


export class GameScene extends Phaser.Scene {
    private readonly TOOLBAR_HEIGHT = 100;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(): void {
        this.scene.stop('main-menu');
    }

    shutdown(): void {
    }

    create(): void {
        const simulationHeight = window.innerHeight - this.TOOLBAR_HEIGHT;

        // Simulation Scene
        this.scene.launch('simulation-scene', {});

        // Toolbar Scene
        this.scene.launch('toolbar-scene', {
            toolbarHeight: this.TOOLBAR_HEIGHT,
            yPosition: simulationHeight
        });

        // Initialize UI and event listeners
        this.createUI();
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', this.handleBeforeUnload);

        this.events.emit("game-scene-ready");
    }

    private createUI(): void {

        this.add.text(100, 50, 'Exit', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                this.exitToMenu();
            });
    }

    private exitToMenu(): void {
        // Stop all game-related scenes
        this.scene.stop('simulation-scene');
        this.scene.stop('toolbar-scene');
        this.scene.stop();

        // Return to appropriate menu
        this.scene.start('main-menu');
    }

    private handleResize(): void {
        const simulationHeight = window.innerHeight - this.TOOLBAR_HEIGHT;

        const simulationScene = this.scene.get('simulation-scene');
        simulationScene.cameras.main.setViewport(0, 0, window.innerWidth, simulationHeight);

        this.scene.get('toolbar-scene').events.emit('resize', {
            toolbarHeight: this.TOOLBAR_HEIGHT,
            yPosition: simulationHeight
        });
    }

    private handleBeforeUnload = (event: BeforeUnloadEvent) => {
        // Do stuff like saving game state
    }
}