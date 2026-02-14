import { SpatialHash } from './spatial-hash.js';
import { TRUNK_WIDTH, TRUNK_HEIGHT } from './renderer.js';

/**
 * Calculates circular hue distance (0-180).
 */
export function hueDistance(h1, h2) {
  const d = Math.abs(h1 - h2);
  return d > 180 ? 360 - d : d;
}

/**
 * Creates and manages the simulation state.
 */
export class Simulation {
  /**
   * @param {Array} marbles - array of marble objects
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @param {object} config - { tolerance, driftRate, reachDistance, maxActiveTips }
   */
  constructor(marbles, canvasWidth, canvasHeight, config = {}) {
    this.marbles = marbles;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.tolerance = config.tolerance ?? 30;        // hue degrees
    this.driftRate = config.driftRate ?? 2;          // max hue change per tick
    this.reachDistance = config.reachDistance ?? 50;  // px from tip edge to marble edge
    this.maxActiveTips = config.maxActiveTips ?? 10;

    this.targetHue = config.startHue ?? Math.random() * 360;
    this.activeTips = [];  // indices into marbles array
    this.tickCount = 0;

    // Build spatial hash
    this.hash = new SpatialHash(this.reachDistance, canvasWidth, canvasHeight);
    marbles.forEach(m => this.hash.insert(m));

    // Seed initial root tips at trunk base
    this._seedRoots();
  }

  _seedRoots() {
    const trunkLeft = (this.canvasWidth - TRUNK_WIDTH) / 2;
    const trunkRight = trunkLeft + TRUNK_WIDTH;
    const trunkBottom = TRUNK_HEIGHT;

    // Find marbles near the trunk base
    const candidates = this.hash.query(
      this.canvasWidth / 2,
      trunkBottom + 30,
      TRUNK_WIDTH
    );

    // Pick the closest few that are below the trunk
    const below = candidates
      .filter(m => m.y > trunkBottom && m.x > trunkLeft - 20 && m.x < trunkRight + 20)
      .sort((a, b) => a.y - b.y)
      .slice(0, 4);

    for (const m of below) {
      m.consumed = true;
      m.parentIndex = -1; // root origin
      this.activeTips.push(m.id);
    }
  }

  /**
   * Advance the simulation by one tick.
   * @returns {boolean} true if any growth happened
   */
  tick() {
    this.tickCount++;

    // Drift target hue
    this.targetHue += (Math.random() - 0.5) * 2 * this.driftRate;
    if (this.targetHue < 0) this.targetHue += 360;
    if (this.targetHue >= 360) this.targetHue -= 360;

    let grew = false;
    const newTips = [];

    for (const tipId of this.activeTips) {
      const tip = this.marbles[tipId];

      // Query nearby unconsumed marbles
      const nearby = this.hash.query(tip.x, tip.y, tip.radius + this.reachDistance);
      const candidates = nearby.filter(m => !m.consumed && m.id !== tipId);

      // Score each candidate: prefer downward + color match
      let bestScore = -Infinity;
      let bestCandidate = null;

      for (const candidate of candidates) {
        const dx = candidate.x - tip.x;
        const dy = candidate.y - tip.y;
        const centerDist = Math.sqrt(dx * dx + dy * dy);
        const edgeDist = centerDist - tip.radius - candidate.radius;

        if (edgeDist > this.reachDistance) continue;
        if (hueDistance(candidate.hue, this.targetHue) > this.tolerance) continue;

        // Score by downwardness: sin(angle) ranges -1 (up) to 1 (down)
        const angle = Math.atan2(dy, dx);
        const score = Math.sin(angle);

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        bestCandidate.consumed = true;
        bestCandidate.parentIndex = tipId;
        newTips.push(bestCandidate.id);
        grew = true;
      }
    }

    // Update active tips: new tips take priority, keep most recent up to max
    this.activeTips = [...newTips, ...this.activeTips].slice(0, this.maxActiveTips);

    return grew;
  }

  /** Get current state for rendering. */
  getState() {
    return {
      marbles: this.marbles,
      targetHue: this.targetHue,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
    };
  }

  /** Update config values (from sliders). */
  updateConfig(config) {
    if (config.tolerance !== undefined) this.tolerance = config.tolerance;
    if (config.driftRate !== undefined) this.driftRate = config.driftRate;
  }
}
