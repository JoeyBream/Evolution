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
