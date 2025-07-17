const FONT_SIZE_RANGES = {
  min: 8,
  max: 16,
  default: 10,
};

const RESIZABLE_ELEMENTS = {
  draggableTexts: ".draggable-text",
};

class FontResizer {
  constructor() {
    this.currentSize = FONT_SIZE_RANGES.default;
    this.init();
  }

  init() {
    this.setupControls();
    this.applyFontSize(this.currentSize);
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
    });
  }

  applyFontSize(size) {
    // Calculate scale factor based on default size
    const scaleFactor = size / FONT_SIZE_RANGES.default;

    // Apply to draggable texts
    document
      .querySelectorAll(RESIZABLE_ELEMENTS.draggableTexts)
      .forEach((el) => {
        el.style.fontSize = `${size}px`;

        // Adjust parent item size to accommodate text
        const item = el.closest(".draggable-item");
        if (item) {
          const originalWidth = parseFloat(item.dataset.originalWidth || "0");
          if (originalWidth) {
            item.style.minWidth = `${originalWidth * scaleFactor}%`;
          }
        }
      });

    // Apply to drop zones
    document
      .querySelectorAll(RESIZABLE_ELEMENTS.dropZoneTexts)
      .forEach((el) => {
        el.style.fontSize = `${size}px`;

        // Adjust drop zone size proportionally
        const originalWidth = parseFloat(el.dataset.originalWidth || "0");
        const originalHeight = parseFloat(el.dataset.originalHeight || "0");
        if (originalWidth && originalHeight) {
          el.style.width = `${originalWidth * scaleFactor}%`;
          el.style.height = `${originalHeight * scaleFactor}%`;
        }
      });

    // Other elements
    const title = document.querySelector(RESIZABLE_ELEMENTS.title);
    if (title) {
      title.style.fontSize = `${size * 1.5}px`;
    }

    const instruction = document.querySelector(
      RESIZABLE_ELEMENTS.headerInstruction
    );
    if (instruction) {
      instruction.style.fontSize = `${size * 0.8}px`;
    }

    const feedback = document.querySelector(RESIZABLE_ELEMENTS.feedbackText);
    if (feedback) {
      feedback.style.fontSize = `${size}px`;
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
    }
  }
}

const fontResizer = new FontResizer();
window.fontResizer = fontResizer;
