# Evolution Art Maker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a generative art piece where tree roots grow through colored marbles based on a drifting target color, running as a Canvas 2D web app suitable for use as a site background.

**Architecture:** Modular vanilla JS — marble generation, simulation logic, rendering, and controls are separate modules. A spatial hash provides efficient neighbor lookups. The main module exposes a public API for site integration. No dependencies.

**Tech Stack:** HTML5 Canvas 2D, vanilla JavaScript (ES modules), CSS for controls overlay.

---

### Task 1: Project Scaffold & Canvas Setup

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js`

**Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evolution Art</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <canvas id="evolution-canvas"></canvas>
  <div id="controls"></div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

**Step 2: Create `css/style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body { overflow: hidden; background: #1a1a1a; }

#evolution-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

#controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  padding: 16px;
  border-radius: 8px;
  color: #fff;
  font-family: system-ui, sans-serif;
  font-size: 13px;
  min-width: 220px;
}
```

**Step 3: Create `js/main.js`**

```js
const canvas = document.getElementById('evolution-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Draw a test circle to verify canvas works
ctx.fillStyle = '#4a9';
ctx.beginPath();
ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
ctx.fill();
```

**Step 4: Verify in browser**

Open `index.html` in a browser. Expect: dark background, green circle centered on screen, controls panel in bottom-right corner (empty but visible).

**Step 5: Commit**

```bash
git add index.html css/style.css js/main.js
git commit -m "feat: project scaffold with canvas and controls shell"
```

---

### Task 2: Poisson Disk Sampling — Marble Generation

**Files:**
- Create: `js/marbles.js`

**Reference:** Bridson's algorithm — https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf

The algorithm: maintain a grid of cells (cell size = minDist/sqrt(2)). For each active sample, generate up to `k` candidates in the annulus between `minDist` and `2*minDist`. Accept if no existing sample is within `minDist`. Reject after `k` failures.

**Step 1: Create `js/marbles.js` with Poisson Disk Sampling**

```js
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
export function generateMarbles(width, height) {
  const minDist = 35;
  const points = poissonDiskSample(width, height, minDist);

  return points.map((p, i) => ({
    id: i,
    x: p.x,
    y: p.y,
    radius: 5 + Math.random() * 20,   // 5-25px
    hue: Math.random() * 360,
    saturation: 60 + Math.random() * 40, // 60-100%
    brightness: 50 + Math.random() * 40, // 50-90%
    consumed: false,
    parentIndex: -1,
  }));
}
```

**Step 2: Verify marble generation visually**

Update `js/main.js` temporarily to import and render marbles:

```js
import { generateMarbles } from './marbles.js';

const canvas = document.getElementById('evolution-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

const marbles = generateMarbles(canvas.width, canvas.height);
console.log(`Generated ${marbles.length} marbles`);

marbles.forEach(m => {
  ctx.fillStyle = `hsl(${m.hue}, ${m.saturation}%, ${m.brightness}%)`;
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
  ctx.fill();
});
```

Open in browser. Expect: hundreds of colorful circles distributed across the screen with natural spacing. No overlapping (centers are spaced, though circles with large radii may overlap visually — this is fine and looks organic).

**Step 3: Commit**

```bash
git add js/marbles.js js/main.js
git commit -m "feat: Poisson Disk Sampling marble generation"
```

---

### Task 3: Spatial Hash for Neighbor Lookups

**Files:**
- Create: `js/spatial-hash.js`

The simulation needs to efficiently find marbles near active root tips. A spatial hash divides the canvas into cells and indexes marbles by cell, so lookups are O(1) per cell rather than O(n) scanning all marbles.

**Step 1: Create `js/spatial-hash.js`**

```js
/**
 * Spatial hash for efficient neighbor queries.
 * Divides space into cells and indexes items by cell.
 */
export class SpatialHash {
  /**
   * @param {number} cellSize - size of each grid cell
   * @param {number} width - total width
   * @param {number} height - total height
   */
  constructor(cellSize, width, height) {
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = new Map();
  }

  _key(col, row) {
    return row * this.cols + col;
  }

  _cellCoords(x, y) {
    return {
      col: Math.floor(x / this.cellSize),
      row: Math.floor(y / this.cellSize),
    };
  }

  /**
   * Insert an item with position (x, y).
   * @param {object} item - must have .x and .y properties
   */
  insert(item) {
    const { col, row } = this._cellCoords(item.x, item.y);
    const key = this._key(col, row);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push(item);
  }

  /**
   * Find all items within `radius` of (x, y).
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @returns {Array<object>}
   */
  query(x, y, radius) {
    const results = [];
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);
    const r2 = radius * radius;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) continue;
        const cell = this.cells.get(this._key(col, row));
        if (!cell) continue;
        for (const item of cell) {
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= r2) {
            results.push(item);
          }
        }
      }
    }
    return results;
  }
}
```

**Step 2: Quick console test**

Add to `js/main.js` temporarily after marble generation:

```js
import { SpatialHash } from './spatial-hash.js';

