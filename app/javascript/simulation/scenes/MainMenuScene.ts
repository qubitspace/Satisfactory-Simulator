export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create(): void {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        this.add.text(centerX, centerY - 100, 'Satisfactory Simulator', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const playButton = this.add.text(centerX, centerY, 'Play', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive();

        playButton.on('pointerdown', () => {
            this.scene.start('SimulationScene');
        });

        // Add mouse hover effects
        [playButton].forEach(button => {
            button.on('pointerover', () => {
                button.setBackgroundColor('#666666');
            });

            button.on('pointerout', () => {
                button.setBackgroundColor('#444444');
            });
        });
    }
}