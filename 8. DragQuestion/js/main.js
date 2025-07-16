let jsonData;
let draggedItem = null;
let originalPosition = {};
let offset = { x: 0, y: 0 };
let isDragging = false;
let startTime = 0;
let containerRect = null;
let animationFrameId = null;

// Touch event helpers
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

function loadGame() {
  fetch("content1/content.json")
    .then((res) => res.json())
    .then((data) => {
      jsonData = data;
      renderTask(data);
      setupFontSizeControl();
    })
    .catch((error) => {
      console.error("Error loading game:", error);
    });
}

function renderTask(data) {
  const bgPath = data.question.settings.background.path;
  const bgEl = document.getElementById("task-background");
  bgEl.style.backgroundImage = `url(content1/${bgPath})`;

  const draggables = document.getElementById("draggables-container");
  const dropzones = document.getElementById("dropzones-container");
  draggables.innerHTML = "";
  dropzones.innerHTML = "";

  const elements = data.question.task.elements;
  const zones = data.question.task.dropZones;

  // Create draggable items
  elements.forEach((el, i) => {
    const item = document.createElement("div");
    item.className = "draggable-item";
    item.style.left = `${el.x}%`;
    item.style.top = `${el.y}%`;
    item.style.width = `${el.width}%`;
    item.style.height = `${el.height}%`;
    item.setAttribute("draggable", "true");
    item.dataset.index = i;

    const textSpan = document.createElement("span");
    textSpan.className = "draggable-text";
    textSpan.innerHTML = el.type.params.text;
    item.appendChild(textSpan);

    originalPosition[i] = {
      left: `${el.x}%`,
      top: `${el.y}%`,
      width: `${el.width}%`,
      height: `${el.height}%`,
    };

    addDragEvents(item);
    draggables.appendChild(item);
  });

  // Create dropzones
  zones.forEach((zone, idx) => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.style.left = `${zone.x}%`;
    dz.style.top = `${zone.y}%`;
    dz.style.width = `${zone.width}%`;
    dz.style.height = `${zone.height}%`;
    dz.dataset.correct = zone.correctElements.join(",");
    dz.dataset.zoneIndex = idx;
    addDropZoneEvents(dz);
    dropzones.appendChild(dz);
  });

  updateContainerRect();
}

function updateContainerRect() {
  containerRect = document
    .getElementById("task-background")
    .getBoundingClientRect();
}

function addDragEvents(item) {
  // Desktop drag events
  item.addEventListener("dragstart", (e) => {
    e.preventDefault();
    draggedItem = e.target;
    isDragging = true;
    startTime = Date.now();
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", "");
    e.dataTransfer.effectAllowed = "move";

    const rect = e.target.getBoundingClientRect();
    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;
  });

  item.addEventListener("dragend", (e) => {
    e.preventDefault();
    cleanupDrag();
  });

  // Mobile touch events
  item.addEventListener("touchstart", handleTouchStart, { passive: false });
  item.addEventListener("touchmove", handleTouchMove, { passive: false });
  item.addEventListener("touchend", handleTouchEnd, { passive: false });
  item.addEventListener("touchcancel", handleTouchEnd, { passive: false });
}

function addDropZoneEvents(zone) {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    zone.classList.add("hovered");
  });

  zone.addEventListener("dragleave", (e) => {
    zone.classList.remove("hovered");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    handleDrop(zone);
  });
}

function handleTouchStart(e) {
  e.preventDefault();
  cancelAnimationFrame(animationFrameId);

  const touch = e.touches[0];
  draggedItem = e.target;
  isDragging = true;
  touchMoved = false;
  startTime = Date.now();

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;

  updateContainerRect();

  const rect = draggedItem.getBoundingClientRect();
  offset.x = touch.clientX - rect.left;
  offset.y = touch.clientY - rect.top;

  // Style changes for dragging
  draggedItem.classList.add("dragging");
  draggedItem.style.zIndex = "1000";
  draggedItem.style.position = "absolute";
  draggedItem.style.transform = "translate3d(0, 0, 0)"; // Enable hardware acceleration
  draggedItem.style.willChange = "transform"; // Optimize for animation

  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate(50);
}

