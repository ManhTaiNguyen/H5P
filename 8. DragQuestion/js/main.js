document.addEventListener("DOMContentLoaded", function () {
  fetch("content/content.json")
    .then((response) => response.json())
    .then((data) => {
      initializeDragDrop(data);
    })
    .catch((error) => {
      console.error("Error loading content:", error);
      document.getElementById("question-text").textContent =
        "Error loading content. Please try again.";
    });

  // Font size control
  const fontSizeRange = document.getElementById("fontSizeRange");
  const fontSizeValue = document.getElementById("fontSizeValue");

  // Khởi tạo giá trị ban đầu từ CSS
  const initialFontSize = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--base-font-size"
    )
  );
  fontSizeRange.value = initialFontSize;
  fontSizeValue.textContent = initialFontSize + "px";

  fontSizeRange.addEventListener("input", function () {
    const newSize = this.value;
    fontSizeValue.textContent = newSize + "px";

    // Cập nhật biến CSS root
    document.documentElement.style.setProperty(
      "--base-font-size",
      newSize + "px"
    );

    // Cập nhật các phần tử text (trừ button)
    updateTextElementsSize(newSize);
  });

  // Kích hoạt sự kiện input ban đầu
  fontSizeRange.dispatchEvent(new Event("input"));
});

// Hàm cập nhật kích thước cho các phần tử text (trừ button)
function updateTextElementsSize(baseSize) {
  const textElements = [
    ...document.querySelectorAll(".question-introduction"),
    ...document.querySelectorAll(".draggable-item"),
    ...document.querySelectorAll(".dropzone-label"),
    ...document.querySelectorAll(".feedback-item"),
    ...document.querySelectorAll(".control-group label"),
    document.getElementById("fontSizeValue"),
  ];

  textElements.forEach((el) => {
    if (el.classList.contains("draggable-item")) {
      el.style.fontSize = `${baseSize - 2}px`;
    } else if (el.classList.contains("dropzone-label")) {
      el.style.fontSize = `${baseSize - 3}px`;
    } else {
      el.style.fontSize = `${baseSize}px`;
    }
  });
}

