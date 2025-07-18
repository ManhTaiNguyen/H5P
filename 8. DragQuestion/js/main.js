let jsonData;
let draggedItem = null;
let originalPosition = {};
let offset = { x: 0, y: 0 };
let isDragging = false;
let startTime = 0;
let containerRect = null;
let animationFrameId = null;
let isFromOverflow = false;
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

const DRAG_CLONE_CLASS = "dragging-clone";
let dragClone = null;

// ========== CORE FUNCTIONS ==========
function loadGame() {
  fetch("content2/content.json")
    .then((res) => res.json())
    .then((data) => {
      jsonData = data;
      renderTask(data);
    })
    .catch((error) => {
      console.error("Lỗi khi tải trò chơi:", error);
    });
}

function renderTask(data) {
  const bgPath = data.question.settings.background.path;
  const bgEl = document.getElementById("task-background");
  bgEl.style.backgroundImage = `url(content2/${bgPath})`;

  const draggables = document.getElementById("draggables-container");
  const dropzones = document.getElementById("dropzones-container");
  draggables.innerHTML = "";
  dropzones.innerHTML = "";

  // Create draggable items
  data.question.task.elements.forEach((el, i) => {
    const item = createDraggableItem(el, i);
    originalPosition[i] = {
      left: `${el.x}%`,
      top: `${el.y}%`,
      width: "auto",
      height: "auto",
      minWidth: `${el.width}%`,
    };
    draggables.appendChild(item);
  });

  // Create drop zones
  data.question.task.dropZones.forEach((zone, idx) => {
    const dz = createDropZone(zone, idx);
    dropzones.appendChild(dz);
  });

  updateContainerRect();
}

function updateContainerRect() {
  containerRect = document
    .getElementById("task-background")
    .getBoundingClientRect();
}

// ========== DRAG & DROP FUNCTIONS ==========
function createDraggableItem(el, index) {
  const item = document.createElement("div");
  item.className = "draggable-item";
  item.style.left = `${el.x}%`;
  item.style.top = `${el.y}%`;
  item.style.width = "auto";
  item.style.height = "auto";
  item.style.minWidth = `${el.width}%`;
  item.setAttribute("draggable", "true");
  item.dataset.index = index;
  item.dataset.originalWidth = el.width;
  // Add correct drop zone information to each item
  item.dataset.correctZones = jsonData.question.task.dropZones
    .map((zone, idx) => (zone.correctElements.includes(index) ? idx : null))
    .filter((val) => val !== null)
    .join(",");

  const textSpan = document.createElement("span");
  textSpan.className = "draggable-text";
  textSpan.innerHTML = el.type.params.text;
  textSpan.style.whiteSpace = "nowrap";
  item.appendChild(textSpan);

  setupDragEvents(item);
  return item;
}

function createDropZone(zone, index) {
  const dz = document.createElement("div");
  dz.className = "dropzone";
  dz.style.left = `${zone.x}%`;
  dz.style.top = `${zone.y + 2}%`;
  dz.style.width = `${zone.width + 8}%`;
  dz.style.height = `${zone.height + 18}%`;
  dz.dataset.correct = zone.correctElements.join(",");
  dz.dataset.zoneIndex = index;
  dz.dataset.originalWidth = zone.width + 8;
  dz.dataset.originalHeight = zone.height + 18;

  setupDropZoneEvents(dz);
  return dz;
}

function setupDragEvents(item) {
  // Mouse events
  item.addEventListener("mousedown", handleDragStart);
  item.addEventListener("dragstart", handleDragStart);
  item.addEventListener("dragend", handleDragEnd);

  // Touch events
  item.addEventListener("touchstart", handleTouchStart, { passive: false });
  item.addEventListener("touchmove", handleTouchMove, { passive: false });
  item.addEventListener("touchend", handleTouchEnd, { passive: false });
  item.addEventListener("touchcancel", handleTouchEnd, { passive: false });
}

function setupDropZoneEvents(zone) {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    zone.classList.add("hovered");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("hovered");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    handleDrop(zone);
  });
}

