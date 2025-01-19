// types.ts
import {Transport} from "./systems/transport-system";

export interface ConnectionNode {
    id: string;
    type: 'input' | 'output';
    direction: 'north' | 'south' | 'east' | 'west';
    position: { x: number, y: number };
    transport?: Transport;
}

export interface LogisticNode {
    id: string;
    type: 'splitter' | 'merger';
    x: number;
    y: number;
    rotation: number;
    inputs: ConnectionNode[];
    outputs: ConnectionNode[];
    isSelected?: boolean;
}

export interface Machine {
    name: string;
    basePower: number;
    inputCount: number;
    outputCount: number;
    somersloopSlots: number;
    image?: string;
}

export interface Recipe {
    name: string;
    machine: string;
    craftTime: number;
    inputs: Array<{
        item: string;
        quantity: number;
    }>;
    outputs: Array<{
        item: string;
        quantity: number;
    }>;
}

export interface Item {
    name: string;
    transportType: 'belt' | 'pipe';
    image?: string;
}

// gameData.ts
class GameData {
    private static instance: GameData;
    private machines: Map<string, Machine>;
    private recipes: Map<string, Recipe>;
    private items: Map<string, Item>;
    private imageCache: Map<string, string>;

    private constructor() {
        this.machines = new Map();
        this.recipes = new Map();
        this.items = new Map();
        this.imageCache = new Map();
        this.initializeMachines();
        this.initializeRecipes();
        this.initializeItems();
    }

    public static getInstance(): GameData {
        if (!GameData.instance) {
            GameData.instance = new GameData();
        }
        return GameData.instance;
    }

    private initializeMachines(): void {
        const machineData = [
            {
                name: "Quantum Encoder",
                basePower: 2000.0,
                inputCount: 4,
                outputCount: 2,
                somersloopSlots: 1
            },
            {
                name: "Assembler",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Constructor",
                basePower: 10.0,
                inputCount: 1,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Manufacturer",
                basePower: 10.0,
                inputCount: 4,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Refinery",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 2,
                somersloopSlots: 1
            },
            {
                name: "Foundry",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Blender",
                basePower: 10.0,
                inputCount: 3,
                outputCount: 2,
                somersloopSlots: 1
            },
            {
                name: "Converter",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Smelter",
                basePower: 10.0,
                inputCount: 1,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Particle Accelerator",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Packager",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 1,
                somersloopSlots: 1
            },
            {
                name: "Nuclear Power Plant",
                basePower: 10.0,
                inputCount: 2,
                outputCount: 1,
                somersloopSlots: 1
            }
        ];

        machineData.forEach(machine => {
            this.machines.set(machine.name, machine);
        });
    }

