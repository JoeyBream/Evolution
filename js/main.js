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
