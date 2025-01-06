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
            console.log('Load game clicked');
        });

        backButton.on('pointerdown', () => {
            this.scene.start('main-menu');
        });
    }
}