/**
 * Simple orthogonal routing for belts.
 * Creates clean L-shaped or Z-shaped paths between two points.
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Generate a simple orthogonal path between two points.
 * Uses L-shape (2 segments) or Z-shape (3 segments) routing.
 */
export function generateOrthogonalPath(
    start: Point,
    end: Point,
    preferHorizontalFirst: boolean = true
): Point[] {
    const path: Point[] = [];

    path.push({ x: start.x, y: start.y });

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Simple L-shape: horizontal then vertical, or vertical then horizontal
    if (preferHorizontalFirst) {
        // Go horizontal first, then vertical
        if (Math.abs(dx) > 0) {
            path.push({ x: end.x, y: start.y });
        }
        path.push({ x: end.x, y: end.y });
    } else {
        // Go vertical first, then horizontal
        if (Math.abs(dy) > 0) {
            path.push({ x: start.x, y: end.y });
        }
        path.push({ x: end.x, y: end.y });
    }

    return path;
}

/**
 * Generate a Z-shaped path with a middle segment.
 * Useful for more complex routing.
 */
export function generateZPath(
    start: Point,
    end: Point,
    horizontal: boolean = true
): Point[] {
    const path: Point[] = [];

    path.push({ x: start.x, y: start.y });

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    if (horizontal) {
        // Horizontal-Vertical-Horizontal (Z-shape rotated)
        const midX = start.x + dx / 2;
        path.push({ x: midX, y: start.y });
        path.push({ x: midX, y: end.y });
        path.push({ x: end.x, y: end.y });
    } else {
        // Vertical-Horizontal-Vertical (Z-shape)
        const midY = start.y + dy / 2;
        path.push({ x: start.x, y: midY });
        path.push({ x: end.x, y: midY });
        path.push({ x: end.x, y: end.y });
    }

    return path;
}

/**
 * Automatically choose best routing strategy based on positions.
 * Tries to route away from the connection point direction.
 */
export function generateSmartPath(
    start: Point,
    end: Point,
    startDirection?: { x: number; y: number },
    endDirection?: { x: number; y: number }
): Point[] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // If we have direction info, use it to determine routing preference
    if (startDirection) {
        // Start by going in the direction of the output
        if (Math.abs(startDirection.x) > Math.abs(startDirection.y)) {
            // Prefer horizontal first
            return generateOrthogonalPath(start, end, true);
        } else {
            // Prefer vertical first
            return generateOrthogonalPath(start, end, false);
        }
    }

    // Default: choose based on which distance is larger
    if (Math.abs(dx) > Math.abs(dy)) {
        return generateOrthogonalPath(start, end, true);
    } else {
        return generateOrthogonalPath(start, end, false);
    }
}
