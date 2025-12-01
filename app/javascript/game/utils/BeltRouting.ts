/**
 * Advanced orthogonal routing for belts with 90° entry/exit requirement.
 * Belts must enter and exit connection points perpendicular to the surface.
 * Includes obstacle avoidance to prevent belts from going through machines.
 */

export interface Point {
    x: number;
    y: number;
}

export interface Direction {
    x: number;  // -1, 0, or 1
    y: number;  // -1, 0, or 1
}

export interface Obstacle {
    x: number;      // Top-left corner
    y: number;      // Top-left corner
    width: number;
    height: number;
}

/**
 * Check if a line segment intersects with any obstacle
 */
function segmentIntersectsObstacles(
    x1: number, y1: number,
    x2: number, y2: number,
    obstacles: Obstacle[],
    padding: number = 5
): boolean {
    for (const obs of obstacles) {
        // Expand obstacle bounds by padding
        const left = obs.x - padding;
        const right = obs.x + obs.width + padding;
        const top = obs.y - padding;
        const bottom = obs.y + obs.height + padding;

        // Check if segment intersects with expanded obstacle rectangle
        if (lineIntersectsRect(x1, y1, x2, y2, left, top, right, bottom)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a line segment intersects with a rectangle
 */
function lineIntersectsRect(
    x1: number, y1: number,
    x2: number, y2: number,
    left: number, top: number,
    right: number, bottom: number
): boolean {
    // Check if either endpoint is inside the rectangle
    if ((x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) ||
        (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom)) {
        return true;
    }

    // Check if line intersects any of the four edges of the rectangle
    return (
        lineSegmentsIntersect(x1, y1, x2, y2, left, top, right, top) ||     // Top edge
        lineSegmentsIntersect(x1, y1, x2, y2, right, top, right, bottom) || // Right edge
        lineSegmentsIntersect(x1, y1, x2, y2, left, bottom, right, bottom) || // Bottom edge
        lineSegmentsIntersect(x1, y1, x2, y2, left, top, left, bottom)      // Left edge
    );
}

/**
 * Check if two line segments intersect
 */
function lineSegmentsIntersect(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false; // Parallel lines

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Check if a path (series of line segments) is clear of obstacles
 */
function isPathClear(path: Point[], obstacles: Obstacle[]): boolean {
    for (let i = 1; i < path.length; i++) {
        const p1 = path[i - 1];
        const p2 = path[i];
        if (segmentIntersectsObstacles(p1.x, p1.y, p2.x, p2.y, obstacles)) {
            return false;
        }
    }
    return true;
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
 * @param obstacles - List of obstacles to avoid
 */
export function generate90DegPath(
    start: Point,
    end: Point,
    startDir: Direction,
    endDir: Direction,
    minStraight: number = 40,
    obstacles: Obstacle[] = []
): Point[] {
    // Try different clearance distances to find a path that avoids obstacles
    const clearanceAttempts = [40, 60, 80, 100, 120, 160];

    for (const clearance of clearanceAttempts) {
        const path: Point[] = [];

        // Start point
        path.push({ x: start.x, y: start.y });

        // Exit point: go straight out from start in startDir
        const exitPoint = {
            x: start.x + startDir.x * clearance,
            y: start.y + startDir.y * clearance
        };
        path.push(exitPoint);

        // Entry point: go straight into end from endDir
        // Note: endDir points INTO the connection, so we go opposite direction
        const entryPoint = {
            x: end.x - endDir.x * clearance,
            y: end.y - endDir.y * clearance
        };

        // Now route between exitPoint and entryPoint
        // We need to maintain the direction we're traveling
        const midPath = routeBetweenPoints(exitPoint, entryPoint, startDir, endDir, obstacles);
        path.push(...midPath);

        // Final entry into the end point
        path.push({ x: end.x, y: end.y });

        // Check if this path is clear of obstacles
        if (isPathClear(path, obstacles)) {
            return path;
        }
    }

    // If no clear path found, return the last attempt (with longest clearance)
    // This shouldn't happen often but provides fallback
    const path: Point[] = [];
    const clearance = clearanceAttempts[clearanceAttempts.length - 1];

    path.push({ x: start.x, y: start.y });
    const exitPoint = {
        x: start.x + startDir.x * clearance,
        y: start.y + startDir.y * clearance
    };
    path.push(exitPoint);

    const entryPoint = {
        x: end.x - endDir.x * clearance,
        y: end.y - endDir.y * clearance
    };

    const midPath = routeBetweenPoints(exitPoint, entryPoint, startDir, endDir, obstacles);
    path.push(...midPath);
    path.push({ x: end.x, y: end.y });

    return path;
}

/**
 * Route between two points, starting in startDir and ending ready to go in endDir.
 * Creates intermediate waypoints as needed.
 * Handles U-turns by routing perpendicular first to avoid doubling back.
 * Tries multiple routing strategies to find one that avoids obstacles.
 */
function routeBetweenPoints(
    from: Point,
    to: Point,
    fromDir: Direction,
    toDir: Direction,
    obstacles: Obstacle[] = []
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
        // U-turn or reversal detected - try both perpendicular directions
        const clearanceDistances = [80, 120, 160, 200];
        const candidates: Point[][] = [];

        if (isFromHorizontal) {
            // Try going up and down
            for (const clearance of clearanceDistances) {
                for (const dir of [1, -1]) {
                    const midY = from.y + (clearance * dir);
                    const candidate: Point[] = [];
                    candidate.push({ x: from.x, y: midY });
                    candidate.push({ x: to.x, y: midY });
                    if (Math.abs(midY - to.y) > 5) {
                        candidate.push({ x: to.x, y: to.y });
                    }
                    candidates.push(candidate);
                }
            }
        } else {
            // Try going left and right
            for (const clearance of clearanceDistances) {
                for (const dir of [1, -1]) {
                    const midX = from.x + (clearance * dir);
                    const candidate: Point[] = [];
                    candidate.push({ x: midX, y: from.y });
                    candidate.push({ x: midX, y: to.y });
                    if (Math.abs(midX - to.x) > 5) {
                        candidate.push({ x: to.x, y: to.y });
                    }
                    candidates.push(candidate);
                }
            }
        }

        // Find first clear path
        for (const candidate of candidates) {
            const testPath = [from, ...candidate];
            if (isPathClear(testPath, obstacles)) {
                return candidate;
            }
        }

        // If no clear path, return the first attempt
        path.push(...candidates[0]);
    } else if (isFromHorizontal === isToHorizontal) {
        // Same orientation (but not U-turn) - try different midpoint positions
        const candidates: Point[][] = [];

        if (isFromHorizontal) {
            // Both horizontal: go horizontal, vertical, horizontal
            // Try different horizontal splits
            const splits = [dx / 2, dx * 0.3, dx * 0.7, dx * 0.4, dx * 0.6];
            for (const split of splits) {
                const midX = from.x + split;
                const candidate: Point[] = [];
                candidate.push({ x: midX, y: from.y });
                candidate.push({ x: midX, y: to.y });
                candidates.push(candidate);
            }
        } else {
            // Both vertical: go vertical, horizontal, vertical
            // Try different vertical splits
            const splits = [dy / 2, dy * 0.3, dy * 0.7, dy * 0.4, dy * 0.6];
            for (const split of splits) {
                const midY = from.y + split;
                const candidate: Point[] = [];
                candidate.push({ x: from.x, y: midY });
                candidate.push({ x: to.x, y: midY });
                candidates.push(candidate);
            }
        }

        // Find first clear path
        for (const candidate of candidates) {
            const testPath = [from, ...candidate];
            if (isPathClear(testPath, obstacles)) {
                return candidate;
            }
        }

        // If no clear path, return the first attempt
        path.push(...candidates[0]);
    } else {
        // Different orientation - need 1 turn
        // Try both corner options
        const option1: Point[] = [{ x: to.x, y: from.y }];
        const option2: Point[] = [{ x: from.x, y: to.y }];

        if (isFromHorizontal) {
            // Prefer going horizontal first (matches fromDir)
            if (isPathClear([from, ...option1], obstacles)) {
                path.push(...option1);
            } else if (isPathClear([from, ...option2], obstacles)) {
                path.push(...option2);
            } else {
                path.push(...option1); // Default
            }
        } else {
            // Prefer going vertical first (matches fromDir)
            if (isPathClear([from, ...option2], obstacles)) {
                path.push(...option2);
            } else if (isPathClear([from, ...option1], obstacles)) {
                path.push(...option1);
            } else {
                path.push(...option2); // Default
            }
        }
    }

    return path;
}

/**
 * Automatically choose best routing strategy based on positions and directions.
 * Enforces 90° entry/exit angles and avoids obstacles.
 */
export function generateSmartPath(
    start: Point,
    end: Point,
    startDirection?: Direction,
    endDirection?: Direction,
    obstacles: Obstacle[] = []
): Point[] {
    // Check if we have valid direction info (non-zero vectors)
    const hasValidStartDir = startDirection && (startDirection.x !== 0 || startDirection.y !== 0);
    const hasValidEndDir = endDirection && (endDirection.x !== 0 || endDirection.y !== 0);

    // If we have valid direction info, use the 90° routing with obstacle avoidance
    if (hasValidStartDir && hasValidEndDir) {
        return generate90DegPath(start, end, startDirection, endDirection, 40, obstacles);
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