function handleTouchMove(e) {
  if (!draggedItem || !isDragging) return;
  e.preventDefault();

  const touch = e.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartX);
  const deltaY = Math.abs(touch.clientY - touchStartY);

  // Check if it's a real drag
  if (!touchMoved && (deltaX > 5 || deltaY > 5)) {
    touchMoved = true;
  }

  if (touchMoved) {
    // Use requestAnimationFrame for smoother movement
    animationFrameId = requestAnimationFrame(() => {
      const x = touch.clientX - containerRect.left - offset.x;
      const y = touch.clientY - containerRect.top - offset.y;

      // Convert to percentage for responsive behavior
      const percentX = (x / containerRect.width) * 100;
      const percentY = (y / containerRect.height) * 100;

      // Apply movement with transform for better performance
      draggedItem.style.left = `${percentX}%`;
      draggedItem.style.top = `${percentY}%`;
      draggedItem.style.transform = `translate3d(0, 0, 0)`;
    });

    // Highlight dropzones on hover
    highlightDropZones(touch.clientX, touch.clientY);
  }
}

function handleTouchEnd(e) {
  if (!draggedItem || !isDragging) return;
  e.preventDefault();
  cancelAnimationFrame(animationFrameId);

  const touch = e.changedTouches[0];
  let dropped = false;

  if (touchMoved) {
    const zones = document.querySelectorAll(".dropzone");

    zones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        handleDrop(zone);
        dropped = true;
      }
    });
  }

  if (!dropped) {
    returnToOriginalPosition();
  }

  cleanupDrag();
  clearDropZoneHighlights();
}

function handleDrop(zone) {
  if (!draggedItem) return;

  zone.classList.remove("hovered");

  // Calculate position within dropzone
  const dzRect = zone.getBoundingClientRect();
  const itemRect = draggedItem.getBoundingClientRect();

  // Center the item in the dropzone
  const centerX = dzRect.width / 2 - itemRect.width / 2;
  const centerY = dzRect.height / 2 - itemRect.height / 2;

  // Move item to dropzone
  zone.appendChild(draggedItem);
  draggedItem.style.position = "absolute";
  draggedItem.style.left = `${centerX}px`;
  draggedItem.style.top = `${centerY}px`;
  draggedItem.style.width = `${itemRect.width}px`;
  draggedItem.style.height = `${itemRect.height}px`;
  draggedItem.dataset.placedIn = zone.dataset.zoneIndex;

  // Add smooth transition
  draggedItem.style.transition = "all 0.2s ease-out";
  setTimeout(() => {
    draggedItem.style.transition = "";
  }, 200);

  // Haptic feedback
  if (navigator.vibrate) navigator.vibrate(100);
}

function returnToOriginalPosition() {
  if (!draggedItem) return;

  const idx = draggedItem.dataset.index;
  const original = originalPosition[idx];

  // Animate back with transform for smoother movement
  draggedItem.style.transition =
    "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
  draggedItem.style.left = original.left;
  draggedItem.style.top = original.top;
  draggedItem.style.width = original.width;
  draggedItem.style.height = original.height;

  setTimeout(() => {
    document.getElementById("draggables-container").appendChild(draggedItem);
    draggedItem.style.transition = "";
  }, 300);
}

function cleanupDrag() {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    draggedItem.style.zIndex = "5";
    draggedItem.style.transform = "";
    draggedItem.style.willChange = "";
  }

  isDragging = false;
  draggedItem = null;
  touchMoved = false;
}

function highlightDropZones(x, y) {
  const zones = document.querySelectorAll(".dropzone");

  zones.forEach((zone) => {
    const rect = zone.getBoundingClientRect();
    const isHovered =
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

    // Only update if state changed
    if (isHovered && !zone.classList.contains("hovered")) {
      zone.classList.add("hovered");
    } else if (!isHovered && zone.classList.contains("hovered")) {
      zone.classList.remove("hovered");
    }
  });
}

function clearDropZoneHighlights() {
  document.querySelectorAll(".dropzone.hovered").forEach((zone) => {
    zone.classList.remove("hovered");
  });
}

