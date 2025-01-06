export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'main-menu' });
    }

    create(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, centerY - 100, 'Satisfactory Simulator', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const sandboxButton = this.add.text(centerX, centerY, 'Sandbox', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        const levelButton = this.add.text(centerX, centerY + 80, 'Play', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        [sandboxButton, levelButton].forEach(button => {
            button.on('pointerover', () => {
                button.setBackgroundColor('#666666');
            });

            button.on('pointerout', () => {
                button.setBackgroundColor('#444444');
            });
        });

        sandboxButton.on('pointerdown', () => {
            this.scene.start('sandbox-select');
        });

        levelButton.on('pointerdown', () => {
            this.scene.start('level-select');
        });
    }
}