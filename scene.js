import { createAlphaVideo } from './video-alpha.js';

const scene = document.querySelector('.scene');
const video = document.querySelector('.scene-video');
const canvas = document.querySelector('.scene-canvas');
const control = document.querySelector('.motion-control');
const label = control.querySelector('span');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
let failed = false;
let request = 0;
let renderer;
let frameRequest = null;
const videoFrames = typeof video.requestVideoFrameCallback === 'function';

function updateControl() {
  const paused = video.paused;
  control.classList.toggle('is-paused', paused);
  control.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  label.textContent = paused ? 'Play' : 'Pause';
}

function stopFrames() {
  if (frameRequest === null) return;
  if (videoFrames) video.cancelVideoFrameCallback(frameRequest);
  else cancelAnimationFrame(frameRequest);
  frameRequest = null;
}

function usePoster() {
  failed = true;
  stopFrames();
  video.pause();
  renderer?.dispose();
  renderer = undefined;
  scene.classList.remove('has-video');
  control.hidden = true;
}

function drawFrame() {
  frameRequest = null;
  if (failed || reducedMotion.matches || document.hidden) return;
  try {
    if (renderer.draw()) scene.classList.add('has-video');
  } catch {
    usePoster();
    return;
  }
  if (!video.paused) {
    frameRequest = videoFrames
      ? video.requestVideoFrameCallback(drawFrame)
      : requestAnimationFrame(drawFrame);
  }
}

async function syncPlayback() {
  const currentRequest = ++request;
  control.hidden = reducedMotion.matches || failed;
  if (reducedMotion.matches || failed) {
    stopFrames();
    video.pause();
    scene.classList.remove('has-video');
    updateControl();
    return;
  }
  if (userPaused || document.hidden) {
    video.pause();
    updateControl();
    return;
  }
  if (!renderer) {
    try { renderer = createAlphaVideo(canvas, video); }
    catch { usePoster(); return; }
  }
  if (!video.getAttribute('src')) video.src = video.dataset.src;
  try {
    await video.play();
    if (currentRequest !== request) return;
    if (userPaused || document.hidden || reducedMotion.matches) video.pause();
  } catch (error) {
    if (currentRequest !== request || error.name === 'AbortError') return;
    // Autoplay can require a click. Leave the transparent static garden visible.
    updateControl();
  }
}

control.addEventListener('click', () => {
  userPaused = !video.paused;
  syncPlayback();
});
video.addEventListener('playing', () => { stopFrames(); drawFrame(); updateControl(); });
video.addEventListener('pause', () => { stopFrames(); updateControl(); });
video.addEventListener('error', usePoster);
canvas.addEventListener('webglcontextlost', usePoster);
reducedMotion.addEventListener('change', syncPlayback);
document.addEventListener('visibilitychange', syncPlayback);
syncPlayback();