// Button event listeners
document.getElementById("checkBtn").addEventListener("click", checkAnswers);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document
  .getElementById("showAnswersBtn")
  .addEventListener("click", showAnswers);

function checkAnswers() {
  if (!jsonData) return;

  const zones = jsonData.question.task.dropZones;
  let allCorrect = true;
  let correctCount = 0;
  let totalItems = 0;

  document.querySelectorAll(".dropzone").forEach((zone) => {
    const correct = zone.dataset.correct.split(",");
    const child = zone.querySelector(".draggable-item");

    zone.classList.remove("correct-feedback", "incorrect-feedback");

    if (child) {
      totalItems++;
      const index = child.dataset.index;
      if (correct.includes(index)) {
        zone.classList.add("correct-feedback");
        correctCount++;
      } else {
        zone.classList.add("incorrect-feedback");
        allCorrect = false;
      }
    }
  });

  // Show feedback
  showFeedback(allCorrect, correctCount, totalItems);

  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(allCorrect ? [100, 50, 100] : [200]);
  }
}

function resetGame() {
  // Clear feedback
  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.classList.remove("correct-feedback", "incorrect-feedback", "hovered");
  });

  // Reset all draggable items
  document.querySelectorAll(".draggable-item").forEach((item) => {
    const idx = item.dataset.index;
    const original = originalPosition[idx];

    item.style.position = "absolute";
    item.style.left = original.left;
    item.style.top = original.top;
    item.style.width = original.width;
    item.style.height = original.height;
    item.style.zIndex = "5";
    item.style.opacity = "1";
    item.style.background = "linear-gradient(145deg, #f0f8ff, #e6f3ff)";
    item.classList.remove("dragging");

    document.getElementById("draggables-container").appendChild(item);
    delete item.dataset.placedIn;
  });

  // Hide feedback
  hideFeedback();

  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

function showAnswers() {
  if (!jsonData) return;

  const zones = jsonData.question.task.dropZones;

  zones.forEach((zone, dzIndex) => {
    const correctIndex = parseInt(zone.correctElements[0]);
    const item = document.querySelector(
      `.draggable-item[data-index='${correctIndex}']`
    );
    const dzEl = document.querySelector(
      `.dropzone[data-zone-index='${dzIndex}']`
    );

    if (item && dzEl) {
      dzEl.appendChild(item);
      item.style.position = "relative";
      item.style.left = "0";
      item.style.top = "0";
      item.style.width = "auto";
      item.style.height = "auto";
      item.dataset.placedIn = dzIndex;

      // Add animation
      item.style.animation = "dropAnimation 0.3s ease-out";
      setTimeout(() => {
        item.style.animation = "";
      }, 300);
    }
  });

  // Mark all as correct
  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.classList.add("correct-feedback");
    zone.classList.remove("incorrect-feedback");
  });

  // Show success feedback
  showFeedback(true, zones.length, zones.length);

  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 100]);
  }
}

function showFeedback(success, correct, total) {
  const container = document.getElementById("feedback-container");
  if (!container) return;

  container.className = "feedback-container";
  container.classList.add(success ? "success" : "error");

  if (success) {
    container.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <strong>Chúc mừng!</strong> Bạn đã hoàn thành đúng tất cả câu hỏi!
    `;
  } else {
    container.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <strong>Gần đúng rồi!</strong> Bạn đã làm đúng ${correct}/${total} câu. Hãy thử lại!
    `;
  }

  container.style.display = "block";
}

function hideFeedback() {
  const container = document.getElementById("feedback-container");
  if (container) {
    container.style.display = "none";
  }
}

// Prevent default touch behaviors that might interfere with drag
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.classList.contains("draggable-item")) {
      e.preventDefault();
    }
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (e) => {
    if (isDragging) {
      e.preventDefault();
    }
  },
  { passive: false }
);

// Handle orientation changes
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    containerRect = document
      .getElementById("task-background")
      .getBoundingClientRect();
  }, 100);
});

// Handle resize
window.addEventListener("resize", () => {
  containerRect = document
    .getElementById("task-background")
    .getBoundingClientRect();
});

// Add CSS animation keyframes dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes dropAnimation {
    0% { transform: scale(1.1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 0.9; }
    100% { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Initialize game
loadGame();
