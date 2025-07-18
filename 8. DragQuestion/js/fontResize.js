// fontResize.js

const FONT_SIZE_RANGES = {
  min: 8,
  max: 20,
  default: 10,
  threshold: 12, // Items move to overflow container when font size is >= 12
};

const RESIZABLE_ELEMENTS = {
  draggableTexts: ".draggable-text",
  overflowContainer: "#overflow-draggables",
};

class FontResizer {
  constructor() {
    this.currentSize = FONT_SIZE_RANGES.default;
    this.originalPositions = {};
    this.init();
  }

  init() {
    this.storeOriginalPositions();
    this.setupControls();
    this.applyFontSize(this.currentSize);
    this.handleOverflowItems(); // Initial check for overflow
  }

  storeOriginalPositions() {
    document.querySelectorAll(".draggable-item").forEach((item, index) => {
      const container = document.getElementById("task-background");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      // Calculate position as percentage
      const leftPercent =
        ((itemRect.left - containerRect.left) / containerRect.width) * 100;
      const topPercent =
        ((itemRect.top - containerRect.top) / containerRect.height) * 100;

      this.originalPositions[index] = {
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: item.style.width || "auto",
        height: item.style.height || "auto",
        minWidth: item.style.minWidth || `${item.dataset.originalWidth}px`,
        // Store original parent as well
        originalParent: item.parentElement.id,
      };

      item.dataset.index = index;
    });
  }

  setupControls() {
    const rangeInput = document.getElementById("fontSizeRange");
    const sizeValue = document.getElementById("fontSizeValue");

    if (!rangeInput || !sizeValue) return;

    rangeInput.min = FONT_SIZE_RANGES.min;
    rangeInput.max = FONT_SIZE_RANGES.max;
    rangeInput.value = this.currentSize;
    sizeValue.textContent = `${this.currentSize}px`;

    rangeInput.addEventListener("input", (e) => {
      this.currentSize = parseInt(e.target.value);
      sizeValue.textContent = `${this.currentSize}px`;
      this.applyFontSize(this.currentSize);
      this.handleOverflowItems();
    });
  }

  applyFontSize(size) {
    document
      .querySelectorAll(RESIZABLE_ELEMENTS.draggableTexts)
      .forEach((el) => {
        // Bỏ qua các item đã được đặt trong drop zone
        const item = el.closest(".draggable-item");
        if (item && item.dataset.placedIn) return;

        el.style.fontSize = `${size}px`;

        if (item) {
          const originalWidth = parseFloat(item.dataset.originalWidth || "0");
          if (originalWidth) {
            // Adjust minWidth based on font size ratio
            item.style.minWidth = `${
              originalWidth * (size / FONT_SIZE_RANGES.default)
            }px`;
          }
        }
      });
  }

  // Trong hàm handleOverflowItems
  handleOverflowItems() {
    const overflowContainer = document.querySelector(
      RESIZABLE_ELEMENTS.overflowContainer
    );
    const draggablesContainer = document.getElementById("draggables-container");

    if (!overflowContainer || !draggablesContainer) return;

    // Không xử lý nếu đang kéo item
    if (isDragging) return;

    if (this.currentSize >= FONT_SIZE_RANGES.threshold) {
      Array.from(document.querySelectorAll(".draggable-item")).forEach(
        (item) => {
          // Chỉ di chuyển items không được đặt trong dropzone
          if (
            item.parentElement === draggablesContainer &&
            !item.dataset.placedIn
          ) {
            if (!this.originalPositions[item.dataset.index]) {
              this.storeOriginalPositions();
            }

            item.style.position = "static";
            item.style.left = "auto";
            item.style.top = "auto";
            item.style.margin = "5px";
            item.style.transform = "none";
            item.style.transition = "all 0.3s ease-out";

            overflowContainer.appendChild(item);
          }
        }
      );
    } else {
      Array.from(overflowContainer.querySelectorAll(".draggable-item")).forEach(
        (item) => {
          const original = this.originalPositions[item.dataset.index];

          if (original && !item.dataset.placedIn) {
            item.style.position = "absolute";
            item.style.left = original.left;
            item.style.top = original.top;
            item.style.width = original.width;
            item.style.height = original.height;
            item.style.minWidth = original.minWidth;
            item.style.margin = "0";
            item.style.transform = "none";
            item.style.transition = "all 0.3s ease-out";

            draggablesContainer.appendChild(item);
          }
        }
      );
    }
  }

  getCurrentSize() {
    return this.currentSize;
  }

  setFontSize(size) {
    if (size >= FONT_SIZE_RANGES.min && size <= FONT_SIZE_RANGES.max) {
      this.currentSize = size;
      const rangeInput = document.getElementById("fontSizeRange");
      const sizeValue = document.getElementById("fontSizeValue");

      if (rangeInput) rangeInput.value = size;
      if (sizeValue) sizeValue.textContent = `${size}px`;

      this.applyFontSize(size);
      this.handleOverflowItems();
    }
  }
}

const fontResizer = new FontResizer();
window.fontResizer = fontResizer;
