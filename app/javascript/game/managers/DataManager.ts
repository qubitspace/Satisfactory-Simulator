import Phaser from "phaser";

// --- TYPES BASED ON YOUR JSON ---
export interface MachineDef {
    name: string;
    basePower: number;
    inputCount: number;
    outputCount: number;
}

export interface RecipeDef {
    name: string;
    machine: string;
    craftTime: number;
    inputs: { item: string, quantity: number }[];
    outputs: { item: string, quantity: number }[];
}

// --- GAME DATA MANAGER ---
export class DataManager {
    private static instance: DataManager;

    public machines: MachineDef[] = [];
    public recipes: RecipeDef[] = [];

    // A manual map to define how big machines are on the grid (Width x Height in tiles)
    public machineSizes: Record<string, { w: number, h: number }> = {
        "Smelter": { w: 2, h: 2 },
        "Constructor": { w: 2, h: 2 },
        "Assembler": { w: 3, h: 3 },
        "Foundry": { w: 3, h: 2 },
        "Refinery": { w: 3, h: 4 },
        "Manufacturer": { w: 4, h: 4 },
        "Nuclear Power Plant": { w: 5, h: 6 },
        // Defaults
        "Storage": { w: 1, h: 1 },
        "Sink": { w: 2, h: 2 },
        "Spawn": { w: 1, h: 1 },
    };

    private constructor() {}

    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    // Call this in your Preload scene
    public loadData(json: any) {
        this.machines = json.machines;
        this.recipes = json.recipes;
    }

    public getMachineSize(name: string) {
        return this.machineSizes[name] || { w: 2, h: 2 }; // Default 2x2
    }
}