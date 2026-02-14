import { generateMarbles } from './marbles.js';
import { SpatialHash } from './spatial-hash.js';

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

const hash = new SpatialHash(50, canvas.width, canvas.height);
marbles.forEach(m => hash.insert(m));

const center = marbles[0];
const neighbors = hash.query(center.x, center.y, 60);
console.log(`Marble at (${center.x.toFixed(0)}, ${center.y.toFixed(0)}) has ${neighbors.length} neighbors within 60px`);

marbles.forEach(m => {
  ctx.fillStyle = `hsl(${m.hue}, ${m.saturation}%, ${m.brightness}%)`;
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
  ctx.fill();
});
