# Evolution Art Maker - Design Document

## Concept

A generative art piece where tree roots grow downward through a field of colored marbles. Roots can only consume marbles whose color matches a slowly drifting target — an analogy for evolution, where organisms thrive only when adapted to their changing environment.

Designed to run as a website background or standalone art piece.

## Technology

- Raw Canvas 2D API (no dependencies)
- Vanilla JS, modular file structure
- Lightweight enough for a site background

## Layout

- **Canvas:** Full-window, `position: fixed`, `z-index: -1`. Resizes with window.
- **Marble field:** Randomly distributed circles filling the canvas. Varying radii (5-25px) and colors (full HSB spectrum). Placed via Poisson Disk Sampling (Bridson's algorithm). Natural gaps between marbles.
- **Tree trunk:** Brown shape centered at the top edge, roots emerge downward.
- **Target indicator:** Top-right corner, small color swatch showing current target hue, visibly morphing.
- **Controls overlay:** Sliders + buttons, hideable for site background use.

## Simulation Mechanics

### Initialization

1. Run Poisson Disk Sampling to place points across the canvas.
2. Assign each point a random radius (5-25px) and random HSB color.
3. Create 3-5 initial root segments along the trunk's bottom edge.

### Target Color

- Stored as HSB hue (0-360).
- Drifts via random walk each tick (+/- small delta).
- Drift rate adjustable via slider.

### Growth Tick (Core Loop)

1. Maintain **active tips** — the 5 most recently consumed marbles across all branches.
2. For each active tip, find unconsumed marbles within reach distance (touching or nearly touching), using a spatial hash for efficiency.
3. For each candidate, calculate hue distance from current target.
4. If within tolerance threshold, consume the marble — it becomes a root segment linked to its parent tip.
5. Multiple tips consuming in the same tick creates branching.
6. Update active tips list (keep 5 most recent).
7. If no tips can grow, pause and wait for target drift to create new matches.

### Rendering

- Unconsumed marbles: drawn in original colors.
- Consumed marbles: transition to root-brown.
- Root tendrils: line segments connecting consumed marbles to their parents.
- Trunk at top, target swatch top-right.

## Controls

| Control | Range | Effect |
|---------|-------|--------|
| Speed | 1-30 ticks/sec | Simulation pace |
| Drift rate | subtle-dramatic | How fast target hue wanders |
| Tolerance | tight-loose | How close a marble's color must be to match |
| Play/Pause | toggle | Start/stop simulation |
| Reset | button | Regenerate marbles and restart |

## Site Background Integration

- Controls hidden by default, toggled via gear icon or hidden entirely.
- Parameters configurable via JS config object.
- Public API: `init()`, `play()`, `pause()`, `reset()`.
- Respects `prefers-reduced-motion` (show static state).
- Pauses on tab hidden (`visibilitychange`).
- Capped frame rate (15-30fps).

## File Structure

```
index.html          — standalone demo page with controls
css/style.css       — styling for controls overlay
js/marbles.js       — marble generation (Poisson Disk Sampling)
js/simulation.js    — growth logic, tick loop, target drift
js/renderer.js      — canvas drawing
js/controls.js      — slider/button wiring
js/main.js          — init, config, public API
```
