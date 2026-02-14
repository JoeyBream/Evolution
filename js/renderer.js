/**
 * Handles all canvas drawing: marbles, trunk, roots, target indicator.
 */

const TRUNK_WIDTH = 80;
const TRUNK_HEIGHT = 70;
const ROOT_LINE_WIDTH = 1.5;
const BG_COLOR = '#faf8f4';

/**
 * Clear and redraw the full scene.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state - { marbles, targetHue, canvasWidth, canvasHeight }
 */
export function render(ctx, state) {
  const { marbles, targetHue, canvasWidth, canvasHeight } = state;

  // Fill with warm background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw unconsumed marbles (pale / low opacity)
  ctx.globalAlpha = 0.15;
  for (const m of marbles) {
    if (m.consumed) continue;
    ctx.fillStyle = `hsl(${m.hue}, ${m.saturation}%, ${m.brightness}%)`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Draw root connections (lines between consumed marble and its parent)
  for (const m of marbles) {
    if (!m.consumed || m.parentIndex === -1) continue;
    const parent = marbles[m.parentIndex];
    ctx.strokeStyle = `hsla(${m.hue}, ${m.saturation}%, ${Math.min(m.brightness + 10, 80)}%, 0.6)`;
    ctx.lineWidth = ROOT_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(parent.x, parent.y);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
  }

  // Draw consumed marbles at full opacity in their original color
  for (const m of marbles) {
    if (!m.consumed) continue;
    ctx.fillStyle = `hsl(${m.hue}, ${m.saturation}%, ${m.brightness}%)`;
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
  const cx = canvasWidth / 2;

  // Organic trunk shape using bezier curves
  ctx.fillStyle = '#8b6b4a';
  ctx.beginPath();
  ctx.moveTo(cx - TRUNK_WIDTH / 2, 0);
  ctx.lineTo(cx + TRUNK_WIDTH / 2, 0);
  ctx.bezierCurveTo(
    cx + TRUNK_WIDTH / 2 - 5, TRUNK_HEIGHT * 0.4,
    cx + TRUNK_WIDTH / 3, TRUNK_HEIGHT * 0.7,
    cx + TRUNK_WIDTH / 4, TRUNK_HEIGHT
  );
  ctx.bezierCurveTo(
    cx + 8, TRUNK_HEIGHT + 12,
    cx - 8, TRUNK_HEIGHT + 12,
    cx - TRUNK_WIDTH / 4, TRUNK_HEIGHT
  );
  ctx.bezierCurveTo(
    cx - TRUNK_WIDTH / 3, TRUNK_HEIGHT * 0.7,
    cx - TRUNK_WIDTH / 2 + 5, TRUNK_HEIGHT * 0.4,
    cx - TRUNK_WIDTH / 2, 0
  );
  ctx.closePath();
  ctx.fill();

  // Subtle bark lines
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.15)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) {
    const offset = -15 + i * 7;
    ctx.beginPath();
    ctx.moveTo(cx + offset, 0);
    ctx.bezierCurveTo(
      cx + offset - 2, TRUNK_HEIGHT * 0.35,
      cx + offset * 0.5, TRUNK_HEIGHT * 0.65,
      cx + offset * 0.3, TRUNK_HEIGHT
    );
    ctx.stroke();
  }
}

function drawTargetIndicator(ctx, hue, canvasWidth) {
  const x = canvasWidth - 44;
  const y = 36;
  const radius = 14;

  // Soft outer glow
  ctx.shadowColor = `hsla(${hue}, 60%, 60%, 0.3)`;
  ctx.shadowBlur = 12;

  // Color fill
  ctx.fillStyle = `hsl(${hue}, 75%, 62%)`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Thin border ring
  ctx.strokeStyle = `hsla(${hue}, 40%, 50%, 0.3)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(120, 100, 80, 0.4)';
  ctx.font = '300 9px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('target', x, y + radius + 14);
}

export { TRUNK_WIDTH, TRUNK_HEIGHT };
