import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background gradient effect
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a1a1a, 0x1a1a1a, 1);
        graphics.fillRect(0, 0, width, height);

        // Main Title
        this.add.text(width / 2, height / 5, 'FLOW FACTORY', {
            fontSize: '72px',
            fontFamily: 'Arial, sans-serif',
            color: '#FFA500',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 5 + 60, 'Graph Theory Network Optimization', {
            fontSize: '20px',
            fontFamily: 'Arial, sans-serif',
            color: '#CCCCCC',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Divider line
        const divider = this.add.graphics();
        divider.lineStyle(2, 0x555555, 1);
        divider.beginPath();
        divider.moveTo(width / 2 - 200, height / 5 + 90);
        divider.lineTo(width / 2 + 200, height / 5 + 90);
        divider.strokePath();

        // Play Modes Section
        const modesStartY = height / 2 - 40;

        this.add.text(width / 2, modesStartY, 'SELECT PLAY MODE', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#888888',
            fontStyle: 'bold',
            letterSpacing: '2px'
        }).setOrigin(0.5);

        // Campaign Mode Button
        const campaignBtn = this.createGameButton(
            width / 2,
            modesStartY + 60,
            'CAMPAIGN MODE',
            'Complete objectives and unlock new tiers',
            '#FF6B35',
            () => {
                this.scene.start('WorkbenchScene', {
                    mode: 'CAMPAIGN',
                    levelData: {
                        id: 'level_01',
                        targetItem: 'Iron Plate',
                        targetRate: 20,
                        startingMoney: 500
                    }
                });
            }
        );

        // Sandbox Mode Button
        const sandboxBtn = this.createGameButton(
            width / 2,
            modesStartY + 160,
            'SANDBOX MODE',
            'Unlimited resources and creative freedom',
            '#4ECDC4',
            () => {
                this.scene.start('WorkbenchScene', {
                    mode: 'SANDBOX',
                    levelData: null
                });
            }
        );

        // Load Game Section
        const loadStartY = modesStartY + 280;

        const loadBtn = this.createSimpleButton(
            width / 2,
            loadStartY,
            'Load Saved Game',
            () => {
                console.log("Load Game clicked - Feature pending");
            }
        );

        // Version/Info Footer
        this.add.text(width / 2, height - 30, 'v0.1.0 - Flow Network Simulation Engine', {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#555555'
        }).setOrigin(0.5);
    }

    /**
     * Creates a styled game mode button with title and description
     */
    private createGameButton(
        x: number,
        y: number,
        title: string,
        description: string,
        accentColor: string,
        callback: () => void
    ) {
        const container = this.add.container(x, y);

        // Button background
        const bg = this.add.graphics();
        bg.fillStyle(0x222222, 1);
        bg.fillRoundedRect(-200, -35, 400, 70, 8);
        bg.lineStyle(2, parseInt(accentColor.replace('#', '0x')), 0.6);
        bg.strokeRoundedRect(-200, -35, 400, 70, 8);

        // Title text
        const titleText = this.add.text(0, -15, title, {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: accentColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Description text
        const descText = this.add.text(0, 12, description, {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        container.add([bg, titleText, descText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-200, -35, 400, 70);
        container.setSize(400, 70);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });

        // Hover effects
        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x333333, 1);
            bg.fillRoundedRect(-200, -35, 400, 70, 8);
            bg.lineStyle(3, parseInt(accentColor.replace('#', '0x')), 1);
            bg.strokeRoundedRect(-200, -35, 400, 70, 8);
            titleText.setColor('#ffffff');
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x222222, 1);
            bg.fillRoundedRect(-200, -35, 400, 70, 8);
            bg.lineStyle(2, parseInt(accentColor.replace('#', '0x')), 0.6);
            bg.strokeRoundedRect(-200, -35, 400, 70, 8);
            titleText.setColor(accentColor);
        });

        container.on('pointerdown', callback);

        return container;
    }

    /**
     * Creates a simple text button for secondary actions
     */
    private createSimpleButton(x: number, y: number, label: string, callback: () => void) {
        const button = this.add.text(x, y, label, {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#666666',
            backgroundColor: '#1a1a1a',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                button.setStyle({ color: '#CCCCCC', backgroundColor: '#2a2a2a' });
            })
            .on('pointerout', () => {
                button.setStyle({ color: '#666666', backgroundColor: '#1a1a1a' });
            })
            .on('pointerdown', callback);

        return button;
    }
}