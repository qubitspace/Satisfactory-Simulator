import {LogisticNode} from "../types";

export class LogisticSystem {
    private scene: Phaser.Scene;
    private nodes: LogisticNode[] = [];
    private gridSize = 64;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.setupInputHandlers();
    }

    public createSplitter(worldX: number, worldY: number): LogisticNode {
        const node: LogisticNode = {
            id: Date.now().toString(),
            type: 'splitter',
            x: Math.round(worldX / this.gridSize) * this.gridSize,
            y: Math.round(worldY / this.gridSize) * this.gridSize,
            rotation: 0,
            inputs: [
                {
                    id: 'input1',
                    type: 'input',
                    direction: 'north',
                    position: { x: 0, y: -this.gridSize/2 }
                }
            ],
            outputs: [
                {
                    id: 'output1',
                    type: 'output',
                    direction: 'south',
                    position: { x: -this.gridSize/2, y: this.gridSize/2 }
                },
                {
                    id: 'output2',
                    type: 'output',
                    direction: 'south',
                    position: { x: this.gridSize/2, y: this.gridSize/2 }
                }
            ]
        };

        this.nodes.push(node);
        this.createVisuals(node);
        return node;
    }

    // public createMerger(worldX: number, worldY: number): LogisticNode {
    //     // Similar to createSplitter but with reversed inputs/outputs
    //     // ...
    // }

    private createVisuals(node: LogisticNode): void {
        // Create visual representation using Phaser graphics
        const graphics = this.scene.add.graphics();

        // Draw base shape
        graphics.lineStyle(2, 0x666666);
        graphics.fillStyle(0x444444);
        graphics.fillRect(-this.gridSize/2, -this.gridSize/2, this.gridSize, this.gridSize);

        // Draw connection points
        node.inputs.forEach(input => {
            graphics.fillStyle(0x3333ff);
            graphics.fillRect(input.position.x - 4, input.position.y - 4, 8, 8);
        });

        node.outputs.forEach(output => {
            graphics.fillStyle(0xff3333);
            graphics.fillRect(output.position.x - 4, output.position.y - 4, 8, 8);
        });
    }

    private setupInputHandlers(): void {
        // Similar to FactorySystem input handlers for selection/dragging
        // ...
    }
}