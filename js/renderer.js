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

  // Add subtle glow to consumed marbles
  ctx.shadowColor = 'rgba(90, 58, 26, 0.4)';
  ctx.shadowBlur = 6;

  // Draw consumed marbles (on top of lines)
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