// ========== EVENT HANDLERS ==========
function handleDragStart(e) {
  e.preventDefault();
  cancelAnimationFrame(animationFrameId);

  draggedItem = e.target.closest(".draggable-item");
  if (!draggedItem) return;

  isDragging = true;
  startTime = Date.now();
  isFromOverflow = draggedItem.parentElement.id === "overflow-draggables";

  const clientX = e.clientX || e.touches?.[0]?.clientX;
  const clientY = e.clientY || e.touches?.[0]?.clientY;

  updateContainerRect();

  const rect = draggedItem.getBoundingClientRect();
  offset.x = clientX - rect.left;
  offset.y = clientY - rect.top;

  if (isFromOverflow) {
    dragClone = createDragClone(draggedItem, { clientX, clientY });
    // draggedItem.style.opacity = "0.5";
    draggedItem.style.transform = "scale(0.95)";
  } else {
    draggedItem.classList.add("dragging");
    draggedItem.style.zIndex = "1000";
    draggedItem.style.position = "absolute";
    draggedItem.style.transition = "none";
    draggedItem.style.willChange = "transform";
    draggedItem.style.boxShadow = "0 8px 25px rgba(0,0,0,0.2)";

    // Lưu vị trí ban đầu trước khi kéo
    const computedStyle = window.getComputedStyle(draggedItem);
    draggedItem.dataset.originalTransform = computedStyle.transform;
    draggedItem.style.transformOrigin = "center center";
  }

  if (navigator.vibrate) navigator.vibrate(50);
}

function handleDragMove(e) {
  if (!draggedItem || !isDragging) return;
  e.preventDefault();

  const clientX = e.clientX || e.touches?.[0]?.clientX;
  const clientY = e.clientY || e.touches?.[0]?.clientY;

  if (e.type === "touchmove") {
    const deltaX = Math.abs(clientX - touchStartX);
    const deltaY = Math.abs(clientY - touchStartY);
    if (!touchMoved && (deltaX > 5 || deltaY > 5)) {
      touchMoved = true;
    }
    if (!touchMoved) return;
  }

  animationFrameId = requestAnimationFrame(() => {
    if (isFromOverflow && dragClone) {
      dragClone.style.left = `${clientX - offset.x}px`;
      dragClone.style.top = `${clientY - offset.y}px`;
    } else {
      updateDragPosition(clientX, clientY);
    }
  });

  highlightDropZones(clientX, clientY);
}

function handleDragEnd(e) {
  if (!draggedItem || !isDragging) return;
  e.preventDefault();
  cancelAnimationFrame(animationFrameId);

  const clientX =
    e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
  const clientY =
    e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

  let dropped = false;
  if (e.type !== "touchmove" || touchMoved) {
    const zones = document.querySelectorAll(".dropzone");
    zones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        if (isFromOverflow && dragClone) {
          dragClone.remove();
        }
        handleDrop(zone);
        dropped = true;
      }
    });
  }

  cleanupDrag(dropped);
  clearDropZoneHighlights();
}

// ========== TOUCH HANDLERS ==========
function handleTouchStart(e) {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  handleDragStart(e);
}

function handleTouchMove(e) {
  handleDragMove(e);
}

function handleTouchEnd(e) {
  handleDragEnd(e);
}

// ========== DRAG HELPERS ==========
function createDragClone(item, { clientX, clientY }) {
  const rect = item.getBoundingClientRect();
  const clone = item.cloneNode(true);
  clone.classList.add(DRAG_CLONE_CLASS);

  // Copy all relevant data attributes
  clone.dataset.index = item.dataset.index;
  clone.dataset.originalWidth = item.dataset.originalWidth;
  clone.dataset.correctZones = item.dataset.correctZones;

  clone.style.position = "fixed";
  clone.style.zIndex = "10000";
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.left = `${clientX - offset.x}px`;
  clone.style.top = `${clientY - offset.y}px`;
  clone.style.transform = "scale(1.1)";
  clone.style.transition = "transform 0.2s ease-out";
  clone.style.boxShadow = "0 8px 25px rgba(0,0,0,0.2)";
  clone.style.pointerEvents = "none";

  const computedStyle = window.getComputedStyle(item);
  clone.style.background = computedStyle.background;
  clone.style.border = computedStyle.border;
  clone.style.borderRadius = computedStyle.borderRadius;

  document.body.appendChild(clone);
  return clone;
}

