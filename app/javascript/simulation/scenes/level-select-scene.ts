
interface Level {
    id: number;
    name: string;
    description: string;
    unlocked: boolean;
    stars: number;
}

export class LevelSelectScene extends Phaser.Scene {
    private levels: Level[] = [
        {
            id: 1,
            name: 'Basic Production',
            description: 'Create a simple iron plate production line',
            unlocked: true,
            stars: 0
        },
        { // TODO: Need to have production goal(s) associated with each level to know if it's complete
            id: 2,
            name: 'Screws & Rods',
            description: '',
            unlocked: false,
            stars: 0 // TODO: This should be per user, so it needs to be saved to the db or the localStorage once i have save/load working
        }
    ];

    constructor() {
        super({ key: 'level-select' });
    }

    create(): void {
        const centerX = this.cameras.main.centerX;

        this.add.text(centerX, 50, 'Select Level', {
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const backButton = this.add.text(100, 50, 'Back', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 15, y: 8 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('main-menu');
            });

        this.levels.forEach((level, index) => {
            const y = 150 + (index * 120);

            const container = this.add.container(centerX, y);

            const bg = this.add.rectangle(0, 0, 500, 100, 0x444444)
                .setInteractive()
                .on('pointerover', () => {
                    if (level.unlocked) bg.setFillStyle(0x666666);
                })
                .on('pointerout', () => {
                    if (level.unlocked) bg.setFillStyle(0x444444);
                })
                .on('pointerdown', () => {
                    if (level.unlocked) {
                        this.startLevel(level.id);
                    }
                });

            const nameText = this.add.text(-230, -20, level.name, {
                fontSize: '24px',
                color: level.unlocked ? '#ffffff' : '#666666'
            });

            const descText = this.add.text(-230, 10, level.description, {
                fontSize: '16px',
                color: level.unlocked ? '#cccccc' : '#666666'
            });

            container.add([bg, nameText, descText]);

            if (!level.unlocked) {
                const lockIcon = this.add.text(200, -10, '🔒', {
                    fontSize: '24px'
                });
                container.add(lockIcon);
            }
            else {
                const starsText = this.add.text(180, -10, '★'.repeat(level.stars) + '☆'.repeat(3 - level.stars), {
                    fontSize: '24px',
                    color: level.unlocked ? '#ffff00' : '#666666'
                });
                container.add([starsText]);
            }

        });
    }

    private startLevel(levelId: number): void {
        this.scene.start('game-scene', { mode: 'level', levelId });
    }
}