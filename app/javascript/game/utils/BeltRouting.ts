/**
 * Advanced orthogonal routing for belts with 90° entry/exit requirement.
 * Belts must enter and exit connection points perpendicular to the surface.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Direction {
    x: number;  // -1, 0, or 1
    y: number;  // -1, 0, or 1
}

/**
 * Generate a path that exits start point at 90° and enters end point at 90°.
 * The path will have multiple segments to accommodate this requirement.
 *
 * @param start - Starting point coordinates
 * @param end - Ending point coordinates
 * @param startDir - Direction to exit from start (perpendicular to connection surface)
 * @param endDir - Direction to enter end (perpendicular to connection surface)
 * @param minStraight - Minimum distance to travel straight out/in (default: 20px)
 */
export function generate90DegPath(
    start: Point,
    end: Point,
    startDir: Direction,
    endDir: Direction,
    minStraight: number = 20
): Point[] {
    const path: Point[] = [];

    // Start point
    path.push({ x: start.x, y: start.y });

    // Exit point: go straight out from start in startDir
    const exitPoint = {
        x: start.x + startDir.x * minStraight,
        y: start.y + startDir.y * minStraight
    };
    path.push(exitPoint);

    // Entry point: go straight into end from endDir
    // Note: endDir points INTO the connection, so we go opposite direction
    const entryPoint = {
        x: end.x - endDir.x * minStraight,
        y: end.y - endDir.y * minStraight
    };

    // Now route between exitPoint and entryPoint
    // We need to maintain the direction we're traveling
    const midPath = routeBetweenPoints(exitPoint, entryPoint, startDir, endDir);
    path.push(...midPath);

    // Final entry into the end point
    path.push({ x: end.x, y: end.y });

    return path;
}

/**
 * Route between two points, starting in startDir and ending ready to go in endDir.
 * Creates intermediate waypoints as needed.
 * Handles U-turns by routing perpendicular first to avoid doubling back.
 */
function routeBetweenPoints(
    from: Point,
    to: Point,
    fromDir: Direction,
    toDir: Direction
): Point[] {
    const path: Point[] = [];

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Determine if we're traveling horizontally or vertically from 'from'
    const isFromHorizontal = fromDir.x !== 0;
    const isToHorizontal = toDir.x !== 0;

    // Check for U-turn situation (opposite directions on same axis)
    const isUTurn = isFromHorizontal === isToHorizontal && (
        (fromDir.x !== 0 && fromDir.x === -toDir.x) ||
        (fromDir.y !== 0 && fromDir.y === -toDir.y)
    );

    if (isUTurn) {
        // U-turn detected - route perpendicular first to avoid doubling back
        const clearanceDistance = 60; // Distance to travel perpendicular before turning back

        if (isFromHorizontal) {
            // Horizontal U-turn: go perpendicular (up or down) first
            // Choose direction that moves toward the target
            const perpendicularDir = dy > 0 ? 1 : -1;
            const midY = from.y + (clearanceDistance * perpendicularDir);

            path.push({ x: from.x, y: midY });  // Turn perpendicular
            path.push({ x: to.x, y: midY });     // Travel across
            path.push({ x: to.x, y: to.y });     // Turn back to target
        } else {
            // Vertical U-turn: go perpendicular (left or right) first
            const perpendicularDir = dx > 0 ? 1 : -1;
            const midX = from.x + (clearanceDistance * perpendicularDir);

            path.push({ x: midX, y: from.y });   // Turn perpendicular
            path.push({ x: midX, y: to.y });     // Travel across
            path.push({ x: to.x, y: to.y });     // Turn back to target
        }
    } else if (isFromHorizontal === isToHorizontal) {
        // Same orientation (but not U-turn) - need 3 segments
        if (isFromHorizontal) {
            // Both horizontal: go horizontal, vertical, horizontal
            const midX = from.x + dx / 2;
            path.push({ x: midX, y: from.y });
            path.push({ x: midX, y: to.y });
        } else {
            // Both vertical: go vertical, horizontal, vertical
            const midY = from.y + dy / 2;
            path.push({ x: from.x, y: midY });
            path.push({ x: to.x, y: midY });
        }
    } else {
        // Different orientation - need 1 turn
        if (isFromHorizontal) {
            // From horizontal to vertical: turn at corner
            path.push({ x: to.x, y: from.y });
        } else {
            // From vertical to horizontal: turn at corner
            path.push({ x: from.x, y: to.y });
        }
    }

    return path;
}

/**
 * Automatically choose best routing strategy based on positions and directions.
 * Enforces 90° entry/exit angles.
 */
export function generateSmartPath(
    start: Point,
    end: Point,
    startDirection?: Direction,
    endDirection?: Direction
): Point[] {
    // If we have direction info, use the 90° routing
    if (startDirection && endDirection) {
        return generate90DegPath(start, end, startDirection, endDirection);
    }

    // Fallback to simple routing if no direction info
    // (This shouldn't happen with our connection point system)
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const path: Point[] = [{ x: start.x, y: start.y }];

    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal first
        if (dx !== 0) path.push({ x: end.x, y: start.y });
        path.push({ x: end.x, y: end.y });
    } else {
        // Vertical first
        if (dy !== 0) path.push({ x: start.x, y: end.y });
        path.push({ x: end.x, y: end.y });
    }

    return path;
}

/**
 * Legacy function - kept for backwards compatibility
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

    if (preferHorizontalFirst) {
        if (Math.abs(dx) > 0) {
            path.push({ x: end.x, y: start.y });
        }
        path.push({ x: end.x, y: end.y });
    } else {
        if (Math.abs(dy) > 0) {
            path.push({ x: start.x, y: end.y });
        }
        path.push({ x: end.x, y: end.y });
    }

    return path;
}
