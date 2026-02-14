import { generateMarbles } from './marbles.js';
import { render } from './renderer.js';
import { Simulation } from './simulation.js';

const canvas = document.getElementById('evolution-canvas');
const ctx = canvas.getContext('2d');

let sim;
let playing = true;
let speed = 10; // ticks per second
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

window.addEventListener('resize', resize);
resize();
sim = createSimulation();
requestAnimationFrame(loop);
