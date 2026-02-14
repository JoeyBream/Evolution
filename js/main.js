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

let resizeTimeout;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    sim = createSimulation();
  }, 300);
}

function createSimulation() {
  const startHue = 240 + Math.random() * 60; // dark blue (240) to dark pink (300)
  const marbles = generateMarbles(canvas.width, canvas.height, startHue);
  return new Simulation(marbles, canvas.width, canvas.height, { startHue });
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

requestAnimationFrame(loop);
