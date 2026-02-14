/**
 * Generates marble positions via Bridson's Poisson Disk Sampling,
 * then assigns random radii and HSB colors.
 */

/**
 * Bridson's algorithm. Returns array of {x, y} points.
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @param {number} minDist - minimum distance between points
 * @param {number} k - candidates per iteration (default 30)
 */
export function poissonDiskSample(width, height, minDist, k = 30) {
  const cellSize = minDist / Math.SQRT2;
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);
  const grid = new Array(gridW * gridH).fill(-1);
  const points = [];
  const active = [];

  function gridIndex(x, y) {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return row * gridW + col;
  }

  function addPoint(x, y) {
    const i = points.length;
    points.push({ x, y });
    active.push(i);
    grid[gridIndex(x, y)] = i;
  }

  function isValid(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const searchRadius = 2;
    for (let dr = -searchRadius; dr <= searchRadius; dr++) {
      for (let dc = -searchRadius; dc <= searchRadius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= gridH || c < 0 || c >= gridW) continue;
        const idx = grid[r * gridW + c];
        if (idx === -1) continue;
        const dx = points[idx].x - x;
        const dy = points[idx].y - y;
        if (dx * dx + dy * dy < minDist * minDist) return false;
      }
    }
    return true;
  }

  // Seed with a random first point
  addPoint(Math.random() * width, Math.random() * height);

  while (active.length > 0) {
    const randIdx = Math.floor(Math.random() * active.length);
    const parent = points[active[randIdx]];
    let found = false;
    for (let attempt = 0; attempt < k; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist + Math.random() * minDist;
      const nx = parent.x + Math.cos(angle) * dist;
      const ny = parent.y + Math.sin(angle) * dist;
      if (isValid(nx, ny)) {
        addPoint(nx, ny);
        found = true;
        break;
      }
    }
    if (!found) {
      active.splice(randIdx, 1);
    }
  }

  return points;
}

/**
 * Generate marbles with positions, radii, and colors.
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @returns {Array<{x, y, radius, hue, saturation, brightness, consumed, parentIndex}>}
 */
export function generateMarbles(width, height, centerHue = null) {
  const minDist = 10;
  const hueCenter = centerHue ?? Math.random() * 360;
  const hueRange = 40; // +/- 40 degrees from center
  const points = poissonDiskSample(width, height, minDist);

  return points.map((p, i) => {
    let hue = hueCenter + (Math.random() - 0.5) * 2 * hueRange;
    if (hue < 0) hue += 360;
    if (hue >= 360) hue -= 360;
    return {
      id: i,
      x: p.x,
      y: p.y,
      radius: 2 + Math.random() * 5,    // 2-7px
      hue,
      saturation: 70 + Math.random() * 20, // 70-90%
      brightness: 55 + Math.random() * 15, // 55-70%
      consumed: false,
      parentIndex: -1,
    };
  });
}
