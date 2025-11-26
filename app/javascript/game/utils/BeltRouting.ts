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
 * @param minStraight - Minimum distance to travel straight out/in (default: 40px for clearance)
 */
export function generate90DegPath(
    start: Point,
    end: Point,
    startDir: Direction,
    endDir: Direction,
    minStraight: number = 40
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

    // Check if we need to go backwards (target is behind us in our travel direction)
    const needsReversal =
        (fromDir.x > 0 && dx < 0) || (fromDir.x < 0 && dx > 0) ||
        (fromDir.y > 0 && dy < 0) || (fromDir.y < 0 && dy > 0);

    if (isUTurn || needsReversal) {
        // U-turn or reversal detected - route perpendicular first to avoid doubling back
        const clearanceDistance = 80; // Increased clearance to avoid factory overlap

        if (isFromHorizontal) {
            // Horizontal movement: go perpendicular (up or down) first
            // Choose direction that moves TOWARD the target to avoid reversals
            let perpendicularDir: number;
            if (Math.abs(dy) > 5) {
                // Target is significantly above or below - go toward it
                perpendicularDir = dy > 0 ? 1 : -1;
            } else {
                // Horizontally aligned - choose based on which way we're going
                // If going right, go down. If going left, go up.
                perpendicularDir = fromDir.x > 0 ? 1 : -1;
            }

            // Calculate midpoint - ensure we go far enough in perpendicular direction
            // to have room for the horizontal travel
            const minClearance = Math.max(clearanceDistance, Math.abs(dx) * 0.5);
            const midY = from.y + (minClearance * perpendicularDir);

            path.push({ x: from.x, y: midY });  // Turn perpendicular (90°)
            path.push({ x: to.x, y: midY });     // Travel across horizontally

            // Only add final turn if we're not already at the target Y
            // This prevents a potential reversal
            if (Math.abs(midY - to.y) > 5) {
                path.push({ x: to.x, y: to.y });     // Turn to entry point (90°)
            }
        } else {
            // Vertical movement: go perpendicular (left or right) first
            let perpendicularDir: number;
            if (Math.abs(dx) > 5) {
                // Target is significantly left or right - go toward it
                perpendicularDir = dx > 0 ? 1 : -1;
            } else {
                // Vertically aligned - choose based on which way we're going
                // If going down, go right. If going up, go left.
                perpendicularDir = fromDir.y > 0 ? 1 : -1;
            }

            // Calculate midpoint with sufficient clearance
            const minClearance = Math.max(clearanceDistance, Math.abs(dy) * 0.5);
            const midX = from.x + (minClearance * perpendicularDir);

            path.push({ x: midX, y: from.y });   // Turn perpendicular (90°)
            path.push({ x: midX, y: to.y });     // Travel across vertically

            // Only add final turn if needed
            if (Math.abs(midX - to.x) > 5) {
                path.push({ x: to.x, y: to.y });     // Turn to entry point (90°)
            }
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
    // Check if we have valid direction info (non-zero vectors)
    const hasValidStartDir = startDirection && (startDirection.x !== 0 || startDirection.y !== 0);
    const hasValidEndDir = endDirection && (endDirection.x !== 0 || endDirection.y !== 0);

    // If we have valid direction info, use the 90° routing
    if (hasValidStartDir && hasValidEndDir) {
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