// After generating marbles:
const hash = new SpatialHash(50, canvas.width, canvas.height);
marbles.forEach(m => hash.insert(m));

const center = marbles[0];
const neighbors = hash.query(center.x, center.y, 60);
console.log(`Marble at (${center.x.toFixed(0)}, ${center.y.toFixed(0)}) has ${neighbors.length} neighbors within 60px`);
```

Expect: console log showing a small number of neighbors (typically 2-8). Should not be 0 (too sparse) or hundreds (broken).

**Step 3: Commit**

```bash
git add js/spatial-hash.js js/main.js
git commit -m "feat: spatial hash for efficient neighbor lookups"
```

---

### Task 4: Renderer Module

**Files:**
- Create: `js/renderer.js`

Extract all drawing logic into a dedicated renderer.

**Step 1: Create `js/renderer.js`**

```js
/**
 * Handles all canvas drawing: marbles, trunk, roots, target indicator.
 */

const TRUNK_WIDTH = 80;
const TRUNK_HEIGHT = 60;
const ROOT_COLOR = '#5a3a1a';
const ROOT_LINE_WIDTH = 2;

/**
 * Clear and redraw the full scene.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state - { marbles, targetHue, canvasWidth, canvasHeight }
 */
export function render(ctx, state) {
  const { marbles, targetHue, canvasWidth, canvasHeight } = state;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw unconsumed marbles
  for (const m of marbles) {
    if (m.consumed) continue;
    ctx.fillStyle = `hsl(${m.hue}, ${m.saturation}%, ${m.brightness}%)`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw root connections (lines between consumed marble and its parent)
  ctx.strokeStyle = ROOT_COLOR;
  ctx.lineWidth = ROOT_LINE_WIDTH;
  for (const m of marbles) {
    if (!m.consumed || m.parentIndex === -1) continue;
    const parent = marbles[m.parentIndex];
    ctx.beginPath();
    ctx.moveTo(parent.x, parent.y);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
  }

  // Draw consumed marbles (on top of lines)
  for (const m of marbles) {
    if (!m.consumed) continue;
    ctx.fillStyle = ROOT_COLOR;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw trunk
  drawTrunk(ctx, canvasWidth);

  // Draw target indicator
  drawTargetIndicator(ctx, targetHue, canvasWidth);
}

function drawTrunk(ctx, canvasWidth) {
  const x = (canvasWidth - TRUNK_WIDTH) / 2;
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x, 0, TRUNK_WIDTH, TRUNK_HEIGHT);

  // Bark texture lines
  ctx.strokeStyle = '#4a2e15';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const lx = x + 10 + i * 15;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx + 3, TRUNK_HEIGHT);
    ctx.stroke();
  }
}

function drawTargetIndicator(ctx, hue, canvasWidth) {
  const x = canvasWidth - 50;
  const y = 30;
  const radius = 18;

  // Outer ring
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Color fill
  ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('target', x, y + radius + 16);
}

export { TRUNK_WIDTH, TRUNK_HEIGHT };
```

**Step 2: Wire renderer into `js/main.js`**

```js
import { generateMarbles } from './marbles.js';
import { SpatialHash } from './spatial-hash.js';
import { render } from './renderer.js';

