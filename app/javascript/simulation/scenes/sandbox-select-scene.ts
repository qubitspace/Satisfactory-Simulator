import { SaveState } from '../systems/save-system';
import { getSaves, loadGame, deleteSave } from '../systems/save-system';

export class SandboxSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'sandbox-select' });
    }

    create(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, 100, 'Sandbox', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const newGameButton = this.add.text(centerX, centerY - 50, 'New Game', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        const loadGameButton = this.add.text(centerX, centerY + 50, 'Load Game', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        const backButton = this.add.text(100, 50, 'Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive();

        [newGameButton, loadGameButton, backButton].forEach(button => {
            button.on('pointerover', () => {
                button.setBackgroundColor('#666666');
            });

            button.on('pointerout', () => {
                button.setBackgroundColor('#444444');
            });
        });

        newGameButton.on('pointerdown', () => {
            this.scene.start('game-scene', { mode: 'sandbox' });
        });

        loadGameButton.on('pointerdown', () => {
            this.showLoadMenu();
        });

        backButton.on('pointerdown', () => {
            this.scene.start('main-menu');
        });
    }

    private showLoadMenu(): void {
        // Clear any existing menu
        this.children.getAll().forEach(child => child.destroy());

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Title
        this.add.text(centerX, 50, 'Load Game', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Back button
        const backButton = this.add.text(100, 50, 'Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('sandbox-select');
            });

        // Get all saves
        const saves = getSaves();

        if (saves.length === 0) {
            this.add.text(centerX, centerY, 'No saves found', {
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);
            return;
        }

        // Create save list
        saves.forEach((save, index) => {
            const y = 150 + (index * 80);
            const container = this.add.container(centerX, y);

            // Save entry background
            const bg = this.add.rectangle(0, 0, 600, 60, 0x444444)
                .setInteractive()
                .on('pointerover', () => bg.setFillStyle(0x666666))
                .on('pointerout', () => bg.setFillStyle(0x444444))
                .on('pointerdown', () => this.loadSave(save.name));

            // Save name
            const nameText = this.add.text(-280, -15, save.name, {
                fontSize: '20px',
                color: '#ffffff'
            });

            // Date
            const date = new Date(save.timestamp).toLocaleString();
            const dateText = this.add.text(-280, 10, date, {
                fontSize: '16px',
                color: '#cccccc'
            });

            // Load button
            const loadButton = this.add.text(200, -10, 'Load', {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#1a6600',
                padding: { x: 10, y: 5 }
            })
                .setInteractive()
                .on('pointerdown', () => this.loadSave(save.name));

            // Delete button
            const deleteButton = this.add.text(270, -10, 'Delete', {
                fontSize: '18px',
                color: '#ffffff',
                backgroundColor: '#660000',
                padding: { x: 10, y: 5 }
            })
                .setInteractive()
                .on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                    pointer.event.stopPropagation();
                    this.deleteSave(save.name);
                });

            container.add([bg, nameText, dateText, loadButton, deleteButton]);
        });
    }

    private loadSave(saveName: string): void {
        const saveData = loadGame(saveName);
        if (saveData) {
            console.log('Loading save:', saveData);
            this.scene.start('game-scene', {
                mode: 'sandbox',
                saveState: saveData,
                saveName: saveName
            });
        } else {
            console.error('Failed to load save:', saveName);
        }
    }

    private deleteSave(saveName: string): void {
        // Create confirmation dialog
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Add semi-transparent overlay to dim background
        const overlay = this.add.rectangle(0, 0,
            this.cameras.main.width * 2,
            this.cameras.main.height * 2,
            0x000000, 0.5);

        const dialogBg = this.add.rectangle(centerX, centerY, 400, 200, 0x333333);
        const dialog = this.add.container(centerX, centerY);

        const text = this.add.text(0, -30, `Delete save "${saveName}"?`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const confirmButton = this.add.text(60, 30, 'Delete', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#660000',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                try {
                    deleteSave(saveName);
                    console.log(`Deleted save: ${saveName}`);
                    overlay.destroy();
                    dialog.destroy();
                    dialogBg.destroy();
                    this.showLoadMenu(); // Refresh the menu
                } catch (error) {
                    console.error('Error deleting save:', error);
                }
            });

        const cancelButton = this.add.text(-60, 30, 'Cancel', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                overlay.destroy();
                dialog.destroy();
                dialogBg.destroy();
            });

        dialog.add([text, confirmButton, cancelButton]);

        // Make sure cancel still works if clicking outside
        overlay.setInteractive()
            .on('pointerdown', () => {
                overlay.destroy();
                dialog.destroy();
                dialogBg.destroy();
            });
    }
}