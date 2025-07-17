let jsonData;
let draggedItem = null;
let originalPosition = {};
let offset = { x: 0, y: 0 };
let isDragging = false;
let startTime = 0;
let containerRect = null;
let animationFrameId = null;

// Các hàm hỗ trợ sự kiện chạm
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = false;

function loadGame() {
  fetch("content1/content.json")
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
  bgEl.style.backgroundImage = `url(content1/${bgPath})`;

  const draggables = document.getElementById("draggables-container");
  const dropzones = document.getElementById("dropzones-container");
  draggables.innerHTML = "";
  dropzones.innerHTML = "";

  const elements = data.question.task.elements;
  const zones = data.question.task.dropZones;

  // Tạo các item có thể kéo (draggable items)
  elements.forEach((el, i) => {
    const item = document.createElement("div");
    item.className = "draggable-item";
    item.style.left = `${el.x - 7}%`;
    item.style.top = `${el.y}%`;
    item.style.width = "auto";
    item.style.height = "auto";
    item.style.minWidth = `${el.width}%`;
    item.setAttribute("draggable", "true");
    item.dataset.index = i;
    item.dataset.originalWidth = el.width;

    const textSpan = document.createElement("span");
    textSpan.className = "draggable-text";
    textSpan.innerHTML = el.type.params.text;
    textSpan.style.whiteSpace = "nowrap";
    item.appendChild(textSpan);

    originalPosition[i] = {
      left: `${el.x - 7}%`,
      top: `${el.y}%`,
      width: "auto",
      height: "auto",
      minWidth: `${el.width}%`,
    };

    addDragEvents(item);
    draggables.appendChild(item);
  });

  // Tạo các vùng thả (dropzones)
  zones.forEach((zone, idx) => {
    const dz = document.createElement("div");
    dz.className = "dropzone";
    dz.style.left = `${zone.x}%`;
    dz.style.top = `${zone.y + 2}%`;
    dz.style.width = `${zone.width + 8}%`;
    dz.style.height = `${zone.height + 18}%`;
    dz.dataset.correct = zone.correctElements.join(",");
    dz.dataset.zoneIndex = idx;
    dz.dataset.originalWidth = zone.width + 8;
    dz.dataset.originalHeight = zone.height + 18;
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
  // Sự kiện kéo cho máy tính để bàn
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

  // Sự kiện chuột cho việc kéo trên máy tính để bàn
  item.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Chỉ nút chuột trái
    e.preventDefault();
    draggedItem = e.target;
    isDragging = true;
    startTime = Date.now();
    draggedItem.classList.add("dragging");
    updateContainerRect();

    const rect = draggedItem.getBoundingClientRect();
    offset.x = e.clientX - rect.left;
    offset.y = e.clientY - rect.top;

    // Thay đổi style để kéo mượt mà hơn
    draggedItem.style.zIndex = "1000";
    draggedItem.style.position = "absolute";
    // Loại bỏ transition trong khi kéo để tránh giật hình
    draggedItem.style.transition = "none";
    draggedItem.style.transform = "translate3d(0, 0, 0)";
    draggedItem.style.willChange = "transform";
  });

  document.addEventListener("mousemove", (e) => {
    if (!draggedItem || !isDragging) return;
    e.preventDefault();

    // Sử dụng requestAnimationFrame để cập nhật vị trí mượt mà
    animationFrameId = requestAnimationFrame(() => {
      const x = e.clientX - containerRect.left - offset.x;
      const y = e.clientY - containerRect.top - offset.y;

      // Chuyển đổi sang phần trăm để có tính responsive
      const percentX = (x / containerRect.width) * 100;
      const percentY = (y / containerRect.height) * 100;

      draggedItem.style.left = `${percentX}%`;
      draggedItem.style.top = `${percentY}%`;
      draggedItem.style.transform = `translate3d(0, 0, 0)`;
    });

    // Làm nổi bật vùng thả khi di chuột qua
    highlightDropZones(e.clientX, e.clientY);
  });

  document.addEventListener("mouseup", (e) => {
    if (!draggedItem || !isDragging) return;
    e.preventDefault();
    cancelAnimationFrame(animationFrameId); // Hủy bất kỳ frame hoạt ảnh nào đang chờ xử lý

    let dropped = false;

    const zones = document.querySelectorAll(".dropzone");
    zones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        handleDrop(zone);
        dropped = true;
      }
    });

    if (!dropped) {
      returnToOriginalPosition();
    }

    cleanupDrag();
    clearDropZoneHighlights();
  });

  // Sự kiện chạm trên thiết bị di động
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

  // Thay đổi style để kéo mượt mà hơn
  draggedItem.classList.add("dragging");
  draggedItem.style.zIndex = "1000";
  draggedItem.style.position = "absolute";
  // Loại bỏ transition trong khi kéo để tránh giật hình
  draggedItem.style.transition = "none";
  draggedItem.style.transform = "translate3d(0, 0, 0)"; // Kích hoạt tăng tốc phần cứng
  draggedItem.style.willChange = "transform"; // Tối ưu hóa cho hoạt ảnh

  // Phản hồi rung
  if (navigator.vibrate) navigator.vibrate(50);
}