function updateDragPosition(x, y) {
  if (!containerRect) return;

  // Tính toán vị trí mới trực tiếp bằng pixel
  const newLeft = x - containerRect.left - offset.x;
  const newTop = y - containerRect.top - offset.y;

  // Giới hạn vị trí trong phạm vi container
  const maxLeft = containerRect.width - draggedItem.offsetWidth;
  const maxTop = containerRect.height - draggedItem.offsetHeight;

  // Áp dụng vị trí mới
  draggedItem.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
  draggedItem.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;

  // Đảm bảo item luôn hiển thị đầy đủ trong container
  draggedItem.style.right = "auto";
  draggedItem.style.bottom = "auto";
}

// ========== DROP HELPERS ==========
function handleDrop(zone) {
  zone.classList.remove("hovered");

  const textElement = draggedItem.querySelector(".draggable-text");
  if (textElement) {
    textElement.style.fontSize = `${FONT_SIZE_RANGES.default}px`;
  }

  // Check if this drop is correct before proceeding
  const correctZones = draggedItem.dataset.correctZones.split(",").map(Number);
  const isCorrect = correctZones.includes(parseInt(zone.dataset.zoneIndex));

  draggedItem.style.minWidth = `${draggedItem.dataset.originalWidth}%`;
  draggedItem.style.position = "relative";
  draggedItem.style.left = "auto";
  draggedItem.style.top = "auto";
  draggedItem.style.width = "auto";
  draggedItem.style.height = "auto";
  draggedItem.style.minWidth = "auto";
  draggedItem.style.transform = "";
  draggedItem.style.margin = "0";
  draggedItem.style.transition =
    "transform 0.3s ease-out, opacity 0.3s ease-out";

  zone.appendChild(draggedItem);
  draggedItem.dataset.placedIn = zone.dataset.zoneIndex;
  draggedItem.dataset.originalLeft =
    originalPosition[draggedItem.dataset.index].left;
  draggedItem.dataset.originalTop =
    originalPosition[draggedItem.dataset.index].top;

  if (navigator.vibrate) navigator.vibrate(100);
}

