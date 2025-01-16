// TODO: Get save and load working for simulations.
// Saves should be associated with sandbox, or a specific level.
// Saves can only be loaded for the matching mode/level.


import { SimulationScene } from './scenes/simulation-scene';

export interface FactoryState {
    x: number;
    y: number;
    type: string;
    recipe?: string;
    efficiency?: number;
}

export interface ConnectionPoint {
    x: number;
    y: number;
}

export interface BeltState {
    id: string;
    fromFactory: string;
    toFactory: string;
    points: ConnectionPoint[];
}

export interface PipeState {
    id: string;
    fromFactory: string;
    toFactory: string;
    points: ConnectionPoint[];
}

export interface SaveState {
    version: string;
    mode: 'sandbox' | 'level';
    levelId?: number;
    factories: FactoryState[];
    belts: BeltState[];
    pipes: PipeState[];
    lastModified: number;
    name: string;
}

export interface SaveMetadata {
    name: string;
    timestamp: number;
    mode: 'sandbox' | 'level';
    levelId?: number;
}

const SAVE_PREFIX = 'sat_sim_save_';
const VERSION = '1.0.0';

export function getSaves(): SaveMetadata[] {
    const saves: SaveMetadata[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(SAVE_PREFIX)) {
            try {
                const save = JSON.parse(localStorage.getItem(key) || '');
                saves.push({
                    name: save.name,
                    timestamp: save.lastModified,
                    mode: save.mode,
                    levelId: save.levelId
                });
            } catch (e) {
                console.error('Error parsing save:', e);
            }
        }
    }
    return saves.sort((a, b) => b.timestamp - a.timestamp);
}

export function saveGame(scene: SimulationScene, name: string): void {
    const factories: FactoryState[] = scene.factories.map(factory => ({
        x: factory.x,
        y: factory.y,
        type: factory.type || 'factory'
    }));

    const saveState: SaveState = {
        version: VERSION,
        mode: scene.gameMode,
        levelId: scene.levelId,
        factories: factories,
        belts: [],    // To be implemented when belt system is added
        pipes: [],    // To be implemented when pipe system is added
        lastModified: Date.now(),
        name: name
    };

    const saveKey = SAVE_PREFIX + name.toLowerCase().replace(/\s+/g, '_');
    localStorage.setItem(saveKey, JSON.stringify(saveState));
}

export function loadGame(name: string): SaveState | null {
    const saveKey = SAVE_PREFIX + name.toLowerCase().replace(/\s+/g, '_');
    const saveData = localStorage.getItem(saveKey);

    if (!saveData) {
        return null;
    }

    try {
        const saveState: SaveState = JSON.parse(saveData);
        if (!validateSaveState(saveState)) {
            throw new Error('Invalid save state');
        }
        return saveState;
    } catch (e) {
        console.error('Error loading save:', e);
        return null;
    }
}

export function deleteSave(name: string): void {
    const saveKey = SAVE_PREFIX + name.toLowerCase().replace(/\s+/g, '_');
    localStorage.removeItem(saveKey);
}

function validateSaveState(save: any): save is SaveState {
    return (
        save &&
        typeof save.version === 'string' &&
        (save.mode === 'sandbox' || save.mode === 'level') &&
        Array.isArray(save.factories) &&
        Array.isArray(save.belts) &&
        Array.isArray(save.pipes) &&
        typeof save.lastModified === 'number' &&
        typeof save.name === 'string'
    );
}