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
  const toggleBtn = document.getElementById('controls-toggle');
  const controlsBody = document.getElementById('controls-body');

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
    playPauseBtn.textContent = playing ? 'pause' : 'play';
    callbacks.onPlayPause(playing);
  });

  resetBtn.addEventListener('click', () => {
    playing = true;
    playPauseBtn.textContent = 'pause';
    callbacks.onReset();
  });

  // Collapsible panel
  toggleBtn.addEventListener('click', () => {
    controlsBody.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
  });
}
