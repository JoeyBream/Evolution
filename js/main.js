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