function returnToOriginalPosition() {
  const idx = draggedItem.dataset.index;
  const original = originalPosition[idx];
  const wasInDropzone = draggedItem.dataset.placedIn !== undefined;

  draggedItem.style.position = "absolute";
  draggedItem.style.margin = "0";
  draggedItem.style.width = original.width;
  draggedItem.style.height = original.height;
  draggedItem.style.minWidth = original.minWidth;
  draggedItem.style.transition = `all ${
    wasInDropzone ? "0.6s" : "0.4s"
  } cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
  draggedItem.style.left = original.left;
  draggedItem.style.top = original.top;
  draggedItem.style.transform = "";

  setTimeout(
    () => {
      document.getElementById("draggables-container").appendChild(draggedItem);
      draggedItem.style.transition = "";
      delete draggedItem.dataset.placedIn;

      if (wasInDropzone) {
        draggedItem.style.animation = "bounceBack 0.5s ease-out";
        setTimeout(() => {
          draggedItem.style.animation = "";
        }, 500);
      }
    },
    wasInDropzone ? 600 : 400
  );
}

function returnToOverflowContainer() {
  draggedItem.style.position = "static";
  draggedItem.style.left = "auto";
  draggedItem.style.top = "auto";
  draggedItem.style.margin = "5px";
  draggedItem.style.transform = "none";
  draggedItem.style.transition = "all 0.3s ease-out";

  document.getElementById("overflow-draggables").appendChild(draggedItem);

  setTimeout(() => {
    draggedItem.style.transition = "";
  }, 300);
}

function cleanupDrag(dropped = false) {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    draggedItem.style.zIndex = "5";
    draggedItem.style.transform = "";
    draggedItem.style.willChange = "";
    draggedItem.style.transition = "";

    if (!dropped) {
      if (isFromOverflow) {
        returnToOverflowContainer();
      } else {
        returnToOriginalPosition();
      }
    }
  }

  if (dragClone) {
    dragClone.style.transform = "scale(0.5)";
    dragClone.style.opacity = "0";
    setTimeout(() => {
      dragClone.remove();
      dragClone = null;
    }, 200);
  }

  isDragging = false;
  draggedItem = null;
  touchMoved = false;
  isFromOverflow = false;
}

// ========== UTILITY FUNCTIONS ==========
function highlightDropZones(x, y) {
  document.querySelectorAll(".dropzone").forEach((zone) => {
    const rect = zone.getBoundingClientRect();
    const isHovered =
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

    zone.classList.toggle("hovered", isHovered);
  });
}

function clearDropZoneHighlights() {
  document.querySelectorAll(".dropzone.hovered").forEach((zone) => {
    zone.classList.remove("hovered");
  });
}

// ========== GAME CONTROLS ==========
document.getElementById("checkBtn").addEventListener("click", checkAnswers);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document
  .getElementById("showAnswersBtn")
  .addEventListener("click", showAnswers);

function checkAnswers() {
  if (!jsonData) {
    showNotification("Lỗi: Dữ liệu trò chơi chưa được tải.", "error");
    return;
  }

  let correctCount = 0;
  const totalDraggables = jsonData.question.task.elements.length;
  let allPlaced = true;

  // Reset all feedback classes first
  document.querySelectorAll(".draggable-item").forEach((item) => {
    item.classList.remove("correct", "incorrect");
  });

  const checkedItems = new Set();

  document.querySelectorAll(".dropzone").forEach((zone) => {
    const zoneIndex = parseInt(zone.dataset.zoneIndex);
    const correctElements =
      jsonData.question.task.dropZones[zoneIndex].correctElements;

    const itemsInZone = Array.from(zone.querySelectorAll(".draggable-item"));

    itemsInZone.forEach((item) => {
      const itemIndex = item.dataset.index;
      const isCorrect = correctElements.includes(itemIndex);

      if (isCorrect) {
        correctCount++;
        checkedItems.add(itemIndex);
        item.classList.add("correct");
      } else {
        item.classList.add("incorrect");
      }
    });
  });

  const unplacedItems = totalDraggables - checkedItems.size;
  if (unplacedItems > 0) allPlaced = false;

  const allCorrectAndPlaced = correctCount === totalDraggables && allPlaced;

  if (allCorrectAndPlaced) {
    createConfetti();
    showFeedback(
      true,
      jsonData.question.task.dropZones.length,
      jsonData.question.task.dropZones.length
    );
    showCompletionNotification(
      jsonData.question.task.dropZones.length,
      jsonData.question.task.dropZones.length
    );
    showNotification(
      "Chúc mừng! Bạn đã hoàn thành đúng tất cả câu hỏi! 🎉",
      "success"
    );

    // Disable check and show answers buttons
    document.getElementById("checkBtn").disabled = true;
    document.getElementById("showAnswersBtn").disabled = true;
  } else {
    showFeedback(allCorrectAndPlaced, correctCount, totalDraggables);
  }

  if (navigator.vibrate) {
    navigator.vibrate(allCorrectAndPlaced ? [100, 50, 100, 50, 100] : [200]);
  }
}

function resetGame() {
  const fontSizeRange = document.getElementById("fontSizeRange");
  const fontSizeValue = document.getElementById("fontSizeValue");

  if (fontSizeRange && fontSizeValue) {
    fontSizeRange.value = FONT_SIZE_RANGES.default;
    fontSizeValue.textContent = `${FONT_SIZE_RANGES.default}px`;
    if (window.fontResizer)
      window.fontResizer.setFontSize(FONT_SIZE_RANGES.default);
  }

  // Re-enable all buttons
  document.getElementById("checkBtn").disabled = false;
  document.getElementById("showAnswersBtn").disabled = false;

  document.querySelectorAll(".draggable-item").forEach((item) => {
    item.classList.remove("correct", "incorrect");
  });

  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.style.opacity = "1";
    zone.style.width = `${zone.dataset.originalWidth}%`;
    zone.style.height = `${zone.dataset.originalHeight}%`;
  });

  document.querySelectorAll(".draggable-item").forEach((item) => {
    const idx = item.dataset.index;
    const original = originalPosition[idx];

    item.style.position = "absolute";
    item.style.left = original.left;
    item.style.top = original.top;
    item.style.width = original.width;
    item.style.height = original.height;
    item.style.minWidth = original.minWidth;
    item.style.zIndex = "5";
    item.style.opacity = "1";
    item.style.background = "linear-gradient(145deg, #f0f8ff, #e6f3ff)";
    item.style.transform = "";
    item.style.transition = "all 0.4s ease-out";
    item.style.margin = "0";
    item.classList.remove("dragging");

    const textSpan = item.querySelector(".draggable-text");
    if (textSpan) {
      textSpan.style.fontSize = "";
      textSpan.style.whiteSpace = "nowrap";
      textSpan.style.transform = "";
    }

    item.style.animation = "none";
    void item.offsetWidth;
    item.style.animation = "bounceBack 0.5s ease-out";

    document.getElementById("draggables-container").appendChild(item);
    delete item.dataset.placedIn;

    setTimeout(() => {
      item.style.transition = "";
      item.style.animation = "";
    }, 500);
  });

  // Thêm dòng này để xóa nội dung feedback container
  document.getElementById("feedback-container").innerHTML = "";
  document.getElementById("feedback-container").style.display = "none";

  cancelAnimationFrame(animationFrameId);
  isDragging = false;
  draggedItem = null;
  touchMoved = false;

  const overflowContainer = document.getElementById("overflow-draggables");
  while (overflowContainer.firstChild) {
    overflowContainer.removeChild(overflowContainer.firstChild);
  }

  showNotification("Quiz reset! 🔄", "info");
  if (navigator.vibrate) navigator.vibrate(50);
}

function showAnswers() {
  if (!jsonData) return;

  // Reset all items first
  document.querySelectorAll(".draggable-item").forEach((item) => {
    item.classList.remove("correct", "incorrect");
  });

  jsonData.question.task.dropZones.forEach((zone, dzIndex) => {
    const correctIndex = parseInt(zone.correctElements[0]);
    const item = document.querySelector(
      `.draggable-item[data-index='${correctIndex}']`
    );
    const dzEl = document.querySelector(
      `.dropzone[data-zone-index='${dzIndex}']`
    );

    if (item && dzEl) {
      dzEl.appendChild(item);
      item.classList.add("correct");
      item.style.position = "relative";
      item.style.left = "0";
      item.style.top = "0";
      item.style.width = "auto";
      item.style.height = "auto";
      item.dataset.placedIn = dzIndex;
      item.style.transform = "";
      item.style.animation = "dropAnimation 0.3s ease-out";

      setTimeout(() => {
        item.style.animation = "";
      }, 300);
    }
  });

  showFeedback(
    true,
    jsonData.question.task.dropZones.length,
    jsonData.question.task.dropZones.length
  );
  createConfetti();
  showNotification("Giải pháp đã được tiết lộ! 🎓", "success");
  showCompletionNotification(
    jsonData.question.task.dropZones.length,
    jsonData.question.task.dropZones.length
  );

  // Disable check and show answers buttons
  document.getElementById("checkBtn").disabled = true;
  document.getElementById("showAnswersBtn").disabled = true;

  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
}

// ========== UI FUNCTIONS ==========
function showFeedback(success, correct, total) {
  const container = document.getElementById("feedback-container");
  if (!container) return;

  container.className = "feedback-container";
  container.classList.add(success ? "success" : "error");
  container.innerHTML = success
    ? `<i class="fas fa-check-circle"></i><strong>Chúc mừng!</strong> Bạn đã hoàn thành đúng tất cả câu hỏi!`
    : `<i class="fas fa-exclamation-triangle"></i><strong>Gần đúng rồi!</strong> Bạn đã làm đúng ${correct}/${total} câu. Hãy thử lại!`;

  container.style.display = "block";
}

function hideFeedback() {
  const container = document.getElementById("feedback-container");
  if (container) container.style.display = "none";
}

// ========== EVENT LISTENERS ==========
document.addEventListener(
  "touchstart",
  (e) => {
    if (e.target.classList.contains("draggable-item")) e.preventDefault();
  },
  { passive: false }
);

document.addEventListener(
  "touchmove",
  (e) => {
    if (isDragging) e.preventDefault();
  },
  { passive: false }
);

window.addEventListener("orientationchange", () => {
  setTimeout(updateContainerRect, 100);
});

window.addEventListener("resize", updateContainerRect);

// ========== INITIALIZATION ==========
const style = document.createElement("style");
style.textContent = `
  @keyframes dropAnimation {
    0% { transform: scale(1.1); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 0.9; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes bounceBack {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
`;
document.head.appendChild(style);

document.addEventListener("mousemove", handleDragMove);
document.addEventListener("mouseup", handleDragEnd);

loadGame();