function initializeDragDrop(data) {
  const questionText = document.getElementById("question-text");
  const draggablesContainer = document.getElementById("draggables-container");
  const dropzonesContainer = document.getElementById("dropzones-container");
  const taskBackground = document.getElementById("task-background");
  const checkBtn = document.getElementById("checkBtn");
  const resetBtn = document.getElementById("resetBtn");
  const showAnswersBtn = document.getElementById("showAnswersBtn");
  const feedbackContainer = document.getElementById("feedback-container");

  // Set background image
  const backgroundImagePath =
    "content/" + data.question.settings.background.path;
  taskBackground.style.backgroundImage = `url(${backgroundImagePath})`;

  // Set question text if any
  if (data.question.introduction) {
    questionText.innerHTML = data.question.introduction;
  }

  // Create draggable elements
  const draggableElements = data.question.task.elements.map(
    (element, index) => {
      const draggable = document.createElement("div");
      draggable.className = "draggable-item";

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = element.type.params.text;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      draggable.textContent = plainText;
      draggable.dataset.label = plainText;

      draggable.setAttribute("draggable", "true");
      draggable.dataset.id = index;
      draggable.dataset.dropZones = element.dropZones.join(",");

      // Positioning
      draggable.style.position = "absolute";
      draggable.style.left = `${element.x}%`;
      draggable.style.top = `${element.y}%`;
      draggable.style.width = `min(${element.width + 10}%, 100px)`;
      draggable.style.height = `${element.height}%`;

      // Drag events
      draggable.addEventListener("dragstart", dragStart);
      draggable.addEventListener("dragend", dragEnd);

      return draggable;
    }
  );

  draggableElements.forEach((draggable) => {
    draggablesContainer.appendChild(draggable);
  });

  // Create drop zones
  const dropZones = data.question.task.dropZones.map((zone, index) => {
    const dropzone = document.createElement("div");
    dropzone.className = "dropzone";
    dropzone.dataset.id = index;
    dropzone.dataset.correctElements = zone.correctElements.join(",");

    // Positioning
    dropzone.style.position = "absolute";
    dropzone.style.left = `${zone.x}%`;
    dropzone.style.top = `${zone.y}%`;

    // Lấy đúng kích thước của quả tương ứng
    const correctElement = data.question.task.elements.find((el, idx) =>
      zone.correctElements.includes(idx.toString())
    );
    if (correctElement) {
      dropzone.style.width = `min(${correctElement.width}%, 80px)`;
      dropzone.style.height = `${correctElement.height}%`;
    }

    // Optional label
    if (zone.showLabel && zone.label) {
      const label = document.createElement("div");
      label.className = "dropzone-label";
      label.innerHTML = zone.label;
      dropzone.appendChild(label);
    }

    dropzone.addEventListener("dragover", dragOver);
    dropzone.addEventListener("dragenter", dragEnter);
    dropzone.addEventListener("dragleave", dragLeave);
    dropzone.addEventListener("drop", drop);

    return dropzone;
  });

  dropZones.forEach((dropzone) => {
    dropzonesContainer.appendChild(dropzone);
  });

  // Drag state
  let draggedItem = null;

  function dragStart(e) {
    draggedItem = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.innerHTML);

    const compatibleDropZones = this.dataset.dropZones.split(",");
    document.querySelectorAll(".dropzone").forEach((dz) => {
      if (compatibleDropZones.includes(dz.dataset.id)) {
        dz.classList.add("highlight");
      }
    });
  }

  function dragEnd() {
    this.classList.remove("dragging");
    document.querySelectorAll(".dropzone").forEach((dz) => {
      dz.classList.remove("highlight");
    });
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function dragEnter(e) {
    e.preventDefault();
    this.classList.add("active");
  }

  function dragLeave() {
    this.classList.remove("active");
  }

  function drop(e) {
    e.preventDefault();
    this.classList.remove("highlight", "active");

    const compatibleDropZones = draggedItem.dataset.dropZones.split(",");
    if (!compatibleDropZones.includes(this.dataset.id)) return;

    if (draggedItem.parentElement.classList.contains("dropzone")) {
      draggedItem.parentElement.classList.remove("filled");
    }

    this.appendChild(draggedItem);
    this.classList.add("filled");
  }

  // Check answers
  checkBtn.addEventListener("click", () => {
    let score = 0;
    const maxScore = dropZones.length;
    feedbackContainer.innerHTML = "";

    document.querySelectorAll(".dropzone").forEach((dz) => {
      const correct = dz.dataset.correctElements.split(",");
      const item = dz.querySelector(".draggable-item");

      const feedbackItem = document.createElement("div");
      feedbackItem.className = "feedback-item";

      if (item) {
        const isCorrect = correct.includes(item.dataset.id);
        feedbackItem.classList.add(isCorrect ? "correct" : "incorrect");

        feedbackItem.innerHTML = `<i class="fas ${
          isCorrect ? "fa-check-circle" : "fa-times-circle"
        }"></i>
          <span>${item.textContent} is ${
          isCorrect ? "correct" : "incorrect"
        }.</span>`;
        if (isCorrect) {
          score++;
          dz.classList.add("correct-feedback");
        } else {
          dz.classList.add("incorrect-feedback");
        }
      } else {
        feedbackItem.classList.add("incorrect");
        feedbackItem.innerHTML = `<i class="fas fa-times-circle"></i><span>No answer given.</span>`;
        dz.classList.add("incorrect-feedback");
      }

      feedbackContainer.appendChild(feedbackItem);
    });

    const scoreText = document.createElement("div");
    scoreText.className = "score-display";
    scoreText.innerHTML = `<strong>Score: ${score}/${maxScore}</strong> - ${data.scoreExplanation}`;
    feedbackContainer.prepend(scoreText);
    feedbackContainer.style.display = "block";
  });

  // Reset activity
  resetBtn.addEventListener("click", () => {
    draggablesContainer.innerHTML = "";
    dropzonesContainer.innerHTML = "";
    feedbackContainer.innerHTML = "";
    feedbackContainer.style.display = "none";
    initializeDragDrop(data);
  });

  // Show correct answers
  showAnswersBtn.addEventListener("click", () => {
    resetBtn.click();

    dropZones.forEach((zone, index) => {
      const correctId = zone.dataset.correctElements.split(",")[0];
      const element = draggableElements[correctId];
      const dz = document.querySelector(`.dropzone[data-id="${index}"]`);
      if (element && dz) {
        dz.appendChild(element);
        dz.classList.add("filled", "correct-feedback");
      }
    });

    feedbackContainer.innerHTML = `<div class="feedback-item correct"><i class="fas fa-lightbulb"></i> <span>This is the correct solution</span></div>`;
    feedbackContainer.style.display = "block";
  });

  // Touch support
  draggableElements.forEach((item) => {
    item.addEventListener("touchstart", touchStart, { passive: false });
    item.addEventListener("touchmove", touchMove, { passive: false });
    item.addEventListener("touchend", touchEnd, { passive: false });
  });

  dropZones.forEach((dz) => {
    dz.addEventListener("touchmove", (e) => e.preventDefault(), {
      passive: false,
    });
    dz.addEventListener("touchend", touchDrop, { passive: false });
  });

  let touchElement = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function touchStart(e) {
    touchElement = this;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    this.classList.add("dragging");
    e.preventDefault();
  }

  function touchMove(e) {
    if (!touchElement) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    touchElement.style.transform = `translate(${dx}px, ${dy}px)`;
    e.preventDefault();
  }

  function touchEnd(e) {
    if (!touchElement) return;
    touchElement.style.transform = "";
    touchElement.classList.remove("dragging");
    document
      .querySelectorAll(".dropzone")
      .forEach((dz) => dz.classList.remove("highlight"));
    touchElement = null;
    e.preventDefault();
  }

  function touchDrop(e) {
    if (!touchElement) return;
    const dz = this;
    const rect = dz.getBoundingClientRect();
    const touch = e.changedTouches[0];

    if (
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom
    ) {
      const compatible = touchElement.dataset.dropZones.split(",");
      if (!compatible.includes(dz.dataset.id)) return;

      if (touchElement.parentElement.classList.contains("dropzone")) {
        touchElement.parentElement.classList.remove("filled");
      }

      dz.appendChild(touchElement);
      dz.classList.add("filled");
    }

    touchElement = null;
    e.preventDefault();
  }
}