function handleTouchMove(e) {
  if (!draggedItem || !isDragging) return;
  e.preventDefault();

  const touch = e.touches[0];
  const deltaX = Math.abs(touch.clientX - touchStartX);
  const deltaY = Math.abs(touch.clientY - touchStartY);

  // Kiểm tra xem đây có phải là một thao tác kéo thực sự không
  if (!touchMoved && (deltaX > 5 || deltaY > 5)) {
    touchMoved = true;
  }

  if (touchMoved) {
    // Sử dụng requestAnimationFrame để di chuyển mượt mà hơn
    animationFrameId = requestAnimationFrame(() => {
      const x = touch.clientX - containerRect.left - offset.x;
      const y = touch.clientY - containerRect.top - offset.y;

      // Chuyển đổi sang phần trăm để có tính responsive
      const percentX = (x / containerRect.width) * 100;
      const percentY = (y / containerRect.height) * 100;

      // Áp dụng di chuyển bằng transform để có hiệu suất tốt hơn
      draggedItem.style.left = `${percentX}%`;
      draggedItem.style.top = `${percentY}%`;
      draggedItem.style.transform = `translate3d(0, 0, 0)`;
    });

    // Làm nổi bật vùng thả khi di chuột qua
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

  // Đặt lại style và kích thước
  draggedItem.style.position = "relative";
  draggedItem.style.left = "auto";
  draggedItem.style.top = "auto";
  draggedItem.style.width = "auto";
  draggedItem.style.height = "auto";
  draggedItem.style.minWidth = "auto";
  draggedItem.style.transform = ""; // Đặt lại transform để áp dụng transition CSS
  draggedItem.style.margin = "0";

  // Thêm transition mượt mà (sẽ được định nghĩa trong CSS)
  draggedItem.style.transition =
    "transform 0.3s ease-out, opacity 0.3s ease-out, left 0s, top 0s";

  // Thêm vào dropzone
  zone.appendChild(draggedItem);
  draggedItem.dataset.placedIn = zone.dataset.zoneIndex;
  draggedItem.dataset.originalLeft =
    originalPosition[draggedItem.dataset.index].left;
  draggedItem.dataset.originalTop =
    originalPosition[draggedItem.dataset.index].top;

  // Xóa transition sau khi hoàn thành để tránh xung đột với các hoạt ảnh khác
  // Sử dụng sự kiện transitionend để đảm bảo nó chỉ xóa khi transition kết thúc
  const onTransitionEnd = () => {
    draggedItem.style.transition = "";
    draggedItem.removeEventListener("transitionend", onTransitionEnd);
  };
  draggedItem.addEventListener("transitionend", onTransitionEnd);

  // Phản hồi rung
  if (navigator.vibrate) navigator.vibrate(100);
}

function returnToOriginalPosition() {
  if (!draggedItem) return;

  const idx = draggedItem.dataset.index;
  const original = originalPosition[idx];

  // Nếu item đang ở trong dropzone
  const wasInDropzone = draggedItem.dataset.placedIn !== undefined;

  // Đặt lại các style
  draggedItem.style.position = "absolute";
  draggedItem.style.margin = "0";
  draggedItem.style.width = original.width;
  draggedItem.style.height = original.height;
  draggedItem.style.minWidth = original.minWidth;

  // Thêm transition mượt mà với thời gian khác nhau tùy trường hợp
  const transitionTime = wasInDropzone ? "0.6s" : "0.4s";
  draggedItem.style.transition = `all ${transitionTime} cubic-bezier(0.175, 0.885, 0.32, 1.275)`;
  draggedItem.style.left = original.left;
  draggedItem.style.top = original.top;

  // Di chuyển về container gốc
  setTimeout(
    () => {
      document.getElementById("draggables-container").appendChild(draggedItem);
      draggedItem.style.transition = ""; // Xóa transition sau khi hoàn thành
      delete draggedItem.dataset.placedIn;

      // Thêm hiệu ứng nảy khi từ dropzone trở về
      if (wasInDropzone) {
        draggedItem.style.animation = "bounceBack 0.5s ease-out";
        // Xóa hoạt ảnh sau khi hoàn thành
        setTimeout(() => {
          draggedItem.style.animation = "";
        }, 500);
      }
    },
    wasInDropzone ? 600 : 400 // Thời gian trễ để hoạt ảnh hoàn thành
  );
}

function cleanupDrag() {
  if (draggedItem) {
    draggedItem.classList.remove("dragging");
    draggedItem.style.zIndex = "5";
    // Đặt lại transform để hoạt ảnh CSS có thể hoạt động
    draggedItem.style.transform = "";
    draggedItem.style.willChange = "";
    draggedItem.style.transition = ""; // Đảm bảo transition được khôi phục

    // Kiểm tra nếu item bị kéo ra khỏi dropzone nhưng không vào dropzone mới
    const wasInDropzone = draggedItem.dataset.placedIn !== undefined;
    const isOverDropzone = document
      .elementFromPoint(
        draggedItem.getBoundingClientRect().left + draggedItem.offsetWidth / 2,
        draggedItem.getBoundingClientRect().top + draggedItem.offsetHeight / 2
      )
      ?.closest(".dropzone");

    if (wasInDropzone && !isOverDropzone) {
      returnToOriginalPosition();
    }
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

    // Chỉ cập nhật nếu trạng thái thay đổi
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

// Lắng nghe sự kiện nút
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

  const dropzones = document.querySelectorAll(".dropzone");
  let correctCount = 0;
  const totalDraggables = jsonData.question.task.elements.length;
  let allPlaced = true; // Theo dõi xem tất cả các item có thể kéo đã được đặt chưa

  // Xóa các lớp phản hồi trước đó và đảm bảo tất cả các dropzone đều được kiểm tra
  dropzones.forEach((zone) => {
    zone.classList.remove("correct-feedback", "incorrect-feedback");
  });

  // Lặp qua từng item có thể kéo để xác định trạng thái của nó
  document.querySelectorAll(".draggable-item").forEach((item) => {
    const itemIndex = item.dataset.index;
    const placedInZoneIndex = item.dataset.placedIn;
    let isCorrectlyPlaced = false;

    if (placedInZoneIndex !== undefined) {
      const targetDropzoneData =
        jsonData.question.task.dropZones[parseInt(placedInZoneIndex)];
      // Kiểm tra xem chỉ số của item có nằm trong các phần tử đúng cho dropzone này không
      if (
        targetDropzoneData &&
        targetDropzoneData.correctElements.includes(itemIndex)
      ) {
        isCorrectlyPlaced = true;
      }

      // Tìm phần tử DOM dropzone thực tế và áp dụng phản hồi
      const currentDropzoneEl = document.querySelector(
        `.dropzone[data-zone-index="${placedInZoneIndex}"]`
      );
      if (currentDropzoneEl) {
        if (isCorrectlyPlaced) {
          currentDropzoneEl.classList.add("correct-feedback");
          correctCount++;
        } else {
          currentDropzoneEl.classList.add("incorrect-feedback");
        }
      }
    } else {
      // Nếu một item không được đặt vào bất kỳ dropzone nào, nó không đúng hoặc chưa được thực hiện
      allPlaced = false;
    }
  });

  // Xử lý các trường hợp một số item có thể chưa được đặt
  const unplacedItems =
    totalDraggables -
    document.querySelectorAll(".draggable-item[data-placed-in]").length;
  if (unplacedItems > 0) {
    allPlaced = false; // Đánh dấu là chưa đặt tất cả nếu có các item chưa đặt
  }

  const allCorrectAndPlaced = correctCount === totalDraggables && allPlaced;

  // Hiển thị thông báo phản hồi chung
  showFeedback(allCorrectAndPlaced, correctCount, totalDraggables);

  // Hiển thị lễ kỷ niệm nếu tất cả đều đúng và tất cả các item đều được đặt
  if (allCorrectAndPlaced) {
    createConfetti();
    showNotification(
      "Hoàn hảo! Tất cả các câu trả lời đều đúng! 🎉",
      "success"
    );
    showCompletionNotification(correctCount, totalDraggables);
  } else if (!allPlaced) {
    showNotification(
      `Một số item chưa được đặt. Vui lòng hoàn thành nhiệm vụ.`,
      "warning"
    );
  } else {
    showNotification(
      `Hãy cố gắng lên! Bạn đã làm đúng ${correctCount} trên ${totalDraggables} câu.`,
      "error"
    );
  }

  // Phản hồi rung
  if (navigator.vibrate) {
    navigator.vibrate(allCorrectAndPlaced ? [100, 50, 100] : [200]);
  }
}

function resetGame() {
  // Xóa phản hồi
  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.classList.remove("correct-feedback", "incorrect-feedback", "hovered");
  });

  // Đặt lại tất cả các item có thể kéo
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
    item.style.transition = ""; // Đảm bảo transition được xóa

    document.getElementById("draggables-container").appendChild(item);
    delete item.dataset.placedIn;
  });

  // Ẩn phản hồi
  hideFeedback();

  // Hiển thị thông báo
  showNotification("Câu đố đã được đặt lại! 🔄", "info");

  // Phản hồi rung
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

      // Thêm hoạt ảnh
      item.style.animation = "dropAnimation 0.3s ease-out";
      // Xóa hoạt ảnh sau khi hoàn thành
      setTimeout(() => {
        item.style.animation = "";
      }, 300);
    }
  });

  // Đánh dấu tất cả là đúng
  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.classList.add("correct-feedback");
    zone.classList.remove("incorrect-feedback");
  });

  // Hiển thị phản hồi thành công
  showFeedback(true, zones.length, zones.length);

  // Hiển thị lễ kỷ niệm
  createConfetti();
  showNotification("Giải pháp đã được tiết lộ! 🎓", "success");
  showCompletionNotification(zones.length, zones.length);

  // Phản hồi rung
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

// Ngăn chặn các hành vi chạm mặc định có thể gây nhiễu với việc kéo
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

// Xử lý thay đổi hướng màn hình
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    containerRect = document
      .getElementById("task-background")
      .getBoundingClientRect();
  }, 100);
});

// Xử lý thay đổi kích thước cửa sổ
window.addEventListener("resize", () => {
  containerRect = document
    .getElementById("task-background")
    .getBoundingClientRect();
});

// Thêm các keyframe hoạt ảnh CSS động
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

// Khởi tạo trò chơi
loadGame();