    private initializeRecipes(): void {
        const recipeData: Recipe[] = [
            {
                name: "AI Expansion Server",
                machine: "Quantum Encoder",
                craftTime: 15,
                inputs: [
                    { item: "Magnetic Field Generator", quantity: 1.0 },
                    { item: "Neural-Quantum Processor", quantity: 1.0 },
                    { item: "Superposition Oscillator", quantity: 1.0 },
                    { item: "Excited Photonic Matter", quantity: 25.0 }
                ],
                outputs: [
                    { item: "AI Expansion Server", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 25.0 }
                ]
            },
            {
                name: "AI Limiter",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Copper Sheet", quantity: 5.0 },
                    { item: "Quickwire", quantity: 20.0 }
                ],
                outputs: [
                    { item: "AI Limiter", quantity: 1.0 }
                ]
            },
            {
                name: "Actual Snow FICSMAS",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "FICSMAS Gift", quantity: 5.0 }],
                outputs: [{ item: "Actual Snow", quantity: 2.0 }]
            },
            {
                name: "Adaptive Control Unit",
                machine: "Manufacturer",
                craftTime: 60,
                inputs: [
                    { item: "Automated Wiring", quantity: 5.0 },
                    { item: "Circuit Board", quantity: 5.0 },
                    { item: "Heavy Modular Frame", quantity: 1.0 },
                    { item: "Computer", quantity: 2.0 }
                ],
                outputs: [{ item: "Adaptive Control Unit", quantity: 1.0 }]
            },
            {
                name: "Alclad Aluminum Sheet",
                machine: "Assembler",
                craftTime: 6,
                inputs: [
                    { item: "Aluminum Ingot", quantity: 3.0 },
                    { item: "Copper Ingot", quantity: 1.0 }
                ],
                outputs: [{ item: "Alclad Aluminum Sheet", quantity: 3.0 }]
            },
            {
                name: "Alien DNA Capsule",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Alien Protein", quantity: 1.0 }],
                outputs: [{ item: "Alien DNA Capsule", quantity: 1.0 }]
            },
            {
                name: "Alien Power Matrix",
                machine: "Quantum Encoder",
                craftTime: 24,
                inputs: [
                    { item: "SAM Fluctuator", quantity: 5.0 },
                    { item: "Power Shard", quantity: 3.0 },
                    { item: "Superposition Oscillator", quantity: 3.0 },
                    { item: "Excited Photonic Matter", quantity: 24.0 }
                ],
                outputs: [
                    { item: "Alien Power Matrix", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 24.0 }
                ]
            },
            {
                name: "Alumina Solution",
                machine: "Refinery",
                craftTime: 6,
                inputs: [
                    { item: "Bauxite", quantity: 12.0 },
                    { item: "Water", quantity: 18.0 }
                ],
                outputs: [
                    { item: "Alumina Solution", quantity: 12.0 },
                    { item: "Silica", quantity: 5.0 }
                ]
            },
            {
                name: "Aluminum Casing",
                machine: "Constructor",
                craftTime: 2,
                inputs: [{ item: "Aluminum Ingot", quantity: 3.0 }],
                outputs: [{ item: "Aluminum Casing", quantity: 2.0 }]
            },
            {
                name: "Aluminum Ingot",
                machine: "Foundry",
                craftTime: 4,
                inputs: [
                    { item: "Aluminum Scrap", quantity: 6.0 },
                    { item: "Silica", quantity: 5.0 }
                ],
                outputs: [{ item: "Aluminum Ingot", quantity: 4.0 }]
            },
            {
                name: "Aluminum Scrap",
                machine: "Refinery",
                craftTime: 1,
                inputs: [
                    { item: "Alumina Solution", quantity: 4.0 },
                    { item: "Coal", quantity: 2.0 }
                ],
                outputs: [
                    { item: "Aluminum Scrap", quantity: 6.0 },
                    { item: "Water", quantity: 2.0 }
                ]
            },
            {
                name: "Assembly Director System",
                machine: "Assembler",
                craftTime: 80,
                inputs: [
                    { item: "Adaptive Control Unit", quantity: 2.0 },
                    { item: "Supercomputer", quantity: 1.0 }
                ],
                outputs: [{ item: "Assembly Director System", quantity: 1.0 }]
            },
            {
                name: "Automated Wiring",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Stator", quantity: 1.0 },
                    { item: "Cable", quantity: 20.0 }
                ],
                outputs: [{ item: "Automated Wiring", quantity: 1.0 }]
            },
            {
                name: "Ballistic Warp Drive",
                machine: "Manufacturer",
                craftTime: 60,
                inputs: [
                    { item: "Thermal Propulsion Rocket", quantity: 1.0 },
                    { item: "Singularity Cell", quantity: 5.0 },
                    { item: "Superposition Oscillator", quantity: 2.0 },
                    { item: "Dark Matter Crystal", quantity: 40.0 }
                ],
                outputs: [{ item: "Ballistic Warp Drive", quantity: 1.0 }]
            },
            {
                name: "Battery",
                machine: "Blender",
                craftTime: 3,
                inputs: [
                    { item: "Sulfuric Acid", quantity: 2.0 },
                    { item: "Alumina Solution", quantity: 2.0 },
                    { item: "Aluminum Casing", quantity: 1.0 }
                ],
                outputs: [
                    { item: "Battery", quantity: 1.0 },
                    { item: "Water", quantity: 1.0 }
                ]
            },
            {
                name: "Bauxite (Caterium)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Caterium Ore", quantity: 15.0 }
                ],
                outputs: [{ item: "Bauxite", quantity: 12.0 }]
            },
            {
                name: "Bauxite (Copper)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Copper Ore", quantity: 18.0 }
                ],
                outputs: [{ item: "Bauxite", quantity: 12.0 }]
            },
            {
                name: "Biochemical Sculptor",
                machine: "Blender",
                craftTime: 120,
                inputs: [
                    { item: "Assembly Director System", quantity: 1.0 },
                    { item: "Ficsite Trigon", quantity: 80.0 },
                    { item: "Water", quantity: 20.0 }
                ],
                outputs: [{ item: "Biochemical Sculptor", quantity: 4.0 }]
            },
            {
                name: "Biomass (Alien Protein)",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Alien Protein", quantity: 1.0 }],
                outputs: [{ item: "Biomass", quantity: 100.0 }]
            },
            {
                name: "Biomass (Leaves)",
                machine: "Constructor",
                craftTime: 5,
                inputs: [{ item: "Leaves", quantity: 10.0 }],
                outputs: [{ item: "Biomass", quantity: 5.0 }]
            },
            {
                name: "Biomass (Mycelia)",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Mycelia", quantity: 1.0 }],
                outputs: [{ item: "Biomass", quantity: 10.0 }]
            },
            {
                name: "Biomass (Wood)",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Wood", quantity: 4.0 }],
                outputs: [{ item: "Biomass", quantity: 20.0 }]
            },
            {
                name: "Black Powder",
                machine: "Assembler",
                craftTime: 4,
                inputs: [
                    { item: "Coal", quantity: 1.0 },
                    { item: "Sulfur", quantity: 1.0 }
                ],
                outputs: [{ item: "Black Powder", quantity: 2.0 }]
            },
            {
                name: "Blue FICSMAS Ornament FICSMAS",
                machine: "Smelter",
                craftTime: 12,
                inputs: [{ item: "FICSMAS Gift", quantity: 1.0 }],
                outputs: [{ item: "Blue FICSMAS Ornament", quantity: 2.0 }]
            },
            {
                name: "Cable",
                machine: "Constructor",
                craftTime: 2,
                inputs: [{ item: "Wire", quantity: 2.0 }],
                outputs: [{ item: "Cable", quantity: 1.0 }]
            },
            {
                name: "Candy Cane FICSMAS",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "FICSMAS Gift", quantity: 3.0 }],
                outputs: [{ item: "Candy Cane", quantity: 1.0 }]
            },
            {
                name: "Caterium Ingot",
                machine: "Smelter",
                craftTime: 4,
                inputs: [{ item: "Caterium Ore", quantity: 3.0 }],
                outputs: [{ item: "Caterium Ingot", quantity: 1.0 }]
            },
            {
                name: "Caterium Ore (Copper)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Copper Ore", quantity: 15.0 }
                ],
                outputs: [{ item: "Caterium Ore", quantity: 12.0 }]
            },
            {
                name: "Caterium Ore (Quartz)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Raw Quartz", quantity: 12.0 }
                ],
                outputs: [{ item: "Caterium Ore", quantity: 12.0 }]
            },
            {
                name: "Circuit Board",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Copper Sheet", quantity: 2.0 },
                    { item: "Plastic", quantity: 4.0 }
                ],
                outputs: [{ item: "Circuit Board", quantity: 1.0 }]
            },
            {
                name: "Cluster Nobelisk",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Nobelisk", quantity: 3.0 },
                    { item: "Smokeless Powder", quantity: 4.0 }
                ],
                outputs: [{ item: "Cluster Nobelisk", quantity: 1.0 }]
            },
            {
                name: "Coal (Iron)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Iron Ore", quantity: 18.0 }
                ],
                outputs: [{ item: "Coal", quantity: 12.0 }]
            },
            {
                name: "Coal (Limestone)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Limestone", quantity: 36.0 }
                ],
                outputs: [{ item: "Coal", quantity: 12.0 }]
            },
            {
                name: "Computer",
                machine: "Manufacturer",
                craftTime: 24,
                inputs: [
                    { item: "Circuit Board", quantity: 4.0 },
                    { item: "Cable", quantity: 8.0 },
                    { item: "Plastic", quantity: 16.0 }
                ],
                outputs: [{ item: "Computer", quantity: 1.0 }]
            },
            {
                name: "Concrete",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Limestone", quantity: 3.0 }],
                outputs: [{ item: "Concrete", quantity: 1.0 }]
            },
            {
                name: "Cooling System",
                machine: "Blender",
                craftTime: 10,
                inputs: [
                    { item: "Heat Sink", quantity: 2.0 },
                    { item: "Rubber", quantity: 2.0 },
                    { item: "Water", quantity: 5.0 },
                    { item: "Nitrogen Gas", quantity: 25.0 }
                ],
                outputs: [{ item: "Cooling System", quantity: 1.0 }]
            },
            {
                name: "Copper FICSMAS Ornament FICSMAS",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Red FICSMAS Ornament", quantity: 2.0 },
                    { item: "Copper Ingot", quantity: 2.0 }
                ],
                outputs: [{ item: "Copper FICSMAS Ornament", quantity: 1.0 }]
            },
            {
                name: "Copper Ingot",
                machine: "Smelter",
                craftTime: 2,
                inputs: [{ item: "Copper Ore", quantity: 1.0 }],
                outputs: [{ item: "Copper Ingot", quantity: 1.0 }]
            },
            {
                name: "Copper Ore (Quartz)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Raw Quartz", quantity: 10.0 }
                ],
                outputs: [{ item: "Copper Ore", quantity: 12.0 }]
            },
            {
                name: "Copper Ore (Sulfur)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Sulfur", quantity: 12.0 }
                ],
                outputs: [{ item: "Copper Ore", quantity: 12.0 }]
            },
            {
                name: "Copper Powder",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Copper Ingot", quantity: 30.0 }],
                outputs: [{ item: "Copper Powder", quantity: 5.0 }]
            },
            {
                name: "Copper Sheet",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Copper Ingot", quantity: 2.0 }],
                outputs: [{ item: "Copper Sheet", quantity: 1.0 }]
            },
            {
                name: "Crystal Oscillator",
                machine: "Manufacturer",
                craftTime: 120,
                inputs: [
                    { item: "Quartz Crystal", quantity: 36.0 },
                    { item: "Cable", quantity: 28.0 },
                    { item: "Reinforced Iron Plate", quantity: 5.0 }
                ],
                outputs: [{ item: "Crystal Oscillator", quantity: 2.0 }]
            },
            {
                name: "Dark Matter Crystal",
                machine: "Particle Accelerator",
                craftTime: 2,
                inputs: [
                    { item: "Diamonds", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 5.0 }
                ],
                outputs: [{ item: "Dark Matter Crystal", quantity: 1.0 }]
            },
            {
                name: "Dark Matter Residue",
                machine: "Converter",
                craftTime: 6,
                inputs: [{ item: "Reanimated SAM", quantity: 5.0 }],
                outputs: [{ item: "Dark Matter Residue", quantity: 10.0 }]
            },
            {
                name: "Diamonds",
                machine: "Particle Accelerator",
                craftTime: 2,
                inputs: [{ item: "Coal", quantity: 20.0 }],
                outputs: [{ item: "Diamonds", quantity: 1.0 }]
            },
            {
                name: "Electromagnetic Control Rod",
                machine: "Assembler",
                craftTime: 30,
                inputs: [
                    { item: "Stator", quantity: 3.0 },
                    { item: "AI Limiter", quantity: 2.0 }
                ],
                outputs: [{ item: "Electromagnetic Control Rod", quantity: 2.0 }]
            },
            {
                name: "Empty Canister",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Plastic", quantity: 2.0 }],
                outputs: [{ item: "Empty Canister", quantity: 4.0 }]
            },
            {
                name: "Empty Fluid Tank",
                machine: "Constructor",
                craftTime: 1,
                inputs: [{ item: "Aluminum Ingot", quantity: 1.0 }],
                outputs: [{ item: "Empty Fluid Tank", quantity: 1.0 }]
            },
            {
                name: "Encased Industrial Beam",
                machine: "Assembler",
                craftTime: 10,
                inputs: [
                    { item: "Steel Beam", quantity: 3.0 },
                    { item: "Concrete", quantity: 6.0 }
                ],
                outputs: [{ item: "Encased Industrial Beam", quantity: 1.0 }]
            },
            {
                name: "Encased Plutonium Cell",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Plutonium Pellet", quantity: 2.0 },
                    { item: "Concrete", quantity: 4.0 }
                ],
                outputs: [{ item: "Encased Plutonium Cell", quantity: 1.0 }]
            },
            {
                name: "Encased Uranium Cell",
                machine: "Blender",
                craftTime: 12,
                inputs: [
                    { item: "Uranium", quantity: 10.0 },
                    { item: "Concrete", quantity: 3.0 },
                    { item: "Sulfuric Acid", quantity: 8.0 }
                ],
                outputs: [
                    { item: "Encased Uranium Cell", quantity: 5.0 },
                    { item: "Sulfuric Acid", quantity: 2.0 }
                ]
            },
            {
                name: "Excited Photonic Matter",
                machine: "Converter",
                craftTime: 3,
                inputs: [],
                outputs: [{ item: "Excited Photonic Matter", quantity: 10.0 }]
            },
            {
                name: "Explosive Rebar",
                machine: "Manufacturer",
                craftTime: 12,
                inputs: [
                    { item: "Iron Rebar", quantity: 2.0 },
                    { item: "Smokeless Powder", quantity: 2.0 },
                    { item: "Steel Pipe", quantity: 2.0 }
                ],
                outputs: [{ item: "Explosive Rebar", quantity: 1.0 }]
            },
            {
                name: "FICSMAS Bow FICSMAS",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "FICSMAS Gift", quantity: 2.0 }],
                outputs: [{ item: "FICSMAS Bow", quantity: 1.0 }]
            },
            {
                name: "FICSMAS Decoration FICSMAS",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "FICSMAS Tree Branch", quantity: 15.0 },
                    { item: "FICSMAS Ornament Bundle", quantity: 6.0 }
                ],
                outputs: [{ item: "FICSMAS Decoration", quantity: 2.0 }]
            },
            {
                name: "FICSMAS Ornament Bundle FICSMAS",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Copper FICSMAS Ornament", quantity: 1.0 },
                    { item: "Iron FICSMAS Ornament", quantity: 1.0 }
                ],
                outputs: [{ item: "FICSMAS Ornament Bundle", quantity: 1.0 }]
            },
            {
                name: "FICSMAS Tree Branch FICSMAS",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "FICSMAS Gift", quantity: 1.0 }],
                outputs: [{ item: "FICSMAS Tree Branch", quantity: 1.0 }]
            },
            {
                name: "FICSMAS Wonder Star FICSMAS",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "FICSMAS Decoration", quantity: 5.0 },
                    { item: "Candy Cane", quantity: 20.0 }
                ],
                outputs: [{ item: "FICSMAS Wonder Star", quantity: 1.0 }]
            },
            {
                name: "Fabric",
                machine: "Assembler",
                craftTime: 4,
                inputs: [
                    { item: "Mycelia", quantity: 1.0 },
                    { item: "Biomass", quantity: 5.0 }
                ],
                outputs: [{ item: "Fabric", quantity: 1.0 }]
            },
            {
                name: "Fancy Fireworks",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "FICSMAS Tree Branch", quantity: 4.0 },
                    { item: "FICSMAS Bow", quantity: 3.0 }
                ],
                outputs: [{ item: "Fancy Fireworks", quantity: 1.0 }]
            },
            {
                name: "Ficsite Ingot (Aluminum)",
                machine: "Converter",
                craftTime: 2,
                inputs: [
                    { item: "Reanimated SAM", quantity: 2.0 },
                    { item: "Aluminum Ingot", quantity: 4.0 }
                ],
                outputs: [{ item: "Ficsite Ingot", quantity: 1.0 }]
            },
            {
                name: "Ficsite Ingot (Caterium)",
                machine: "Converter",
                craftTime: 4,
                inputs: [
                    { item: "Reanimated SAM", quantity: 3.0 },
                    { item: "Caterium Ingot", quantity: 4.0 }
                ],
                outputs: [{ item: "Ficsite Ingot", quantity: 1.0 }]
            },
            {
                name: "Ficsite Ingot (Iron)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 4.0 },
                    { item: "Iron Ingot", quantity: 24.0 }
                ],
                outputs: [{ item: "Ficsite Ingot", quantity: 1.0 }]
            },
            {
                name: "Ficsite Trigon",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Ficsite Ingot", quantity: 1.0 }],
                outputs: [{ item: "Ficsite Trigon", quantity: 3.0 }]
            },
            {
                name: "Ficsonium",
                machine: "Particle Accelerator",
                craftTime: 6,
                inputs: [
                    { item: "Plutonium Waste", quantity: 1.0 },
                    { item: "Singularity Cell", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 20.0 }
                ],
                outputs: [{ item: "Ficsonium", quantity: 1.0 }]
            },
            {
                name: "Ficsonium Fuel Rod",
                machine: "Quantum Encoder",
                craftTime: 24,
                inputs: [
                    { item: "Ficsonium", quantity: 2.0 },
                    { item: "Electromagnetic Control Rod", quantity: 2.0 },
                    { item: "Ficsite Trigon", quantity: 40.0 },
                    { item: "Excited Photonic Matter", quantity: 20.0 }
                ],
                outputs: [
                    { item: "Ficsonium Fuel Rod", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 20.0 }
                ]
            },
            {
                name: "Fuel",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Crude Oil", quantity: 6.0 }],
                outputs: [
                    { item: "Fuel", quantity: 4.0 },
                    { item: "Polymer Resin", quantity: 3.0 }
                ]
            },
            {
                name: "Fused Modular Frame",
                machine: "Blender",
                craftTime: 40,
                inputs: [
                    { item: "Heavy Modular Frame", quantity: 1.0 },
                    { item: "Aluminum Casing", quantity: 50.0 },
                    { item: "Nitrogen Gas", quantity: 25.0 }
                ],
                outputs: [{ item: "Fused Modular Frame", quantity: 1.0 }]
            },
            {
                name: "Gas Filter",
                machine: "Manufacturer",
                craftTime: 8,
                inputs: [
                    { item: "Fabric", quantity: 2.0 },
                    { item: "Coal", quantity: 4.0 },
                    { item: "Iron Plate", quantity: 2.0 }
                ],
                outputs: [{ item: "Gas Filter", quantity: 1.0 }]
            },
            {
                name: "Gas Nobelisk",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Nobelisk", quantity: 1.0 },
                    { item: "Biomass", quantity: 10.0 }
                ],
                outputs: [{ item: "Gas Nobelisk", quantity: 1.0 }]
            },
            {
                name: "Hatcher Protein",
                machine: "Constructor",
                craftTime: 3,
                inputs: [{ item: "Hatcher Remains", quantity: 1.0 }],
                outputs: [{ item: "Alien Protein", quantity: 1.0 }]
            },
            {
                name: "Heat Sink",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Alclad Aluminum Sheet", quantity: 5.0 },
                    { item: "Copper Sheet", quantity: 3.0 }
                ],
                outputs: [{ item: "Heat Sink", quantity: 1.0 }]
            },
            {
                name: "Heavy Modular Frame",
                machine: "Manufacturer",
                craftTime: 30,
                inputs: [
                    { item: "Modular Frame", quantity: 5.0 },
                    { item: "Steel Pipe", quantity: 20.0 },
                    { item: "Encased Industrial Beam", quantity: 5.0 },
                    { item: "Screw", quantity: 120.0 }
                ],
                outputs: [{ item: "Heavy Modular Frame", quantity: 1.0 }]
            },
            {
                name: "High-Speed Connector",
                machine: "Manufacturer",
                craftTime: 16,
                inputs: [
                    { item: "Quickwire", quantity: 56.0 },
                    { item: "Cable", quantity: 10.0 },
                    { item: "Circuit Board", quantity: 1.0 }
                ],
                outputs: [{ item: "High-Speed Connector", quantity: 1.0 }]
            },
            {
                name: "Hog Protein",
                machine: "Constructor",
                craftTime: 3,
                inputs: [{ item: "Hog Remains", quantity: 1.0 }],
                outputs: [{ item: "Alien Protein", quantity: 1.0 }]
            },
            {
                name: "Homing Rifle Ammo",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Rifle Ammo", quantity: 20.0 },
                    { item: "High-Speed Connector", quantity: 1.0 }
                ],
                outputs: [{ item: "Homing Rifle Ammo", quantity: 10.0 }]
            },
            {
                name: "Iodine-Infused Filter",
                machine: "Manufacturer",
                craftTime: 16,
                inputs: [
                    { item: "Gas Filter", quantity: 1.0 },
                    { item: "Quickwire", quantity: 8.0 },
                    { item: "Aluminum Casing", quantity: 1.0 }
                ],
                outputs: [{ item: "Iodine-Infused Filter", quantity: 1.0 }]
            },
            {
                name: "Ionized Fuel",
                machine: "Refinery",
                craftTime: 24,
                inputs: [
                    { item: "Rocket Fuel", quantity: 16.0 },
                    { item: "Power Shard", quantity: 1.0 }
                ],
                outputs: [
                    { item: "Ionized Fuel", quantity: 16.0 },
                    { item: "Compacted Coal", quantity: 2.0 }
                ]
            },
            {
                name: "Iron FICSMAS Ornament FICSMAS",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Blue FICSMAS Ornament", quantity: 3.0 },
                    { item: "Iron Ingot", quantity: 3.0 }
                ],
                outputs: [{ item: "Iron FICSMAS Ornament", quantity: 1.0 }]
            },
            {
                name: "Iron Ingot",
                machine: "Smelter",
                craftTime: 2,
                inputs: [{ item: "Iron Ore", quantity: 1.0 }],
                outputs: [{ item: "Iron Ingot", quantity: 1.0 }]
            },
            {
                name: "Iron Ore (Limestone)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Limestone", quantity: 24.0 }
                ],
                outputs: [{ item: "Iron Ore", quantity: 12.0 }]
            },
            {
                name: "Iron Plate",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Iron Ingot", quantity: 3.0 }],
                outputs: [{ item: "Iron Plate", quantity: 2.0 }]
            },
            {
                name: "Iron Rebar",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Iron Rod", quantity: 1.0 }],
                outputs: [{ item: "Iron Rebar", quantity: 1.0 }]
            },
            {
                name: "Iron Rod",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Iron Ingot", quantity: 1.0 }],
                outputs: [{ item: "Iron Rod", quantity: 1.0 }]
            },
            {
                name: "Limestone (Sulfur)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Sulfur", quantity: 2.0 }
                ],
                outputs: [{ item: "Limestone", quantity: 12.0 }]
            },
            {
                name: "Liquid Biofuel",
                machine: "Refinery",
                craftTime: 4,
                inputs: [
                    { item: "Solid Biofuel", quantity: 6.0 },
                    { item: "Water", quantity: 3.0 }
                ],
                outputs: [{ item: "Liquid Biofuel", quantity: 4.0 }]
            },
            {
                name: "Magnetic Field Generator",
                machine: "Assembler",
                craftTime: 120,
                inputs: [
                    { item: "Versatile Framework", quantity: 5.0 },
                    { item: "Electromagnetic Control Rod", quantity: 2.0 }
                ],
                outputs: [{ item: "Magnetic Field Generator", quantity: 2.0 }]
            },
            {
                name: "Modular Engine",
                machine: "Manufacturer",
                craftTime: 60,
                inputs: [
                    { item: "Motor", quantity: 2.0 },
                    { item: "Rubber", quantity: 15.0 },
                    { item: "Smart Plating", quantity: 2.0 }
                ],
                outputs: [{ item: "Modular Engine", quantity: 1.0 }]
            },
            {
                name: "Modular Frame",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "Reinforced Iron Plate", quantity: 3.0 },
                    { item: "Iron Rod", quantity: 12.0 }
                ],
                outputs: [{ item: "Modular Frame", quantity: 2.0 }]
            },
            {
                name: "Motor",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Rotor", quantity: 2.0 },
                    { item: "Stator", quantity: 2.0 }
                ],
                outputs: [{ item: "Motor", quantity: 1.0 }]
            },
            {
                name: "Neural-Quantum Processor",
                machine: "Quantum Encoder",
                craftTime: 20,
                inputs: [
                    { item: "Time Crystal", quantity: 5.0 },
                    { item: "Supercomputer", quantity: 1.0 },
                    { item: "Ficsite Trigon", quantity: 15.0 },
                    { item: "Excited Photonic Matter", quantity: 25.0 }
                ],
                outputs: [
                    { item: "Neural-Quantum Processor", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 25.0 }
                ]
            },
            {
                name: "Nitric Acid",
                machine: "Blender",
                craftTime: 6,
                inputs: [
                    { item: "Nitrogen Gas", quantity: 12.0 },
                    { item: "Water", quantity: 3.0 },
                    { item: "Iron Plate", quantity: 1.0 }
                ],
                outputs: [{ item: "Nitric Acid", quantity: 3.0 }]
            },
            {
                name: "Nitrogen Gas (Bauxite)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Bauxite", quantity: 10.0 }
                ],
                outputs: [{ item: "Nitrogen Gas", quantity: 12.0 }]
            },
            {
                name: "Nitrogen Gas (Caterium)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Caterium Ore", quantity: 12.0 }
                ],
                outputs: [{ item: "Nitrogen Gas", quantity: 12.0 }]
            },
            {
                name: "Nobelisk",
                machine: "Assembler",
                craftTime: 6,
                inputs: [
                    { item: "Black Powder", quantity: 2.0 },
                    { item: "Steel Pipe", quantity: 2.0 }
                ],
                outputs: [{ item: "Nobelisk", quantity: 1.0 }]
            },
            {
                name: "Non-Fissile Uranium",
                machine: "Blender",
                craftTime: 24,
                inputs: [
                    { item: "Uranium Waste", quantity: 15.0 },
                    { item: "Silica", quantity: 10.0 },
                    { item: "Nitric Acid", quantity: 6.0 },
                    { item: "Sulfuric Acid", quantity: 6.0 }
                ],
                outputs: [
                    { item: "Non-Fissile Uranium", quantity: 20.0 },
                    { item: "Water", quantity: 6.0 }
                ]
            },
            {
                name: "Nuclear Pasta",
                machine: "Particle Accelerator",
                craftTime: 120,
                inputs: [
                    { item: "Copper Powder", quantity: 200.0 },
                    { item: "Pressure Conversion Cube", quantity: 1.0 }
                ],
                outputs: [{ item: "Nuclear Pasta", quantity: 1.0 }]
            },
            {
                name: "Nuke Nobelisk",
                machine: "Manufacturer",
                craftTime: 120,
                inputs: [
                    { item: "Nobelisk", quantity: 5.0 },
                    { item: "Encased Uranium Cell", quantity: 20.0 },
                    { item: "Smokeless Powder", quantity: 10.0 },
                    { item: "AI Limiter", quantity: 6.0 }
                ],
                outputs: [{ item: "Nuke Nobelisk", quantity: 1.0 }]
            },
            {
                name: "Packaged Alumina Solution",
                machine: "Packager",
                craftTime: 1,
                inputs: [
                    { item: "Alumina Solution", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Alumina Solution", quantity: 2.0 }]
            },
            {
                name: "Packaged Fuel",
                machine: "Packager",
                craftTime: 3,
                inputs: [
                    { item: "Fuel", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Fuel", quantity: 2.0 }]
            },
            {
                name: "Packaged Heavy Oil Residue",
                machine: "Packager",
                craftTime: 4,
                inputs: [
                    { item: "Heavy Oil Residue", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Heavy Oil Residue", quantity: 2.0 }]
            },
            {
                name: "Packaged Ionized Fuel",
                machine: "Packager",
                craftTime: 3,
                inputs: [
                    { item: "Ionized Fuel", quantity: 4.0 },
                    { item: "Empty Fluid Tank", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Ionized Fuel", quantity: 2.0 }]
            },
            {
                name: "Packaged Liquid Biofuel",
                machine: "Packager",
                craftTime: 3,
                inputs: [
                    { item: "Liquid Biofuel", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Liquid Biofuel", quantity: 2.0 }]
            },
            {
                name: "Packaged Nitric Acid",
                machine: "Packager",
                craftTime: 2,
                inputs: [
                    { item: "Nitric Acid", quantity: 1.0 },
                    { item: "Empty Fluid Tank", quantity: 1.0 }
                ],
                outputs: [{ item: "Packaged Nitric Acid", quantity: 1.0 }]
            },
            {
                name: "Packaged Nitrogen Gas",
                machine: "Packager",
                craftTime: 1,
                inputs: [
                    { item: "Nitrogen Gas", quantity: 4.0 },
                    { item: "Empty Fluid Tank", quantity: 1.0 }
                ],
                outputs: [{ item: "Packaged Nitrogen Gas", quantity: 1.0 }]
            },
            {
                name: "Packaged Oil",
                machine: "Packager",
                craftTime: 4,
                inputs: [
                    { item: "Crude Oil", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Oil", quantity: 2.0 }]
            },
            {
                name: "Packaged Rocket Fuel",
                machine: "Packager",
                craftTime: 1,
                inputs: [
                    { item: "Rocket Fuel", quantity: 2.0 },
                    { item: "Empty Fluid Tank", quantity: 1.0 }
                ],
                outputs: [{ item: "Packaged Rocket Fuel", quantity: 1.0 }]
            },
            {
                name: "Packaged Sulfuric Acid",
                machine: "Packager",
                craftTime: 3,
                inputs: [
                    { item: "Sulfuric Acid", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Sulfuric Acid", quantity: 2.0 }]
            },
            {
                name: "Packaged Turbofuel",
                machine: "Packager",
                craftTime: 6,
                inputs: [
                    { item: "Turbofuel", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Turbofuel", quantity: 2.0 }]
            },
            {
                name: "Packaged Water",
                machine: "Packager",
                craftTime: 2,
                inputs: [
                    { item: "Water", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Water", quantity: 2.0 }]
            },
            {
                name: "Petroleum Coke",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Heavy Oil Residue", quantity: 4.0 }],
                outputs: [{ item: "Petroleum Coke", quantity: 12.0 }]
            },
            {
                name: "Plastic",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Crude Oil", quantity: 3.0 }],
                outputs: [
                    { item: "Plastic", quantity: 2.0 },
                    { item: "Heavy Oil Residue", quantity: 1.0 }
                ]
            },
            {
                name: "Plutonium Fuel Rod",
                machine: "Manufacturer",
                craftTime: 240,
                inputs: [
                    { item: "Encased Plutonium Cell", quantity: 30.0 },
                    { item: "Steel Beam", quantity: 18.0 },
                    { item: "Electromagnetic Control Rod", quantity: 6.0 },
                    { item: "Heat Sink", quantity: 10.0 }
                ],
                outputs: [{ item: "Plutonium Fuel Rod", quantity: 1.0 }]
            },
            {
                name: "Plutonium Fuel Rod (burning)",
                machine: "Nuclear Power Plant",
                craftTime: 600,
                inputs: [
                    { item: "Plutonium Fuel Rod", quantity: 1.0 },
                    { item: "Water", quantity: 2.0 }
                ],
                outputs: [{ item: "Plutonium Waste", quantity: 10.0 }]
            },
            {
                name: "Plutonium Pellet",
                machine: "Particle Accelerator",
                craftTime: 60,
                inputs: [
                    { item: "Non-Fissile Uranium", quantity: 100.0 },
                    { item: "Uranium Waste", quantity: 25.0 }
                ],
                outputs: [{ item: "Plutonium Pellet", quantity: 30.0 }]
            },
            {
                name: "Power Shard (1)",
                machine: "Constructor",
                craftTime: 8,
                inputs: [{ item: "Blue Power Slug", quantity: 1.0 }],
                outputs: [{ item: "Power Shard", quantity: 1.0 }]
            },
            {
                name: "Power Shard (2)",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "Yellow Power Slug", quantity: 1.0 }],
                outputs: [{ item: "Power Shard", quantity: 2.0 }]
            },
            {
                name: "Power Shard (5)",
                machine: "Constructor",
                craftTime: 24,
                inputs: [{ item: "Purple Power Slug", quantity: 1.0 }],
                outputs: [{ item: "Power Shard", quantity: 5.0 }]
            },
            {
                name: "Pressure Conversion Cube",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "Fused Modular Frame", quantity: 1.0 },
                    { item: "Radio Control Unit", quantity: 2.0 }
                ],
                outputs: [{ item: "Pressure Conversion Cube", quantity: 1.0 }]
            },
            {
                name: "Pulse Nobelisk",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "Nobelisk", quantity: 5.0 },
                    { item: "Crystal Oscillator", quantity: 1.0 }
                ],
                outputs: [{ item: "Pulse Nobelisk", quantity: 5.0 }]
            },
            {
                name: "Quartz Crystal",
                machine: "Constructor",
                craftTime: 8,
                inputs: [{ item: "Raw Quartz", quantity: 5.0 }],
                outputs: [{ item: "Quartz Crystal", quantity: 3.0 }]
            },
            {
                name: "Quickwire",
                machine: "Constructor",
                craftTime: 5,
                inputs: [{ item: "Caterium Ingot", quantity: 1.0 }],
                outputs: [{ item: "Quickwire", quantity: 5.0 }]
            },
            {
                name: "Radio Control Unit",
                machine: "Manufacturer",
                craftTime: 48,
                inputs: [
                    { item: "Aluminum Casing", quantity: 32.0 },
                    { item: "Crystal Oscillator", quantity: 1.0 },
                    { item: "Computer", quantity: 2.0 }
                ],
                outputs: [{ item: "Radio Control Unit", quantity: 2.0 }]
            },
            {
                name: "Raw Quartz (Bauxite)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Bauxite", quantity: 10.0 }
                ],
                outputs: [{ item: "Raw Quartz", quantity: 12.0 }]
            },
            {
                name: "Raw Quartz (Coal)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Coal", quantity: 24.0 }
                ],
                outputs: [{ item: "Raw Quartz", quantity: 12.0 }]
            },
            {
                name: "Reanimated SAM",
                machine: "Constructor",
                craftTime: 2,
                inputs: [{ item: "SAM", quantity: 4.0 }],
                outputs: [{ item: "Reanimated SAM", quantity: 1.0 }]
            },
            {
                name: "Red FICSMAS Ornament FICSMAS",
                machine: "Smelter",
                craftTime: 12,
                inputs: [{ item: "FICSMAS Gift", quantity: 1.0 }],
                outputs: [{ item: "Red FICSMAS Ornament", quantity: 1.0 }]
            },
            {
                name: "Reinforced Iron Plate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Iron Plate", quantity: 6.0 },
                    { item: "Screw", quantity: 12.0 }
                ],
                outputs: [{ item: "Reinforced Iron Plate", quantity: 1.0 }]
            },
            {
                name: "Residual Fuel",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Heavy Oil Residue", quantity: 6.0 }],
                outputs: [{ item: "Fuel", quantity: 4.0 }]
            },
            {
                name: "Residual Plastic",
                machine: "Refinery",
                craftTime: 6,
                inputs: [
                    { item: "Polymer Resin", quantity: 6.0 },
                    { item: "Water", quantity: 2.0 }
                ],
                outputs: [{ item: "Plastic", quantity: 2.0 }]
            },
            {
                name: "Residual Rubber",
                machine: "Refinery",
                craftTime: 6,
                inputs: [
                    { item: "Polymer Resin", quantity: 4.0 },
                    { item: "Water", quantity: 4.0 }
                ],
                outputs: [{ item: "Rubber", quantity: 2.0 }]
            },
            {
                name: "Rifle Ammo",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Copper Sheet", quantity: 3.0 },
                    { item: "Smokeless Powder", quantity: 2.0 }
                ],
                outputs: [{ item: "Rifle Ammo", quantity: 15.0 }]
            },
            {
                name: "Rocket Fuel",
                machine: "Blender",
                craftTime: 6,
                inputs: [
                    { item: "Turbofuel", quantity: 6.0 },
                    { item: "Nitric Acid", quantity: 1.0 }
                ],
                outputs: [
                    { item: "Rocket Fuel", quantity: 10.0 },
                    { item: "Compacted Coal", quantity: 1.0 }
                ]
            },
            {
                name: "Rotor",
                machine: "Assembler",
                craftTime: 15,
                inputs: [
                    { item: "Iron Rod", quantity: 5.0 },
                    { item: "Screw", quantity: 25.0 }
                ],
                outputs: [{ item: "Rotor", quantity: 1.0 }]
            },
            {
                name: "Rubber",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Crude Oil", quantity: 3.0 }],
                outputs: [
                    { item: "Rubber", quantity: 2.0 },
                    { item: "Heavy Oil Residue", quantity: 2.0 }
                ]
            },
            {
                name: "SAM Fluctuator",
                machine: "Manufacturer",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 6.0 },
                    { item: "Wire", quantity: 5.0 },
                    { item: "Steel Pipe", quantity: 3.0 }
                ],
                outputs: [{ item: "SAM Fluctuator", quantity: 1.0 }]
            },
            {
                name: "Screw",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Iron Rod", quantity: 1.0 }],
                outputs: [{ item: "Screw", quantity: 4.0 }]
            },
            {
                name: "Shatter Rebar",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Iron Rebar", quantity: 2.0 },
                    { item: "Quartz Crystal", quantity: 3.0 }
                ],
                outputs: [{ item: "Shatter Rebar", quantity: 1.0 }]
            },
            {
                name: "Silica",
                machine: "Constructor",
                craftTime: 8,
                inputs: [{ item: "Raw Quartz", quantity: 3.0 }],
                outputs: [{ item: "Silica", quantity: 5.0 }]
            },
            {
                name: "Singularity Cell",
                machine: "Manufacturer",
                craftTime: 60,
                inputs: [
                    { item: "Nuclear Pasta", quantity: 1.0 },
                    { item: "Dark Matter Crystal", quantity: 20.0 },
                    { item: "Iron Plate", quantity: 100.0 },
                    { item: "Concrete", quantity: 200.0 }
                ],
                outputs: [{ item: "Singularity Cell", quantity: 10.0 }]
            },
            {
                name: "Smart Plating",
                machine: "Assembler",
                craftTime: 30,
                inputs: [
                    { item: "Reinforced Iron Plate", quantity: 1.0 },
                    { item: "Rotor", quantity: 1.0 }
                ],
                outputs: [{ item: "Smart Plating", quantity: 1.0 }]
            },
            {
                name: "Smokeless Powder",
                machine: "Refinery",
                craftTime: 6,
                inputs: [
                    { item: "Black Powder", quantity: 2.0 },
                    { item: "Heavy Oil Residue", quantity: 1.0 }
                ],
                outputs: [{ item: "Smokeless Powder", quantity: 2.0 }]
            },
            {
                name: "Snowball FICSMAS",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "Actual Snow", quantity: 3.0 }],
                outputs: [{ item: "Snowball", quantity: 1.0 }]
            },
            {
                name: "Solid Biofuel",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Biomass", quantity: 8.0 }],
                outputs: [{ item: "Solid Biofuel", quantity: 4.0 }]
            },
            {
                name: "Sparkly Fireworks",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "FICSMAS Tree Branch", quantity: 3.0 },
                    { item: "Actual Snow", quantity: 2.0 }
                ],
                outputs: [{ item: "Sparkly Fireworks", quantity: 1.0 }]
            },
            {
                name: "Spitter Protein",
                machine: "Constructor",
                craftTime: 3,
                inputs: [{ item: "Spitter Remains", quantity: 1.0 }],
                outputs: [{ item: "Alien Protein", quantity: 1.0 }]
            },
            {
                name: "Stator",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Steel Pipe", quantity: 3.0 },
                    { item: "Wire", quantity: 8.0 }
                ],
                outputs: [{ item: "Stator", quantity: 1.0 }]
            },
            {
                name: "Steel Beam",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Steel Ingot", quantity: 4.0 }],
                outputs: [{ item: "Steel Beam", quantity: 1.0 }]
            },
            {
                name: "Steel Ingot",
                machine: "Foundry",
                craftTime: 4,
                inputs: [
                    { item: "Iron Ore", quantity: 3.0 },
                    { item: "Coal", quantity: 3.0 }
                ],
                outputs: [{ item: "Steel Ingot", quantity: 3.0 }]
            },
            {
                name: "Steel Pipe",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Steel Ingot", quantity: 3.0 }],
                outputs: [{ item: "Steel Pipe", quantity: 2.0 }]
            },
            {
                name: "Stinger Protein",
                machine: "Constructor",
                craftTime: 3,
                inputs: [{ item: "Stinger Remains", quantity: 1.0 }],
                outputs: [{ item: "Alien Protein", quantity: 1.0 }]
            },
            {
                name: "Stun Rebar",
                machine: "Assembler",
                craftTime: 6,
                inputs: [
                    { item: "Iron Rebar", quantity: 1.0 },
                    { item: "Quickwire", quantity: 5.0 }
                ],
                outputs: [{ item: "Stun Rebar", quantity: 1.0 }]
            },
            {
                name: "Sulfur (Coal)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Coal", quantity: 20.0 }
                ],
                outputs: [{ item: "Sulfur", quantity: 12.0 }]
            },
            {
                name: "Sulfur (Iron)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Iron Ore", quantity: 30.0 }
                ],
                outputs: [{ item: "Sulfur", quantity: 12.0 }]
            },
            {
                name: "Sulfuric Acid",
                machine: "Refinery",
                craftTime: 6,
                inputs: [
                    { item: "Sulfur", quantity: 5.0 },
                    { item: "Water", quantity: 5.0 }
                ],
                outputs: [{ item: "Sulfuric Acid", quantity: 5.0 }]
            },
            {
                name: "Supercomputer",
                machine: "Manufacturer",
                craftTime: 32,
                inputs: [
                    { item: "Computer", quantity: 4.0 },
                    { item: "AI Limiter", quantity: 2.0 },
                    { item: "High-Speed Connector", quantity: 3.0 },
                    { item: "Plastic", quantity: 28.0 }
                ],
                outputs: [{ item: "Supercomputer", quantity: 1.0 }]
            },
            {
                name: "Superposition Oscillator",
                machine: "Quantum Encoder",
                craftTime: 12,
                inputs: [
                    { item: "Dark Matter Crystal", quantity: 6.0 },
                    { item: "Crystal Oscillator", quantity: 1.0 },
                    { item: "Alclad Aluminum Sheet", quantity: 9.0 },
                    { item: "Excited Photonic Matter", quantity: 25.0 }
                ],
                outputs: [
                    { item: "Superposition Oscillator", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 25.0 }
                ]
            },
            {
                name: "Sweet Fireworks",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "FICSMAS Tree Branch", quantity: 6.0 },
                    { item: "Candy Cane", quantity: 3.0 }
                ],
                outputs: [{ item: "Sweet Fireworks", quantity: 1.0 }]
            },
            {
                name: "Synthetic Power Shard",
                machine: "Quantum Encoder",
                craftTime: 12,
                inputs: [
                    { item: "Time Crystal", quantity: 2.0 },
                    { item: "Dark Matter Crystal", quantity: 2.0 },
                    { item: "Quartz Crystal", quantity: 12.0 },
                    { item: "Excited Photonic Matter", quantity: 12.0 }
                ],
                outputs: [
                    { item: "Power Shard", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 12.0 }
                ]
            },
            {
                name: "Thermal Propulsion Rocket",
                machine: "Manufacturer",
                craftTime: 120,
                inputs: [
                    { item: "Modular Engine", quantity: 5.0 },
                    { item: "Turbo Motor", quantity: 2.0 },
                    { item: "Cooling System", quantity: 6.0 },
                    { item: "Fused Modular Frame", quantity: 2.0 }
                ],
                outputs: [{ item: "Thermal Propulsion Rocket", quantity: 2.0 }]
            },
            {
                name: "Time Crystal",
                machine: "Converter",
                craftTime: 10,
                inputs: [{ item: "Diamonds", quantity: 2.0 }],
                outputs: [{ item: "Time Crystal", quantity: 1.0 }]
            },
            {
                name: "Turbo Motor",
                machine: "Manufacturer",
                craftTime: 32,
                inputs: [
                    { item: "Cooling System", quantity: 4.0 },
                    { item: "Radio Control Unit", quantity: 2.0 },
                    { item: "Motor", quantity: 4.0 },
                    { item: "Rubber", quantity: 24.0 }
                ],
                outputs: [{ item: "Turbo Motor", quantity: 1.0 }]
            },
            {
                name: "Turbo Rifle Ammo",
                machine: "Manufacturer",
                craftTime: 12,
                inputs: [
                    { item: "Rifle Ammo", quantity: 25.0 },
                    { item: "Aluminum Casing", quantity: 3.0 },
                    { item: "Packaged Turbofuel", quantity: 3.0 }
                ],
                outputs: [{ item: "Turbo Rifle Ammo", quantity: 50.0 }]
            },
            {
                name: "Unpackage Alumina Solution",
                machine: "Packager",
                craftTime: 1,
                inputs: [{ item: "Packaged Alumina Solution", quantity: 2.0 }],
                outputs: [
                    { item: "Alumina Solution", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Fuel",
                machine: "Packager",
                craftTime: 2,
                inputs: [{ item: "Packaged Fuel", quantity: 2.0 }],
                outputs: [
                    { item: "Fuel", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Heavy Oil Residue",
                machine: "Packager",
                craftTime: 6,
                inputs: [{ item: "Packaged Heavy Oil Residue", quantity: 2.0 }],
                outputs: [
                    { item: "Heavy Oil Residue", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Ionized Fuel",
                machine: "Packager",
                craftTime: 3,
                inputs: [{ item: "Packaged Ionized Fuel", quantity: 2.0 }],
                outputs: [
                    { item: "Ionized Fuel", quantity: 4.0 },
                    { item: "Empty Fluid Tank", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Liquid Biofuel",
                machine: "Packager",
                craftTime: 2,
                inputs: [{ item: "Packaged Liquid Biofuel", quantity: 2.0 }],
                outputs: [
                    { item: "Liquid Biofuel", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Nitric Acid",
                machine: "Packager",
                craftTime: 3,
                inputs: [{ item: "Packaged Nitric Acid", quantity: 1.0 }],
                outputs: [
                    { item: "Nitric Acid", quantity: 1.0 },
                    { item: "Empty Fluid Tank", quantity: 1.0 }
                ]
            },
            {
                name: "Unpackage Nitrogen Gas",
                machine: "Packager",
                craftTime: 1,
                inputs: [{ item: "Packaged Nitrogen Gas", quantity: 1.0 }],
                outputs: [
                    { item: "Nitrogen Gas", quantity: 4.0 },
                    { item: "Empty Fluid Tank", quantity: 1.0 }
                ]
            },
            {
                name: "Unpackage Oil",
                machine: "Packager",
                craftTime: 2,
                inputs: [{ item: "Packaged Oil", quantity: 2.0 }],
                outputs: [
                    { item: "Crude Oil", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Rocket Fuel",
                machine: "Packager",
                craftTime: 1,
                inputs: [{ item: "Packaged Rocket Fuel", quantity: 1.0 }],
                outputs: [
                    { item: "Rocket Fuel", quantity: 2.0 },
                    { item: "Empty Fluid Tank", quantity: 1.0 }
                ]
            },
            {
                name: "Unpackage Sulfuric Acid",
                machine: "Packager",
                craftTime: 1,
                inputs: [{ item: "Packaged Sulfuric Acid", quantity: 1.0 }],
                outputs: [
                    { item: "Sulfuric Acid", quantity: 1.0 },
                    { item: "Empty Canister", quantity: 1.0 }
                ]
            },
            {
                name: "Unpackage Turbofuel",
                machine: "Packager",
                craftTime: 6,
                inputs: [{ item: "Packaged Turbofuel", quantity: 2.0 }],
                outputs: [
                    { item: "Turbofuel", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Unpackage Water",
                machine: "Packager",
                craftTime: 1,
                inputs: [{ item: "Packaged Water", quantity: 2.0 }],
                outputs: [
                    { item: "Water", quantity: 2.0 },
                    { item: "Empty Canister", quantity: 2.0 }
                ]
            },
            {
                name: "Uranium Fuel Rod",
                machine: "Manufacturer",
                craftTime: 150,
                inputs: [
                    { item: "Encased Uranium Cell", quantity: 50.0 },
                    { item: "Encased Industrial Beam", quantity: 3.0 },
                    { item: "Electromagnetic Control Rod", quantity: 5.0 }
                ],
                outputs: [{ item: "Uranium Fuel Rod", quantity: 1.0 }]
            },
            {
                name: "Uranium Fuel Rod (burning)",
                machine: "Nuclear Power Plant",
                craftTime: 300,
                inputs: [
                    { item: "Uranium Fuel Rod", quantity: 1.0 },
                    { item: "Water", quantity: 1.0 }
                ],
                outputs: [{ item: "Uranium Waste", quantity: 50.0 }]
            },
            {
                name: "Uranium Ore (Bauxite)",
                machine: "Converter",
                craftTime: 6,
                inputs: [
                    { item: "Reanimated SAM", quantity: 1.0 },
                    { item: "Bauxite", quantity: 48.0 }
                ],
                outputs: [{ item: "Uranium", quantity: 12.0 }]
            },
            {
                name: "Versatile Framework",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Modular Frame", quantity: 1.0 },
                    { item: "Steel Beam", quantity: 12.0 }
                ],
                outputs: [{ item: "Versatile Framework", quantity: 2.0 }]
            },
            {
                name: "Wire",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Copper Ingot", quantity: 1.0 }],
                outputs: [{ item: "Wire", quantity: 2.0 }]
            },
            {
                name: "Adhered Iron Plate - Alternate",
                machine: "Assembler",
                craftTime: 16,
                inputs: [
                    { item: "Iron Plate", quantity: 3.0 },
                    { item: "Rubber", quantity: 1.0 }
                ],
                outputs: [{ item: "Reinforced Iron Plate", quantity: 1.0 }]
            },
            {
                name: "Alclad Casing - Alternate",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Aluminum Ingot", quantity: 20.0 },
                    { item: "Copper Ingot", quantity: 10.0 }
                ],
                outputs: [{ item: "Aluminum Casing", quantity: 15.0 }]
            },
            {
                name: "Aluminum Beam - Alternate",
                machine: "Constructor",
                craftTime: 8,
                inputs: [{ item: "Aluminum Ingot", quantity: 3.0 }],
                outputs: [{ item: "Steel Beam", quantity: 3.0 }]
            },
            {
                name: "Aluminum Rod - Alternate",
                machine: "Constructor",
                craftTime: 8,
                inputs: [{ item: "Aluminum Ingot", quantity: 1.0 }],
                outputs: [{ item: "Iron Rod", quantity: 7.0 }]
            },
            {
                name: "Automated Miner - Alternate",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "Steel Pipe", quantity: 4.0 },
                    { item: "Iron Plate", quantity: 4.0 }
                ],
                outputs: [{ item: "Portable Miner", quantity: 1.0 }]
            },
            {
                name: "Automated Speed Wiring - Alternate",
                machine: "Manufacturer",
                craftTime: 32,
                inputs: [
                    { item: "Stator", quantity: 2.0 },
                    { item: "Wire", quantity: 40.0 },
                    { item: "High-Speed Connector", quantity: 1.0 }
                ],
                outputs: [{ item: "Automated Wiring", quantity: 4.0 }]
            },
            {
                name: "Basic Iron Ingot - Alternate",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Iron Ore", quantity: 5.0 },
                    { item: "Limestone", quantity: 8.0 }
                ],
                outputs: [{ item: "Iron Ingot", quantity: 10.0 }]
            },
            {
                name: "Biocoal - Alternate",
                machine: "Constructor",
                craftTime: 8,
                inputs: [{ item: "Biomass", quantity: 5.0 }],
                outputs: [{ item: "Coal", quantity: 6.0 }]
            },
            {
                name: "Bolted Frame - Alternate",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Reinforced Iron Plate", quantity: 3.0 },
                    { item: "Screw", quantity: 56.0 }
                ],
                outputs: [{ item: "Modular Frame", quantity: 2.0 }]
            },
            {
                name: "Bolted Iron Plate - Alternate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Iron Plate", quantity: 18.0 },
                    { item: "Screw", quantity: 50.0 }
                ],
                outputs: [{ item: "Reinforced Iron Plate", quantity: 3.0 }]
            },
            {
                name: "Cast Screw - Alternate",
                machine: "Constructor",
                craftTime: 24,
                inputs: [{ item: "Iron Ingot", quantity: 5.0 }],
                outputs: [{ item: "Screw", quantity: 20.0 }]
            },
            {
                name: "Caterium Circuit Board - Alternate",
                machine: "Assembler",
                craftTime: 48,
                inputs: [
                    { item: "Plastic", quantity: 10.0 },
                    { item: "Quickwire", quantity: 30.0 }
                ],
                outputs: [{ item: "Circuit Board", quantity: 7.0 }]
            },
            {
                name: "Caterium Computer - Alternate",
                machine: "Manufacturer",
                craftTime: 16,
                inputs: [
                    { item: "Circuit Board", quantity: 4.0 },
                    { item: "Quickwire", quantity: 14.0 },
                    { item: "Rubber", quantity: 6.0 }
                ],
                outputs: [{ item: "Computer", quantity: 1.0 }]
            },
            {
                name: "Caterium Wire - Alternate",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Caterium Ingot", quantity: 1.0 }],
                outputs: [{ item: "Wire", quantity: 8.0 }]
            },
            {
                name: "Charcoal - Alternate",
                machine: "Constructor",
                craftTime: 4,
                inputs: [{ item: "Wood", quantity: 1.0 }],
                outputs: [{ item: "Coal", quantity: 10.0 }]
            },
            {
                name: "Cheap Silica - Alternate",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Raw Quartz", quantity: 3.0 },
                    { item: "Limestone", quantity: 5.0 }
                ],
                outputs: [{ item: "Silica", quantity: 7.0 }]
            },
            {
                name: "Classic Battery - Alternate",
                machine: "Manufacturer",
                craftTime: 8,
                inputs: [
                    { item: "Sulfur", quantity: 6.0 },
                    { item: "Alclad Aluminum Sheet", quantity: 7.0 },
                    { item: "Plastic", quantity: 8.0 },
                    { item: "Wire", quantity: 12.0 }
                ],
                outputs: [{ item: "Battery", quantity: 4.0 }]
            },
            {
                name: "Cloudy Diamonds - Alternate",
                machine: "Particle Accelerator",
                craftTime: 3,
                inputs: [
                    { item: "Coal", quantity: 12.0 },
                    { item: "Limestone", quantity: 24.0 }
                ],
                outputs: [{ item: "Diamonds", quantity: 1.0 }]
            },
            {
                name: "Coated Cable - Alternate",
                machine: "Refinery",
                craftTime: 8,
                inputs: [
                    { item: "Wire", quantity: 5.0 },
                    { item: "Heavy Oil Residue", quantity: 2.0 }
                ],
                outputs: [{ item: "Cable", quantity: 9.0 }]
            },
            {
                name: "Coated Iron Canister - Alternate",
                machine: "Assembler",
                craftTime: 4,
                inputs: [
                    { item: "Iron Plate", quantity: 2.0 },
                    { item: "Copper Sheet", quantity: 1.0 }
                ],
                outputs: [{ item: "Empty Canister", quantity: 4.0 }]
            },
            {
                name: "Coated Iron Plate - Alternate",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Iron Ingot", quantity: 5.0 },
                    { item: "Plastic", quantity: 1.0 }
                ],
                outputs: [{ item: "Iron Plate", quantity: 10.0 }]
            },
            {
                name: "Coke Steel Ingot - Alternate",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Iron Ore", quantity: 15.0 },
                    { item: "Petroleum Coke", quantity: 15.0 }
                ],
                outputs: [{ item: "Steel Ingot", quantity: 20.0 }]
            },
            {
                name: "Compacted Coal - Alternate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Coal", quantity: 5.0 },
                    { item: "Sulfur", quantity: 5.0 }
                ],
                outputs: [{ item: "Compacted Coal", quantity: 5.0 }]
            },
            {
                name: "Compacted Steel Ingot - Alternate",
                machine: "Foundry",
                craftTime: 24,
                inputs: [
                    { item: "Iron Ore", quantity: 2.0 },
                    { item: "Compacted Coal", quantity: 1.0 }
                ],
                outputs: [{ item: "Steel Ingot", quantity: 4.0 }]
            },
            {
                name: "Cooling Device - Alternate",
                machine: "Blender",
                craftTime: 24,
                inputs: [
                    { item: "Heat Sink", quantity: 4.0 },
                    { item: "Motor", quantity: 1.0 },
                    { item: "Nitrogen Gas", quantity: 24.0 }
                ],
                outputs: [{ item: "Cooling System", quantity: 2.0 }]
            },
            {
                name: "Copper Alloy Ingot - Alternate",
                machine: "Foundry",
                craftTime: 6,
                inputs: [
                    { item: "Copper Ore", quantity: 5.0 },
                    { item: "Iron Ore", quantity: 5.0 }
                ],
                outputs: [{ item: "Copper Ingot", quantity: 10.0 }]
            },
            {
                name: "Copper Rotor - Alternate",
                machine: "Assembler",
                craftTime: 16,
                inputs: [
                    { item: "Copper Sheet", quantity: 6.0 },
                    { item: "Screw", quantity: 52.0 }
                ],
                outputs: [{ item: "Rotor", quantity: 3.0 }]
            },
            {
                name: "Crystal Computer - Alternate",
                machine: "Assembler",
                craftTime: 36,
                inputs: [
                    { item: "Circuit Board", quantity: 3.0 },
                    { item: "Crystal Oscillator", quantity: 1.0 }
                ],
                outputs: [{ item: "Computer", quantity: 2.0 }]
            },
            {
                name: "Dark Matter Crystallization - Alternate",
                machine: "Particle Accelerator",
                craftTime: 3,
                inputs: [{ item: "Dark Matter Residue", quantity: 10.0 }],
                outputs: [{ item: "Dark Matter Crystal", quantity: 1.0 }]
            },
            {
                name: "Dark Matter Trap - Alternate",
                machine: "Particle Accelerator",
                craftTime: 2,
                inputs: [
                    { item: "Time Crystal", quantity: 1.0 },
                    { item: "Dark Matter Residue", quantity: 5.0 }
                ],
                outputs: [{ item: "Dark Matter Crystal", quantity: 2.0 }]
            },
            {
                name: "Dark-Ion Fuel - Alternate",
                machine: "Converter",
                craftTime: 3,
                inputs: [
                    { item: "Packaged Rocket Fuel", quantity: 12.0 },
                    { item: "Dark Matter Crystal", quantity: 4.0 }
                ],
                outputs: [
                    { item: "Ionized Fuel", quantity: 10.0 },
                    { item: "Compacted Coal", quantity: 2.0 }
                ]
            },
            {
                name: "Diluted Fuel - Alternate",
                machine: "Blender",
                craftTime: 6,
                inputs: [
                    { item: "Heavy Oil Residue", quantity: 5.0 },
                    { item: "Water", quantity: 10.0 }
                ],
                outputs: [{ item: "Fuel", quantity: 10.0 }]
            },
            {
                name: "Diluted Packaged Fuel - Alternate",
                machine: "Refinery",
                craftTime: 2,
                inputs: [
                    { item: "Heavy Oil Residue", quantity: 1.0 },
                    { item: "Packaged Water", quantity: 2.0 }
                ],
                outputs: [{ item: "Packaged Fuel", quantity: 2.0 }]
            },
            {
                name: "Distilled Silica - Alternate",
                machine: "Blender",
                craftTime: 6,
                inputs: [
                    { item: "Dissolved Silica", quantity: 12.0 },
                    { item: "Limestone", quantity: 5.0 },
                    { item: "Water", quantity: 10.0 }
                ],
                outputs: [
                    { item: "Silica", quantity: 27.0 },
                    { item: "Water", quantity: 8.0 }
                ]
            },
            {
                name: "Electric Motor - Alternate",
                machine: "Assembler",
                craftTime: 16,
                inputs: [
                    { item: "Electromagnetic Control Rod", quantity: 1.0 },
                    { item: "Rotor", quantity: 2.0 }
                ],
                outputs: [{ item: "Motor", quantity: 2.0 }]
            },
            {
                name: "Electrode Aluminum Scrap - Alternate",
                machine: "Refinery",
                craftTime: 4,
                inputs: [
                    { item: "Alumina Solution", quantity: 12.0 },
                    { item: "Petroleum Coke", quantity: 4.0 }
                ],
                outputs: [
                    { item: "Aluminum Scrap", quantity: 20.0 },
                    { item: "Water", quantity: 7.0 }
                ]
            },
            {
                name: "Electrode Circuit Board - Alternate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Rubber", quantity: 4.0 },
                    { item: "Petroleum Coke", quantity: 8.0 }
                ],
                outputs: [{ item: "Circuit Board", quantity: 1.0 }]
            },
            {
                name: "Electromagnetic Connection Rod - Alternate",
                machine: "Assembler",
                craftTime: 15,
                inputs: [
                    { item: "Stator", quantity: 2.0 },
                    { item: "High-Speed Connector", quantity: 1.0 }
                ],
                outputs: [{ item: "Electromagnetic Control Rod", quantity: 2.0 }]
            },
            {
                name: "Encased Industrial Pipe - Alternate",
                machine: "Assembler",
                craftTime: 15,
                inputs: [
                    { item: "Steel Pipe", quantity: 6.0 },
                    { item: "Concrete", quantity: 5.0 }
                ],
                outputs: [{ item: "Encased Industrial Beam", quantity: 1.0 }]
            },
            {
                name: "Fertile Uranium - Alternate",
                machine: "Blender",
                craftTime: 12,
                inputs: [
                    { item: "Uranium", quantity: 5.0 },
                    { item: "Uranium Waste", quantity: 5.0 },
                    { item: "Nitric Acid", quantity: 3.0 },
                    { item: "Sulfuric Acid", quantity: 5.0 }
                ],
                outputs: [
                    { item: "Non-Fissile Uranium", quantity: 20.0 },
                    { item: "Water", quantity: 8.0 }
                ]
            },
            {
                name: "Fine Black Powder - Alternate",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Sulfur", quantity: 1.0 },
                    { item: "Compacted Coal", quantity: 2.0 }
                ],
                outputs: [{ item: "Black Powder", quantity: 6.0 }]
            },
            {
                name: "Fine Concrete - Alternate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Silica", quantity: 3.0 },
                    { item: "Limestone", quantity: 12.0 }
                ],
                outputs: [{ item: "Concrete", quantity: 10.0 }]
            },
            {
                name: "Flexible Framework - Alternate",
                machine: "Manufacturer",
                craftTime: 16,
                inputs: [
                    { item: "Modular Frame", quantity: 1.0 },
                    { item: "Steel Beam", quantity: 6.0 },
                    { item: "Rubber", quantity: 8.0 }
                ],
                outputs: [{ item: "Versatile Framework", quantity: 2.0 }]
            },
            {
                name: "Fused Quartz Crystal - Alternate",
                machine: "Foundry",
                craftTime: 20,
                inputs: [
                    { item: "Raw Quartz", quantity: 25.0 },
                    { item: "Coal", quantity: 12.0 }
                ],
                outputs: [{ item: "Quartz Crystal", quantity: 18.0 }]
            },
            {
                name: "Fused Quickwire - Alternate",
                machine: "Assembler",
                craftTime: 8,
                inputs: [
                    { item: "Caterium Ingot", quantity: 1.0 },
                    { item: "Copper Ingot", quantity: 5.0 }
                ],
                outputs: [{ item: "Quickwire", quantity: 12.0 }]
            },
            {
                name: "Fused Wire - Alternate",
                machine: "Assembler",
                craftTime: 20,
                inputs: [
                    { item: "Copper Ingot", quantity: 4.0 },
                    { item: "Caterium Ingot", quantity: 1.0 }
                ],
                outputs: [{ item: "Wire", quantity: 30.0 }]
            },
            {
                name: "Heat Exchanger - Alternate",
                machine: "Assembler",
                craftTime: 6,
                inputs: [
                    { item: "Aluminum Casing", quantity: 3.0 },
                    { item: "Rubber", quantity: 3.0 }
                ],
                outputs: [{ item: "Heat Sink", quantity: 1.0 }]
            },
            {
                name: "Heat-Fused Frame - Alternate",
                machine: "Blender",
                craftTime: 20,
                inputs: [
                    { item: "Heavy Modular Frame", quantity: 1.0 },
                    { item: "Aluminum Ingot", quantity: 50.0 },
                    { item: "Nitric Acid", quantity: 8.0 },
                    { item: "Fuel", quantity: 10.0 }
                ],
                outputs: [{ item: "Fused Modular Frame", quantity: 1.0 }]
            },
            {
                name: "Heavy Encased Frame - Alternate",
                machine: "Manufacturer",
                craftTime: 64,
                inputs: [
                    { item: "Modular Frame", quantity: 8.0 },
                    { item: "Encased Industrial Beam", quantity: 10.0 },
                    { item: "Steel Pipe", quantity: 36.0 },
                    { item: "Concrete", quantity: 22.0 }
                ],
                outputs: [{ item: "Heavy Modular Frame", quantity: 3.0 }]
            },
            {
                name: "Heavy Flexible Frame - Alternate",
                machine: "Manufacturer",
                craftTime: 16,
                inputs: [
                    { item: "Modular Frame", quantity: 5.0 },
                    { item: "Encased Industrial Beam", quantity: 3.0 },
                    { item: "Rubber", quantity: 20.0 },
                    { item: "Screw", quantity: 104.0 }
                ],
                outputs: [{ item: "Heavy Modular Frame", quantity: 1.0 }]
            },
            {
                name: "Heavy Oil Residue - Alternate",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Crude Oil", quantity: 3.0 }],
                outputs: [
                    { item: "Heavy Oil Residue", quantity: 4.0 },
                    { item: "Polymer Resin", quantity: 2.0 }
                ]
            },
            {
                name: "Infused Uranium Cell - Alternate",
                machine: "Manufacturer",
                craftTime: 12,
                inputs: [
                    { item: "Uranium", quantity: 5.0 },
                    { item: "Silica", quantity: 3.0 },
                    { item: "Sulfur", quantity: 5.0 },
                    { item: "Quickwire", quantity: 15.0 }
                ],
                outputs: [{ item: "Encased Uranium Cell", quantity: 4.0 }]
            },
            {
                name: "Instant Plutonium Cell - Alternate",
                machine: "Particle Accelerator",
                craftTime: 120,
                inputs: [
                    { item: "Non-Fissile Uranium", quantity: 150.0 },
                    { item: "Aluminum Casing", quantity: 20.0 }
                ],
                outputs: [{ item: "Encased Plutonium Cell", quantity: 20.0 }]
            },
            {
                name: "Instant Scrap - Alternate",
                machine: "Blender",
                craftTime: 6,
                inputs: [
                    { item: "Bauxite", quantity: 15.0 },
                    { item: "Coal", quantity: 10.0 },
                    { item: "Sulfuric Acid", quantity: 5.0 },
                    { item: "Water", quantity: 6.0 }
                ],
                outputs: [
                    { item: "Aluminum Scrap", quantity: 30.0 },
                    { item: "Water", quantity: 5.0 }
                ]
            },
            {
                name: "Insulated Cable - Alternate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Wire", quantity: 9.0 },
                    { item: "Rubber", quantity: 6.0 }
                ],
                outputs: [{ item: "Cable", quantity: 20.0 }]
            },
            {
                name: "Insulated Crystal Oscillator - Alternate",
                machine: "Manufacturer",
                craftTime: 32,
                inputs: [
                    { item: "Quartz Crystal", quantity: 10.0 },
                    { item: "Rubber", quantity: 7.0 },
                    { item: "AI Limiter", quantity: 1.0 }
                ],
                outputs: [{ item: "Crystal Oscillator", quantity: 1.0 }]
            },
            {
                name: "Iron Alloy Ingot - Alternate",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Iron Ore", quantity: 8.0 },
                    { item: "Copper Ore", quantity: 2.0 }
                ],
                outputs: [{ item: "Iron Ingot", quantity: 15.0 }]
            },
            {
                name: "Iron Pipe - Alternate",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "Iron Ingot", quantity: 20.0 }],
                outputs: [{ item: "Steel Pipe", quantity: 5.0 }]
            },
            {
                name: "Iron Wire - Alternate",
                machine: "Constructor",
                craftTime: 24,
                inputs: [{ item: "Iron Ingot", quantity: 5.0 }],
                outputs: [{ item: "Wire", quantity: 9.0 }]
            },
            {
                name: "Leached Caterium Ingot - Alternate",
                machine: "Refinery",
                craftTime: 10,
                inputs: [
                    { item: "Caterium Ore", quantity: 9.0 },
                    { item: "Sulfuric Acid", quantity: 5.0 }
                ],
                outputs: [{ item: "Caterium Ingot", quantity: 6.0 }]
            },
            {
                name: "Leached Copper Ingot - Alternate",
                machine: "Refinery",
                craftTime: 12,
                inputs: [
                    { item: "Copper Ore", quantity: 9.0 },
                    { item: "Sulfuric Acid", quantity: 5.0 }
                ],
                outputs: [{ item: "Copper Ingot", quantity: 22.0 }]
            },
            {
                name: "Leached Iron ingot - Alternate",
                machine: "Refinery",
                craftTime: 6,
                inputs: [
                    { item: "Iron Ore", quantity: 5.0 },
                    { item: "Sulfuric Acid", quantity: 1.0 }
                ],
                outputs: [{ item: "Iron Ingot", quantity: 10.0 }]
            },
            {
                name: "Molded Beam - Alternate",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Steel Ingot", quantity: 24.0 },
                    { item: "Concrete", quantity: 16.0 }
                ],
                outputs: [{ item: "Steel Beam", quantity: 9.0 }]
            },
            {
                name: "Molded Steel Pipe - Alternate",
                machine: "Foundry",
                craftTime: 6,
                inputs: [
                    { item: "Steel Ingot", quantity: 5.0 },
                    { item: "Concrete", quantity: 3.0 }
                ],
                outputs: [{ item: "Steel Pipe", quantity: 5.0 }]
            },
            {
                name: "Nitro Rocket Fuel - Alternate",
                machine: "Blender",
                craftTime: 2,
                inputs: [
                    { item: "Fuel", quantity: 4.0 },
                    { item: "Nitrogen Gas", quantity: 3.0 },
                    { item: "Sulfur", quantity: 4.0 },
                    { item: "Coal", quantity: 2.0 }
                ],
                outputs: [
                    { item: "Rocket Fuel", quantity: 6.0 },
                    { item: "Compacted Coal", quantity: 1.0 }
                ]
            },
            {
                name: "OC Supercomputer - Alternate",
                machine: "Assembler",
                craftTime: 20,
                inputs: [
                    { item: "Radio Control Unit", quantity: 2.0 },
                    { item: "Cooling System", quantity: 2.0 }
                ],
                outputs: [{ item: "Supercomputer", quantity: 1.0 }]
            },
            {
                name: "Oil-Based Diamonds - Alternate",
                machine: "Particle Accelerator",
                craftTime: 3,
                inputs: [{ item: "Crude Oil", quantity:10.0 }],
                outputs: [{ item: "Diamonds", quantity: 2.0 }]
            },
            {
                name: "Petroleum Diamonds - Alternate",
                machine: "Particle Accelerator",
                craftTime: 2,
                inputs: [{ item: "Petroleum Coke", quantity: 24.0 }],
                outputs: [{ item: "Diamonds", quantity: 1.0 }]
            },
            {
                name: "Pink Diamonds - Alternate",
                machine: "Converter",
                craftTime: 4,
                inputs: [
                    { item: "Coal", quantity: 8.0 },
                    { item: "Quartz Crystal", quantity: 3.0 }
                ],
                outputs: [{ item: "Diamonds", quantity: 1.0 }]
            },
            {
                name: "Plastic AI Limiter - Alternate",
                machine: "Assembler",
                craftTime: 15,
                inputs: [
                    { item: "Quickwire", quantity: 30.0 },
                    { item: "Plastic", quantity: 7.0 }
                ],
                outputs: [{ item: "AI Limiter", quantity: 2.0 }]
            },
            {
                name: "Plastic Smart Plating - Alternate",
                machine: "Manufacturer",
                craftTime: 24,
                inputs: [
                    { item: "Reinforced Iron Plate", quantity: 1.0 },
                    { item: "Rotor", quantity: 1.0 },
                    { item: "Plastic", quantity: 3.0 }
                ],
                outputs: [{ item: "Smart Plating", quantity: 2.0 }]
            },
            {
                name: "Plutonium Fuel Unit - Alternate",
                machine: "Assembler",
                craftTime: 120,
                inputs: [
                    { item: "Encased Plutonium Cell", quantity: 20.0 },
                    { item: "Pressure Conversion Cube", quantity: 1.0 }
                ],
                outputs: [{ item: "Plutonium Fuel Rod", quantity: 1.0 }]
            },
            {
                name: "Polyester Fabric - Alternate",
                machine: "Refinery",
                craftTime: 2,
                inputs: [
                    { item: "Polymer Resin", quantity: 1.0 },
                    { item: "Water", quantity: 1.0 }
                ],
                outputs: [{ item: "Fabric", quantity: 1.0 }]
            },
            {
                name: "Polymer Resin - Alternate",
                machine: "Refinery",
                craftTime: 6,
                inputs: [{ item: "Crude Oil", quantity: 6.0 }],
                outputs: [
                    { item: "Polymer Resin", quantity: 13.0 },
                    { item: "Heavy Oil Residue", quantity: 2.0 }
                ]
            },
            {
                name: "Pure Aluminum Ingot - Alternate",
                machine: "Smelter",
                craftTime: 2,
                inputs: [{ item: "Aluminum Scrap", quantity: 2.0 }],
                outputs: [{ item: "Aluminum Ingot", quantity: 1.0 }]
            },
            {
                name: "Pure Caterium Ingot - Alternate",
                machine: "Refinery",
                craftTime: 5,
                inputs: [
                    { item: "Caterium Ore", quantity: 2.0 },
                    { item: "Water", quantity: 2.0 }
                ],
                outputs: [{ item: "Caterium Ingot", quantity: 1.0 }]
            },
            {
                name: "Pure Copper Ingot - Alternate",
                machine: "Refinery",
                craftTime: 24,
                inputs: [
                    { item: "Copper Ore", quantity: 6.0 },
                    { item: "Water", quantity: 4.0 }
                ],
                outputs: [{ item: "Copper Ingot", quantity: 15.0 }]
            },
            {
                name: "Pure Iron Ingot - Alternate",
                machine: "Refinery",
                craftTime: 12,
                inputs: [
                    { item: "Iron Ore", quantity: 7.0 },
                    { item: "Water", quantity: 4.0 }
                ],
                outputs: [{ item: "Iron Ingot", quantity: 13.0 }]
            },
            {
                name: "Pure Quartz Crystal - Alternate",
                machine: "Refinery",
                craftTime: 8,
                inputs: [
                    { item: "Raw Quartz", quantity: 9.0 },
                    { item: "Water", quantity: 5.0 }
                ],
                outputs: [{ item: "Quartz Crystal", quantity: 7.0 }]
            },
            {
                name: "Quartz Purification - Alternate",
                machine: "Refinery",
                craftTime: 12,
                inputs: [
                    { item: "Raw Quartz", quantity: 24.0 },
                    { item: "Nitric Acid", quantity: 2.0 }
                ],
                outputs: [
                    { item: "Quartz Crystal", quantity: 15.0 },
                    { item: "Dissolved Silica", quantity: 12.0 }
                ]
            },
            {
                name: "Quickwire Cable - Alternate",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Quickwire", quantity: 3.0 },
                    { item: "Rubber", quantity: 2.0 }
                ],
                outputs: [{ item: "Cable", quantity: 11.0 }]
            },
            {
                name: "Quickwire Stator - Alternate",
                machine: "Assembler",
                craftTime: 15,
                inputs: [
                    { item: "Steel Pipe", quantity: 4.0 },
                    { item: "Quickwire", quantity: 15.0 }
                ],
                outputs: [{ item: "Stator", quantity: 2.0 }]
            },
            {
                name: "Radio Connection Unit - Alternate",
                machine: "Manufacturer",
                craftTime: 16,
                inputs: [
                    { item: "Heat Sink", quantity: 4.0 },
                    { item: "High-Speed Connector", quantity: 2.0 },
                    { item: "Quartz Crystal", quantity: 12.0 }
                ],
                outputs: [{ item: "Radio Control Unit", quantity: 1.0 }]
            },
            {
                name: "Radio Control System - Alternate",
                machine: "Manufacturer",
                craftTime: 40,
                inputs: [
                    { item: "Crystal Oscillator", quantity: 1.0 },
                    { item: "Circuit Board", quantity: 10.0 },
                    { item: "Aluminum Casing", quantity: 60.0 },
                    { item: "Rubber", quantity: 30.0 }
                ],
                outputs: [{ item: "Radio Control Unit", quantity: 3.0 }]
            },
            {
                name: "Recycled Plastic - Alternate",
                machine: "Refinery",
                craftTime: 12,
                inputs: [
                    { item: "Rubber", quantity: 6.0 },
                    { item: "Fuel", quantity: 6.0 }
                ],
                outputs: [{ item: "Plastic", quantity: 12.0 }]
            },
            {
                name: "Recycled Rubber - Alternate",
                machine: "Refinery",
                craftTime: 12,
                inputs: [
                    { item: "Plastic", quantity: 6.0 },
                    { item: "Fuel", quantity: 6.0 }
                ],
                outputs: [{ item: "Rubber", quantity: 12.0 }]
            },
            {
                name: "Rigor Motor - Alternate",
                machine: "Manufacturer",
                craftTime: 48,
                inputs: [
                    { item: "Rotor", quantity: 3.0 },
                    { item: "Stator", quantity: 3.0 },
                    { item: "Crystal Oscillator", quantity: 1.0 }
                ],
                outputs: [{ item: "Motor", quantity: 6.0 }]
            },
            {
                name: "Rubber Concrete - Alternate",
                machine: "Assembler",
                craftTime: 6,
                inputs: [
                    { item: "Limestone", quantity: 10.0 },
                    { item: "Rubber", quantity: 2.0 }
                ],
                outputs: [{ item: "Concrete", quantity: 9.0 }]
            },
            {
                name: "Silicon Circuit Board - Alternate",
                machine: "Assembler",
                craftTime: 24,
                inputs: [
                    { item: "Copper Sheet", quantity: 11.0 },
                    { item: "Silica", quantity: 11.0 }
                ],
                outputs: [{ item: "Circuit Board", quantity: 5.0 }]
            },
            {
                name: "Silicon High-Speed Connector - Alternate",
                machine: "Manufacturer",
                craftTime: 40,
                inputs: [
                    { item: "Quickwire", quantity: 60.0 },
                    { item: "Silica", quantity: 25.0 },
                    { item: "Circuit Board", quantity: 2.0 }
                ],
                outputs: [{ item: "High-Speed Connector", quantity: 2.0 }]
            },
            {
                name: "Sloppy Alumina - Alternate",
                machine: "Refinery",
                craftTime: 3,
                inputs: [
                    { item: "Bauxite", quantity: 10.0 },
                    { item: "Water", quantity: 10.0 }
                ],
                outputs: [{ item: "Alumina Solution", quantity: 12.0 }]
            },
            {
                name: "Solid Steel Ingot - Alternate",
                machine: "Foundry",
                craftTime: 3,
                inputs: [
                    { item: "Iron Ingot", quantity: 2.0 },
                    { item: "Coal", quantity: 2.0 }
                ],
                outputs: [{ item: "Steel Ingot", quantity: 3.0 }]
            },
            {
                name: "Steamed Copper Sheet - Alternate",
                machine: "Refinery",
                craftTime: 8,
                inputs: [
                    { item: "Copper Ingot", quantity: 3.0 },
                    { item: "Water", quantity: 3.0 }
                ],
                outputs: [{ item: "Copper Sheet", quantity: 3.0 }]
            },
            {
                name: "Steel Canister - Alternate",
                machine: "Constructor",
                craftTime: 6,
                inputs: [{ item: "Steel Ingot", quantity: 4.0 }],
                outputs: [{ item: "Empty Canister", quantity: 4.0 }]
            },
            {
                name: "Steel Cast Plate - Alternate",
                machine: "Foundry",
                craftTime: 4,
                inputs: [
                    { item: "Iron Ingot", quantity: 1.0 },
                    { item: "Steel Ingot", quantity: 1.0 }
                ],
                outputs: [{ item: "Iron Plate", quantity: 3.0 }]
            },
            {
                name: "Steel Rod - Alternate",
                machine: "Constructor",
                craftTime: 5,
                inputs: [{ item: "Steel Ingot", quantity: 1.0 }],
                outputs: [{ item: "Iron Rod", quantity: 4.0 }]
            },
            {
                name: "Steel Rotor - Alternate",
                machine: "Assembler",
                craftTime: 12,
                inputs: [
                    { item: "Steel Pipe", quantity: 2.0 },
                    { item: "Wire", quantity: 6.0 }
                ],
                outputs: [{ item: "Rotor", quantity: 1.0 }]
            },
            {
                name: "Steel Screw - Alternate",
                machine: "Constructor",
                craftTime: 12,
                inputs: [{ item: "Steel Beam", quantity: 1.0 }],
                outputs: [{ item: "Screw", quantity: 52.0 }]
            },
            {
                name: "Steeled Frame - Alternate",
                machine: "Assembler",
                craftTime: 60,
                inputs: [
                    { item: "Reinforced Iron Plate", quantity: 2.0 },
                    { item: "Steel Pipe", quantity: 10.0 }
                ],
                outputs: [{ item: "Modular Frame", quantity: 3.0 }]
            },
            {
                name: "Stitched Iron Plate - Alternate",
                machine: "Assembler",
                craftTime: 32,
                inputs: [
                    { item: "Iron Plate", quantity: 10.0 },
                    { item: "Wire", quantity: 20.0 }
                ],
                outputs: [{ item: "Reinforced Iron Plate", quantity: 3.0 }]
            },
            {
                name: "Super-State Computer - Alternate",
                machine: "Manufacturer",
                craftTime: 25,
                inputs: [
                    { item: "Computer", quantity: 3.0 },
                    { item: "Electromagnetic Control Rod", quantity: 1.0 },
                    { item: "Battery", quantity: 10.0 },
                    { item: "Wire", quantity: 25.0 }
                ],
                outputs: [{ item: "Supercomputer", quantity: 1.0 }]
            },
            {
                name: "Tempered Caterium Ingot - Alternate",
                machine: "Foundry",
                craftTime: 8,
                inputs: [
                    { item: "Caterium Ore", quantity: 6.0 },
                    { item: "Petroleum Coke", quantity: 2.0 }
                ],
                outputs: [{ item: "Caterium Ingot", quantity: 3.0 }]
            },
            {
                name: "Tempered Copper Ingot - Alternate",
                machine: "Foundry",
                craftTime: 12,
                inputs: [
                    { item: "Copper Ore", quantity: 5.0 },
                    { item: "Petroleum Coke", quantity: 8.0 }
                ],
                outputs: [{ item: "Copper Ingot", quantity: 12.0 }]
            },
            {
                name: "Turbo Blend Fuel - Alternate",
                machine: "Blender",
                craftTime: 8,
                inputs: [
                    { item: "Fuel", quantity: 2.0 },
                    { item: "Heavy Oil Residue", quantity: 4.0 },
                    { item: "Sulfur", quantity: 3.0 },
                    { item: "Petroleum Coke", quantity: 3.0 }
                ],
                outputs: [{ item: "Turbofuel", quantity: 6.0 }]
            },
            {
                name: "Turbo Diamonds - Alternate",
                machine: "Particle Accelerator",
                craftTime: 3,
                inputs: [
                    { item: "Coal", quantity: 30.0 },
                    { item: "Packaged Turbofuel", quantity: 2.0 }
                ],
                outputs: [{ item: "Diamonds", quantity: 3.0 }]
            },
            {
                name: "Turbo Electric Motor - Alternate",
                machine: "Manufacturer",
                craftTime: 64,
                inputs: [
                    { item: "Motor", quantity: 7.0 },
                    { item: "Radio Control Unit", quantity: 9.0 },
                    { item: "Electromagnetic Control Rod", quantity: 5.0 },
                    { item: "Rotor", quantity: 7.0 }
                ],
                outputs: [{ item: "Turbo Motor", quantity: 3.0 }]
            },
            {
                name: "Turbo Heavy Fuel - Alternate",
                machine: "Refinery",
                craftTime: 8,
                inputs: [
                    { item: "Heavy Oil Residue", quantity: 5.0 },
                    { item: "Compacted Coal", quantity: 4.0 }
                ],
                outputs: [{ item: "Turbofuel", quantity: 4.0 }]
            },
            {
                name: "Turbo Pressure Motor - Alternate",
                machine: "Manufacturer",
                craftTime: 32,
                inputs: [
                    { item: "Motor", quantity: 4.0 },
                    { item: "Pressure Conversion Cube", quantity: 1.0 },
                    { item: "Packaged Nitrogen Gas", quantity: 24.0 },
                    { item: "Stator", quantity: 8.0 }
                ],
                outputs: [{ item: "Turbo Motor", quantity: 2.0 }]
            },
            {
                name: "Turbofuel - Alternate",
                machine: "Refinery",
                craftTime: 16,
                inputs: [
                    { item: "Fuel", quantity: 6.0 },
                    { item: "Compacted Coal", quantity: 4.0 }
                ],
                outputs: [{ item: "Turbofuel", quantity: 5.0 }]
            },
            {
                name: "Uranium Fuel Unit - Alternate",
                machine: "Manufacturer",
                craftTime: 300,
                inputs: [
                    { item: "Encased Uranium Cell", quantity: 100.0 },
                    { item: "Electromagnetic Control Rod", quantity: 10.0 },
                    { item: "Crystal Oscillator", quantity: 3.0 },
                    { item: "Rotor", quantity: 10.0 }
                ],
                outputs: [{ item: "Uranium Fuel Rod", quantity: 3.0 }]
            },
            {
                name: "Wet Concrete - Alternate",
                machine: "Refinery",
                craftTime: 3,
                inputs: [
                    { item: "Limestone", quantity: 6.0 },
                    { item: "Water", quantity: 5.0 }
                ],
                outputs: [{ item: "Concrete", quantity: 4.0 }]
            }
        ];



        recipeData.forEach(recipe => {
            this.recipes.set(recipe.name, recipe);
        });
    }

    private initializeItems(): void {
        const itemData: Item[] = [
            { name: "Magnetic Field Generator", transportType: "belt" },
            { name: "Neural-Quantum Processor", transportType: "belt" },
            { name: "Superposition Oscillator", transportType: "belt" },
            { name: "Excited Photonic Matter", transportType: "belt" },
            { name: "AI Expansion Server", transportType: "belt" },
            { name: "Dark Matter Residue", transportType: "belt" },
            { name: "Copper Sheet", transportType: "belt" },
            { name: "Quickwire", transportType: "belt" },
            { name: "AI Limiter", transportType: "belt" },
            { name: "FICSMAS Gift", transportType: "belt" },
            { name: "Actual Snow", transportType: "belt" },
            { name: "Automated Wiring", transportType: "belt" },
            { name: "Circuit Board", transportType: "belt" },
            { name: "Heavy Modular Frame", transportType: "belt" },
            { name: "Computer", transportType: "belt" },
            { name: "Adaptive Control Unit", transportType: "belt" },
            { name: "Aluminum Ingot", transportType: "belt" },
            { name: "Copper Ingot", transportType: "belt" },
            { name: "Alclad Aluminum Sheet", transportType: "belt" },
            { name: "Alien Protein", transportType: "belt" },
            { name: "Alien DNA Capsule", transportType: "belt" },
            { name: "SAM Fluctuator", transportType: "belt" },
            { name: "Power Shard", transportType: "belt" },
            { name: "Alien Power Matrix", transportType: "belt" },
            { name: "Bauxite", transportType: "belt" },
            { name: "Water", transportType: "pipe" },
            { name: "Alumina Solution", transportType: "pipe" },
            { name: "Silica", transportType: "belt" },
            { name: "Aluminum Casing", transportType: "belt" },
            { name: "Aluminum Scrap", transportType: "belt" },
            { name: "Coal", transportType: "belt" },
            { name: "Supercomputer", transportType: "belt" },
            { name: "Assembly Director System", transportType: "belt" },
            { name: "Stator", transportType: "belt" },
            { name: "Cable", transportType: "belt" },
            { name: "Thermal Propulsion Rocket", transportType: "belt" },
            { name: "Singularity Cell", transportType: "belt" },
            { name: "Dark Matter Crystal", transportType: "belt" },
            { name: "Ballistic Warp Drive", transportType: "belt" },
            { name: "Sulfuric Acid", transportType: "belt" },
            { name: "Battery", transportType: "belt" },
            { name: "Reanimated SAM", transportType: "belt" },
            { name: "Caterium Ore", transportType: "belt" },
            { name: "Copper Ore", transportType: "belt" },
            { name: "Ficsite Trigon", transportType: "belt" },
            { name: "Biochemical Sculptor", transportType: "belt" },
            { name: "Biomass", transportType: "belt" },
            { name: "Leaves", transportType: "belt" },
            { name: "Mycelia", transportType: "belt" },
            { name: "Wood", transportType: "belt" },
            { name: "Sulfur", transportType: "belt" },
            { name: "Black Powder", transportType: "belt" },
            { name: "Modular Frame", transportType: "belt" },
            { name: "Rotor", transportType: "belt" },
            { name: "Blade Runners", transportType: "belt" },
            { name: "Blue FICSMAS Ornament", transportType: "belt" },
            { name: "Wire", transportType: "belt" },
            { name: "Candy Cane", transportType: "belt" },
            { name: "Xeno-Zapper", transportType: "belt" },
            { name: "Candy Cane Basher", transportType: "belt" },
            { name: "Caterium Ingot", transportType: "belt" },
            { name: "Raw Quartz", transportType: "belt" },
            { name: "Reinforced Iron Plate", transportType: "belt" },
            { name: "Iron Rod", transportType: "belt" },
            { name: "Screw", transportType: "belt" },
            { name: "Chainsaw", transportType: "belt" },
            { name: "Plastic", transportType: "belt" },
            { name: "Nobelisk", transportType: "belt" },
            { name: "Smokeless Powder", transportType: "belt" },
            { name: "Cluster Nobelisk", transportType: "belt" },
            { name: "Iron Ore", transportType: "belt" },
            { name: "Limestone", transportType: "belt" },
            { name: "Concrete", transportType: "belt" },
            { name: "Heat Sink", transportType: "belt" },
            { name: "Rubber", transportType: "belt" },
            { name: "Nitrogen Gas", transportType: "pipe" },
            { name: "Cooling System", transportType: "belt" },
            { name: "Red FICSMAS Ornament", transportType: "belt" },
            { name: "Copper FICSMAS Ornament", transportType: "belt" },
            { name: "Copper Powder", transportType: "belt" },
            { name: "Quartz Crystal", transportType: "belt" },
            { name: "Crystal Oscillator", transportType: "belt" },
            { name: "Diamonds", transportType: "belt" },
            { name: "Electromagnetic Control Rod", transportType: "belt" },
            { name: "Empty Canister", transportType: "belt" },
            { name: "Empty Fluid Tank", transportType: "belt" },
            { name: "Steel Beam", transportType: "belt" },
            { name: "Encased Industrial Beam", transportType: "belt" },
            { name: "Plutonium Pellet", transportType: "belt" },
            { name: "Encased Plutonium Cell", transportType: "belt" },
            { name: "Uranium", transportType: "belt" },
            { name: "Encased Uranium Cell", transportType: "belt" },
            { name: "Iron Rebar", transportType: "belt" },
            { name: "Steel Pipe", transportType: "belt" },
            { name: "Explosive Rebar", transportType: "belt" },
            { name: "FICSMAS Bow", transportType: "belt" },
            { name: "FICSMAS Tree Branch", transportType: "belt" },
            { name: "FICSMAS Ornament Bundle", transportType: "belt" },
            { name: "FICSMAS Decoration", transportType: "belt" },
            { name: "Iron FICSMAS Ornament", transportType: "belt" },
            { name: "FICSMAS Wonder Star", transportType: "belt" },
            { name: "Fabric", transportType: "belt" },
            { name: "Factory Cart™", transportType: "belt" },
            { name: "Fancy Fireworks", transportType: "belt" },
            { name: "Ficsite Ingot", transportType: "belt" },
            { name: "Iron Ingot", transportType: "belt" },
            { name: "Plutonium Waste", transportType: "belt" },
            { name: "Ficsonium", transportType: "belt" },
            { name: "Ficsonium Fuel Rod", transportType: "belt" },
            { name: "Crude Oil", transportType: "pipe" },
            { name: "Fuel", transportType: "belt" },
            { name: "Polymer Resin", transportType: "belt" },
            { name: "Fused Modular Frame", transportType: "belt" },
            { name: "Iron Plate", transportType: "belt" },
            { name: "Gas Filter", transportType: "pipe" },
            { name: "Gas Mask", transportType: "pipe" },
            { name: "Gas Nobelisk", transportType: "pipe" },
            { name: "Golden Factory Cart™", transportType: "belt" },
            { name: "Hatcher Remains", transportType: "belt" },
            { name: "Hazmat Suit", transportType: "belt" },
            { name: "High-Speed Connector", transportType: "belt" },
            { name: "Hog Remains", transportType: "belt" },
            { name: "Rifle Ammo", transportType: "belt" },
            { name: "Homing Rifle Ammo", transportType: "belt" },
            { name: "Motor", transportType: "belt" },
            { name: "Hoverpack", transportType: "belt" },
            { name: "Iodine-Infused Filter", transportType: "belt" },
            { name: "Rocket Fuel", transportType: "belt" },
            { name: "Ionized Fuel", transportType: "belt" },
            { name: "Compacted Coal", transportType: "belt" },
            { name: "Jetpack", transportType: "belt" },
            { name: "Solid Biofuel", transportType: "belt" },
            { name: "Liquid Biofuel", transportType: "pipe" },
            { name: "Versatile Framework", transportType: "belt" },
            { name: "Smart Plating", transportType: "belt" },
            { name: "Modular Engine", transportType: "belt" },
            { name: "Time Crystal", transportType: "belt" },
            { name: "Nitric Acid", transportType: "belt" },
            { name: "Object Scanner", transportType: "belt" },
            { name: "Nobelisk Detonator", transportType: "belt" },
            { name: "Uranium Waste", transportType: "belt" },
            { name: "Non-Fissile Uranium", transportType: "belt" },
            { name: "Pressure Conversion Cube", transportType: "belt" },
            { name: "Nuclear Pasta", transportType: "belt" },
            { name: "Nuke Nobelisk", transportType: "belt" },
            { name: "Bacon Agaric", transportType: "belt" },
            { name: "Paleberry", transportType: "belt" },
            { name: "Beryl Nut", transportType: "belt" },
            { name: "Medicinal Inhaler", transportType: "belt" },
            { name: "Packaged Alumina Solution", transportType: "pipe" },
            { name: "Packaged Fuel", transportType: "belt" },
            { name: "Heavy Oil Residue", transportType: "belt" },
            { name: "Packaged Heavy Oil Residue", transportType: "belt" },
            { name: "Packaged Ionized Fuel", transportType: "belt" },
            { name: "Packaged Liquid Biofuel", transportType: "pipe" },
            { name: "Packaged Nitric Acid", transportType: "belt" },
            { name: "Packaged Nitrogen Gas", transportType: "pipe" },
            { name: "Packaged Oil", transportType: "belt" },
            { name: "Packaged Rocket Fuel", transportType: "belt" },
            { name: "Packaged Sulfuric Acid", transportType: "belt" },
            { name: "Turbofuel", transportType: "belt" },
            { name: "Packaged Turbofuel", transportType: "belt" },
            { name: "Packaged Water", transportType: "pipe" },
            { name: "Parachute", transportType: "belt" },
            { name: "Petroleum Coke", transportType: "belt" },
            { name: "Plutonium Fuel Rod", transportType: "belt" },
            { name: "Portable Miner", transportType: "belt" },
            { name: "Blue Power Slug", transportType: "belt" },
            { name: "Yellow Power Slug", transportType: "belt" },
            { name: "Purple Power Slug", transportType: "belt" },
            { name: "Radio Control Unit", transportType: "belt" },
            { name: "Pulse Nobelisk", transportType: "belt" },
            { name: "SAM", transportType: "belt" },
            { name: "Rebar Gun", transportType: "belt" },
            { name: "Rifle", transportType: "belt" },
            { name: "Shatter Rebar", transportType: "belt" },
            { name: "Snowball", transportType: "belt" },
            { name: "Sparkly Fireworks", transportType: "belt" },
            { name: "Spitter Remains", transportType: "belt" },
            { name: "Steel Ingot", transportType: "belt" },
            { name: "Stinger Remains", transportType: "belt" },
            { name: "Stun Rebar", transportType: "belt" },
            { name: "Sweet Fireworks", transportType: "belt" },
            { name: "Turbo Motor", transportType: "belt" },
            { name: "Turbo Rifle Ammo", transportType: "belt" },
            { name: "Uranium Fuel Rod", transportType: "belt" },
            { name: "Xeno-Basher", transportType: "belt" },
            { name: "Zipline", transportType: "belt" },
            { name: "Dissolved Silica", transportType: "belt" }
        ];

        itemData.forEach(item => {
            this.items.set(item.name, item);
        });
    }

    // Getter methods
    public getMachine(name: string): Machine | undefined {
        return this.machines.get(name);
    }

    public getAllMachines(): Machine[] {
        return Array.from(this.machines.values());
    }

    public getRecipe(name: string): Recipe | undefined {
        return this.recipes.get(name);
    }

    public getRecipesForMachine(machineName: string): Recipe[] {
        return Array.from(this.recipes.values())
            .filter(recipe => recipe.machine === machineName);
    }

    public getItem(name: string): Item | undefined {
        return this.items.get(name);
    }

    public getAllItems(): Item[] {
        return Array.from(this.items.values());
    }

    // Image management
    public async loadImages(scene: Phaser.Scene): Promise<void> {
        // Load machine images
        this.machines.forEach((machine, name) => {
            const key = `machine-${name.toLowerCase().replace(/\s+/g, '-')}`;
            scene.load.image(key, `assets/machines/${key}.png`);
            this.imageCache.set(name, key);
        });

        // Load item images
        this.items.forEach((item, name) => {
            const key = `item-${name.toLowerCase().replace(/\s+/g, '-')}`;
            scene.load.image(key, `assets/items/${key}.png`);
            this.imageCache.set(name, key);
        });
    }

    public getImageKey(name: string): string | undefined {
        return this.imageCache.get(name);
    }
}

export default GameData;