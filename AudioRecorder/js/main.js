let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioUrl;
let stream;
let timerInterval;
let seconds = 0;

// DOM Elements
const recordBtn = document.getElementById("recordBtn");
const pauseBtn = document.getElementById("pauseBtn");
const continueBtn = document.getElementById("continueBtn");
const doneBtn = document.getElementById("doneBtn");
const retryBtn = document.getElementById("retryBtn");
const downloadBtn = document.getElementById("downloadBtn");
const audioPlayback = document.getElementById("audioPlayback");
const status = document.getElementById("status");
const timer = document.getElementById("timer");
const message = document.getElementById("message");

// Mic Animation Elements
const micWaves = document.querySelectorAll(".mic-waves");
const micIcon = document.querySelector(".mic-icon");

// Modal elements
const modal = document.getElementById("modal");
const modalHeader = document.getElementById("modalHeader");
const modalBody = document.getElementById("modalBody");
const cancelRetry = document.getElementById("cancelRetry");
const confirmRetry = document.getElementById("confirmRetry");

// Load localization content from JSON
fetch('content/content.json')
  .then(response => response.json())
  .then(data => {
    l10n = data.l10n;
    status.textContent = l10n.statusReadyToRecord || "Ready to record";
    status.classList.remove("hidden");
  })
  .catch(err => {
    console.error('Failed to load content.json:', err);
    status.textContent = "Failed to load language settings.";
    status.classList.remove("hidden");
  });

// Timer functions
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Mic animation control
function startMicAnimation() {
  micWaves.forEach(wave => {
    wave.style.animationPlayState = "running";
  });
  micIcon.style.color = "#f72585";
}

function stopMicAnimation() {
  micWaves.forEach(wave => {
    wave.style.animationPlayState = "paused";
  });
  micIcon.style.color = "#4361ee";
}

// Recording functions
async function startRecording() {
  try {
    startMicAnimation();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      let mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      audioBlob = new Blob(audioChunks, { type: mimeType });
      audioUrl = URL.createObjectURL(audioBlob);
      audioPlayback.src = audioUrl;
      audioPlayback.classList.remove("hidden");
      downloadBtn.disabled = false;
      status.textContent = l10n.statusFinishedRecording || "Recording complete";
      status.classList.remove("recording");
      status.classList.add("paused");
      stopMicAnimation();
    };

    mediaRecorder.onpause = () => {
      status.textContent = l10n.statusPaused || "Recording paused";
      status.classList.remove("recording");
      status.classList.add("paused");
      stopMicAnimation();
    };

    mediaRecorder.onresume = () => {
      status.textContent = l10n.statusRecording || "Recording...";
      status.classList.remove("paused");
      status.classList.add("recording");
      startMicAnimation();
    };

    mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
      showMessage(l10n.recordingError || "Recording error occurred", "error");
      resetRecording();
    };

    mediaRecorder.start(1000); // Collect data every second
    startTimer();

    recordBtn.classList.add("hidden");
    
    recordBtn.disabled = true;
    pauseBtn.disabled = false;
    doneBtn.disabled = false;
    retryBtn.disabled = false;
    
    pauseBtn.classList.remove("hidden");
    doneBtn.classList.remove("hidden");
    retryBtn.classList.remove("hidden");
    
    status.textContent = l10n.statusRecording || "Recording...";
    status.classList.remove("hidden");
    status.classList.remove("paused");
    status.classList.add("recording");
  } catch (err) {
    console.error(err);
    status.textContent = l10n.microphoneInaccessible || "Microphone access denied or not supported";
    status.classList.remove("hidden");
    showMessage(l10n.microphoneInaccessible || "Microphone access denied or not supported", "error");
    stopMicAnimation();
  }
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    pauseTimer();
    pauseBtn.classList.add("hidden");
    continueBtn.classList.remove("hidden");
    stopMicAnimation();
  }
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    startTimer();
    continueBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden");
    startMicAnimation();
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
    pauseTimer();
    stopMicAnimation();
    
    // Update UI
    pauseBtn.classList.add("hidden");
    continueBtn.classList.add("hidden");
    doneBtn.classList.add("hidden");
    downloadBtn.classList.remove("hidden");
    
    recordBtn.disabled = false;

    document.getElementById("afterDoneText").classList.remove("hidden");
  }
}

function resetRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
  }
  
  resetTimer();
  stopMicAnimation();
  audioChunks = [];
  audioPlayback.src = "";
  audioPlayback.classList.add("hidden");
  
  // Reset UI
  recordBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  continueBtn.classList.add("hidden");
  doneBtn.classList.add("hidden");
  retryBtn.classList.add("hidden");
  downloadBtn.classList.add("hidden");
  
  recordBtn.disabled = false;
  status.textContent = l10n.statusReadyToRecord || "Ready to record";
  status.classList.remove("recording");
  status.classList.remove("paused");
  
  document.getElementById("afterDoneText").classList.add("hidden");
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  message.classList.remove("hidden");
  
  setTimeout(() => {
    message.classList.add("hidden");
  }, 3000);
}

function showRetryModal() {
  modalHeader.textContent = l10n.confirmRetryHeader || "Retry recording?";
  modalBody.textContent = l10n.confirmRetryBody || "By pressing 'Retry' you will lose your current recording.";
  modal.classList.remove("hidden");
  audioPlayback.classList.add("remove");
}

function hideModal() {
  modal.classList.add("hidden");
}

// Event listeners
recordBtn.addEventListener("click", startRecording);
pauseBtn.addEventListener("click", pauseRecording);
continueBtn.addEventListener("click", resumeRecording);
doneBtn.addEventListener("click", stopRecording);
retryBtn.addEventListener("click", showRetryModal);
downloadBtn.addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = audioUrl;
  const dateStr = new Date().toLocaleDateString('vi-VN').replaceAll('/', '-');
  a.download = `Cuộc hội thoại - ${dateStr}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Modal event listeners
cancelRetry.addEventListener("click", hideModal);
confirmRetry.addEventListener("click", () => {
  hideModal();
  resetRecording();
});

// Initialize UI
resetRecording();