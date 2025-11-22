import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title
        this.add.text(width / 2, height / 3, 'FLOW FACTORY', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Button 1: Sandbox
        const sandboxBtn = this.createButton(width / 2, height / 2, 'Start Sandbox', () => {
            // We pass an object defining the mode
            this.scene.start('WorkbenchScene', {
                mode: 'SANDBOX',
                levelData: null // Sandbox has no limits/goals
            });
        });

        // Button 3: Campaign (Future)
        const campaignBtn = this.createButton(width / 2, height / 2 + 80, 'Start Campaign', () => {
            // We pass different data for the campaign
            this.scene.start('WorkbenchScene', {
                mode: 'CAMPAIGN',
                levelData: {
                    id: 'level_01',
                    targetItem: 'Iron Plate',
                    targetRate: 20,
                    startingMoney: 500
                }
            });
        });

        // Button 2: Load Game
        const loadBtn = this.createButton(width / 2, height / 2 + 80, 'Load Game', () => {
            console.log("Load Game clicked - Feature pending");
        });
    }

    private createButton(x: number, y: number, label: string, callback: () => void) {
        const button = this.add.text(x, y, label, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#888888',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setStyle({ color: '#ffffff', backgroundColor: '#444444' }))
            .on('pointerout', () => button.setStyle({ color: '#888888', backgroundColor: '#222222' }))
            .on('pointerdown', callback);

        return button;
    }
}