const canvas = document.getElementById('evolution-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

const marbles = generateMarbles(canvas.width, canvas.height);
const hash = new SpatialHash(50, canvas.width, canvas.height);
marbles.forEach(m => hash.insert(m));

// Mark a few marbles as consumed for visual testing
marbles[0].consumed = true;
if (marbles.length > 1) {
  marbles[1].consumed = true;
  marbles[1].parentIndex = 0;
}

render(ctx, {
  marbles,
  targetHue: 180,
  canvasWidth: canvas.width,
  canvasHeight: canvas.height,
});
```

**Step 3: Verify in browser**

Open in browser. Expect: colorful marble field, brown trunk at top center, a couple of brown consumed marbles with a line connecting them, blue-ish target indicator top-right with "target" label.

**Step 4: Commit**

```bash
git add js/renderer.js js/main.js
git commit -m "feat: renderer module for marbles, trunk, roots, and target"
```

---

### Task 5: Simulation Core — Growth Logic & Target Drift

**Files:**
- Create: `js/simulation.js`

This is the heart of the project. Handles the target color drift and the growth tick.

**Step 1: Create `js/simulation.js`**

```js
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
    this.reachDistance = config.reachDistance ?? 60;  // px from tip edge to marble edge
    this.maxActiveTips = config.maxActiveTips ?? 5;

    this.targetHue = Math.random() * 360;
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

      for (const candidate of candidates) {
        // Check edge-to-edge distance
        const dx = candidate.x - tip.x;
        const dy = candidate.y - tip.y;
        const centerDist = Math.sqrt(dx * dx + dy * dy);
        const edgeDist = centerDist - tip.radius - candidate.radius;

        if (edgeDist > this.reachDistance) continue;

        // Check color match
        if (hueDistance(candidate.hue, this.targetHue) <= this.tolerance) {
          candidate.consumed = true;
          candidate.parentIndex = tipId;
          newTips.push(candidate.id);
          grew = true;
        }
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
```

**Step 2: Wire simulation into `js/main.js`**

```js
import { generateMarbles } from './marbles.js';
import { render } from './renderer.js';
import { Simulation } from './simulation.js';

const canvas = document.getElementById('evolution-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

const marbles = generateMarbles(canvas.width, canvas.height);
const sim = new Simulation(marbles, canvas.width, canvas.height);

let playing = true;
let speed = 10; // ticks per second
let lastTick = 0;

function loop(timestamp) {
  if (playing && timestamp - lastTick > 1000 / speed) {
    sim.tick();
    lastTick = timestamp;
  }
  render(ctx, sim.getState());
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

**Step 3: Verify in browser**

Open in browser. Expect: marble field appears, trunk at top, root tips slowly consume nearby matching marbles. Brown root network grows downward over time. Target indicator shifts color slowly.

**Step 4: Commit**

```bash
git add js/simulation.js js/main.js
git commit -m "feat: simulation core with growth logic and target drift"
```

---

### Task 6: Controls UI

**Files:**
- Create: `js/controls.js`
- Modify: `index.html` — add control markup
- Modify: `css/style.css` — add control styling

**Step 1: Add control markup to `index.html`**

Replace the empty `<div id="controls"></div>` with:

```html
<div id="controls">
  <div class="control-group">
    <label>Speed <span id="speed-val">10</span></label>
    <input type="range" id="speed" min="1" max="30" value="10">
  </div>
  <div class="control-group">
    <label>Drift Rate <span id="drift-val">2</span></label>
    <input type="range" id="drift" min="0.5" max="10" value="2" step="0.5">
  </div>
  <div class="control-group">
    <label>Tolerance <span id="tolerance-val">30</span></label>
    <input type="range" id="tolerance" min="5" max="90" value="30">
  </div>
  <div class="control-buttons">
    <button id="play-pause">Pause</button>
    <button id="reset">Reset</button>
  </div>
</div>
```

**Step 2: Add control styles to `css/style.css`**

Append to the existing file:

```css
.control-group {
  margin-bottom: 10px;
}

.control-group label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.control-group input[type="range"] {
  width: 100%;
  cursor: pointer;
}

.control-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.control-buttons button {
  flex: 1;
  padding: 6px 12px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.control-buttons button:hover {
  background: #444;
}
```

**Step 3: Create `js/controls.js`**

```js
/**
 * Wires up slider/button controls to callbacks.
 */

/**
 * @param {object} callbacks - { onSpeed, onDrift, onTolerance, onPlayPause, onReset }
 */
export function initControls(callbacks) {
  const speedSlider = document.getElementById('speed');
  const driftSlider = document.getElementById('drift');
  const toleranceSlider = document.getElementById('tolerance');
  const playPauseBtn = document.getElementById('play-pause');
  const resetBtn = document.getElementById('reset');

  const speedVal = document.getElementById('speed-val');
  const driftVal = document.getElementById('drift-val');
  const toleranceVal = document.getElementById('tolerance-val');

  speedSlider.addEventListener('input', () => {
    speedVal.textContent = speedSlider.value;
    callbacks.onSpeed(Number(speedSlider.value));
  });

  driftSlider.addEventListener('input', () => {
    driftVal.textContent = driftSlider.value;
    callbacks.onDrift(Number(driftSlider.value));
  });

  toleranceSlider.addEventListener('input', () => {
    toleranceVal.textContent = toleranceSlider.value;
    callbacks.onTolerance(Number(toleranceSlider.value));
  });

  let playing = true;
  playPauseBtn.addEventListener('click', () => {
    playing = !playing;
    playPauseBtn.textContent = playing ? 'Pause' : 'Play';
    callbacks.onPlayPause(playing);
  });

  resetBtn.addEventListener('click', () => {
    playing = true;
    playPauseBtn.textContent = 'Pause';
    callbacks.onReset();
  });
}
```

**Step 4: Wire controls into `js/main.js`**

Update `js/main.js` to its final form:

```js
import { generateMarbles } from './marbles.js';
import { render } from './renderer.js';
import { Simulation } from './simulation.js';
import { initControls } from './controls.js';

const canvas = document.getElementById('evolution-canvas');
const ctx = canvas.getContext('2d');

let sim;
let playing = true;
let speed = 10;
let lastTick = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createSimulation() {
  const marbles = generateMarbles(canvas.width, canvas.height);
  return new Simulation(marbles, canvas.width, canvas.height);
}

function loop(timestamp) {
  if (playing && timestamp - lastTick > 1000 / speed) {
    sim.tick();
    lastTick = timestamp;
  }
  render(ctx, sim.getState());
  requestAnimationFrame(loop);
}

// Lifecycle
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) playing = false;
});

resize();
sim = createSimulation();

initControls({
  onSpeed: (val) => { speed = val; },
  onDrift: (val) => { sim.updateConfig({ driftRate: val }); },
  onTolerance: (val) => { sim.updateConfig({ tolerance: val }); },
  onPlayPause: (val) => { playing = val; },
  onReset: () => {
    sim = createSimulation();
    playing = true;
  },
});

// Respect prefers-reduced-motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  playing = false;
}

requestAnimationFrame(loop);
```

**Step 5: Verify in browser**

Open in browser. Expect: sliders control speed/drift/tolerance in real-time. Play/Pause stops/starts growth. Reset regenerates a fresh marble field. Tab switch pauses simulation.

**Step 6: Commit**

```bash
git add index.html css/style.css js/controls.js js/main.js
git commit -m "feat: controls UI with sliders and play/pause/reset"
```

---

### Task 7: Polish & Site Background API

**Files:**
- Modify: `js/main.js` — add public API, window resize handling
- Modify: `js/renderer.js` — visual polish

**Step 1: Add window resize regeneration to `js/main.js`**

In the resize handler, regenerate the simulation if the size changed significantly (avoids marbles floating outside the canvas). Update the resize function:

```js
let resizeTimeout;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    sim = createSimulation();
  }, 300);
}
```

**Step 2: Expose public API on window**

Add to the end of `js/main.js` before the `requestAnimationFrame` call:

```js
window.EvolutionArt = {
  init: () => { sim = createSimulation(); },
  play: () => { playing = true; },
  pause: () => { playing = false; },
  reset: () => { sim = createSimulation(); playing = true; },
  configure: (config) => {
    if (config.speed) speed = config.speed;
    sim.updateConfig(config);
  },
  hideControls: () => { document.getElementById('controls').style.display = 'none'; },
  showControls: () => { document.getElementById('controls').style.display = 'block'; },
};
```

**Step 3: Add subtle visual improvements to `js/renderer.js`**

Add a slight shadow/glow to consumed marbles for depth. In the consumed marbles drawing section, add:

```js
// Before drawing consumed marbles, add subtle glow
ctx.shadowColor = 'rgba(90, 58, 26, 0.4)';
ctx.shadowBlur = 6;

// Draw consumed marbles
for (const m of marbles) {
  if (!m.consumed) continue;
  ctx.fillStyle = ROOT_COLOR;
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
  ctx.fill();
}

// Reset shadow
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
```

**Step 4: Verify everything**

- Open in browser, let simulation run — roots grow and branch organically
- Adjust sliders — parameters change in real time
- Open console, run `EvolutionArt.hideControls()` — controls disappear
- Run `EvolutionArt.reset()` — fresh marble field
- Resize window — simulation regenerates after debounce

**Step 5: Commit**

```bash
git add js/main.js js/renderer.js
git commit -m "feat: public API for site background integration and visual polish"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Project scaffold, canvas, CSS | `index.html`, `css/style.css`, `js/main.js` |
| 2 | Marble generation (PDS) | `js/marbles.js` |
| 3 | Spatial hash | `js/spatial-hash.js` |
| 4 | Renderer | `js/renderer.js` |
| 5 | Simulation core | `js/simulation.js` |
| 6 | Controls UI | `js/controls.js`, HTML/CSS updates |
| 7 | Polish & public API | `js/main.js`, `js/renderer.js` updates |
