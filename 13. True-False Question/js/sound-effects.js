let audioCtx;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

export function playHoverSound() {
  initAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 800;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.1);
}

export function playClickSound() {
  initAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 1000;
  osc.type = "square";
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.05);
}

export function playSuccessSound() {
  const audio = new Audio("content/sounds/correct-6033.mp3");
  audio.play().catch((e) => console.warn("Cannot play success sound", e));
}

export function playErrorSound() {
  const audio = new Audio("content/sounds/amthanhsai2.mp3");
  audio.play().catch((e) => console.warn("Cannot play error sound", e));
}
