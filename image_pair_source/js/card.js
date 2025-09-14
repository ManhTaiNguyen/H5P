// Card class for Image Pair game

class ImagePairCard {
  constructor(cardData, index, isMatchCard = false) {
    this.data = cardData;
    this.index = index;
    this.isMatchCard = isMatchCard;
    this.isMatched = false;
    this.isSelected = false;
    this.matchedWith = null;
    this.element = null;

    // Touch drag properties
    this.touchStartPos = null;
    this.isDragging = false;
    this.dragGhost = null;
    this.startTime = 0;

    // Prevent infinite loop in event handling
    this.isHandlingClick = false;

    this.init();
  }

  init() {
    this.createElement();
    this.bindEvents();
  }

  createElement() {
    this.element = Utils.createElement("div", ["image-pair-card"], {
      "data-index": this.index,
      "data-type": this.isMatchCard ? "match" : "image",
      draggable: this.isMatchCard ? "false" : "true",
      tabindex: "0",
      role: "button",
      "aria-label": `Card ${this.index + 1}`,
    });

    const imageContainer = Utils.createElement("div", ["card-image-container"]);

    const image = Utils.createElement("img", ["card-image"], {
      src: this.getImagePath(),
      alt: `Card ${this.index + 1}`,
      loading: "lazy",
    });

    const statusIndicator = Utils.createElement("div", ["card-status"]);

    imageContainer.appendChild(image);
    this.element.appendChild(imageContainer);
    this.element.appendChild(statusIndicator);

    // Handle image load error
    image.onerror = () => {
      console.warn(`Failed to load image: ${this.getImagePath()}`);
      image.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";
    };

    // Add zoom functionality when image loads successfully
    image.onload = () => {
      if (window.imageZoomManager) {
        window.imageZoomManager.attachToImage(image);
      }
    };

    // If image is already loaded (from cache), attach zoom immediately
    if (image.complete && image.naturalHeight !== 0) {
      if (window.imageZoomManager) {
        window.imageZoomManager.attachToImage(image);
      }
    }
  }

  getImagePath() {
    const imagePath = this.isMatchCard
      ? this.data.match.path
      : this.data.image.path;
    return `content/${imagePath}`;
  }

  bindEvents() {
    if (!this.isMatchCard) {
      // Drag events for source cards
      this.element.addEventListener(
        "dragstart",
        this.handleDragStart.bind(this)
      );
      this.element.addEventListener("dragend", this.handleDragEnd.bind(this));

      // Click events
      this.element.addEventListener("click", this.handleClick.bind(this));

      // Keyboard events
      this.element.addEventListener("keydown", this.handleKeyDown.bind(this));

      // Touch events for mobile
      if (Utils.isTouchDevice()) {
        this.element.addEventListener(
          "touchstart",
          this.handleTouchStart.bind(this),
          { passive: false }
        );
        this.element.addEventListener(
          "touchmove",
          this.handleTouchMove.bind(this),
          { passive: false }
        );
        this.element.addEventListener(
          "touchend",
          this.handleTouchEnd.bind(this),
          { passive: false }
        );
      }
    }

    // Hover effects
    this.element.addEventListener(
      "mouseenter",
      this.handleMouseEnter.bind(this)
    );
    this.element.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );
  }

  handleDragStart(e) {
    if (this.isMatched) {
      e.preventDefault();
      return;
    }

    this.element.classList.add("dragging");
    e.dataTransfer.setData("text/plain", this.index.toString());
    e.dataTransfer.effectAllowed = "move";

    // Create custom drag image
    const dragImage = this.element.cloneNode(true);
    dragImage.style.transform = "rotate(5deg)";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 60, 60);

    setTimeout(() => {
      if (dragImage.parentNode) {
        dragImage.parentNode.removeChild(dragImage);
      }
    }, 0);

    // Note: Don't call this.dispatchEvent here as it would create a recursive call
    // The drag event is already being handled by the browser
  }

  handleDragEnd(e) {
    this.element.classList.remove("dragging");
    // Note: Don't call this.dispatchEvent here as the drag event is handled by the browser
  }

  handleClick(e) {
    // Prevent infinite loop
    if (this.isHandlingClick) {
      return;
    }

    if (this.isMatched || this.isMatchCard) return;

    this.isHandlingClick = true;

    try {
      this.toggleSelection();
      this.dispatchEvent("click", { card: this });
    } catch (error) {
      console.error("Error in handleClick:", error);
    } finally {
      // Reset flag after a small delay to allow event to complete
      setTimeout(() => {
        this.isHandlingClick = false;
      }, 10);
    }
  }

  handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();

      // Prevent calling handleClick if already handling a click
      if (!this.isHandlingClick) {
        this.handleClick(e);
      }
    }
  }

  handleTouchStart(e) {
    if (this.isMatched) return;

    // Check if there's already a card being dragged (mobile single drag restriction)
    if (
      Utils.isTouchDevice() &&
      document.querySelector(".image-pair-card.touch-dragging")
    ) {
      e.preventDefault();
      return;
    }

    this.touchStartPos = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    this.isDragging = false;
    this.startTime = Date.now();

    // Add slight haptic feedback if available and user has interacted
    if (navigator.vibrate && window.userHasInteracted !== false) {
      try {
        navigator.vibrate(10);
      } catch (error) {
        // Silently ignore vibration errors and disable future attempts
        console.debug("Vibration blocked:", error.message);
        window.userHasInteracted = false;
      }
    }
  }

  handleTouchMove(e) {
    if (this.isMatched || !this.touchStartPos) return;

    // Check if there's already another card being dragged
    if (
      Utils.isTouchDevice() &&
      document.querySelector(
        '.image-pair-card.touch-dragging:not([data-index="' + this.index + '"])'
      )
    ) {
      e.preventDefault();
      return;
    }

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
    const timeDelta = Date.now() - this.startTime;

    // Threshold for starting drag (more sensitive)
    if ((deltaX > 5 || deltaY > 5) && timeDelta > 100) {
      e.preventDefault();

      if (!this.isDragging) {
        this.startTouchDrag(touch);
      }

      this.updateTouchDrag(touch);
    }
  }

  startTouchDrag(touch) {
    this.isDragging = true;
    this.element.classList.add("touch-dragging");

    // Create ghost element that follows finger
    this.createDragGhost();

    // Give visual feedback to original card
    this.element.style.opacity = "0.3";
    this.element.style.transform = "scale(0.95)";

    // Prevent text selection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // Update ghost position
    this.updateGhostPosition(touch.clientX, touch.clientY);
  }

  createDragGhost() {
    this.dragGhost = this.element.cloneNode(true);
    this.dragGhost.classList.add("drag-ghost");
    this.dragGhost.style.position = "fixed";
    this.dragGhost.style.pointerEvents = "none";
    this.dragGhost.style.zIndex = "9999";
    this.dragGhost.style.width = "120px";
    this.dragGhost.style.height = "120px";
    this.dragGhost.style.transform = "scale(1.1) rotate(3deg)";
    this.dragGhost.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.3)";
    this.dragGhost.style.transition = "none";
    this.dragGhost.style.opacity = "0.9";

    document.body.appendChild(this.dragGhost);
  }

  updateTouchDrag(touch) {
    if (this.dragGhost) {
      this.updateGhostPosition(touch.clientX, touch.clientY);
    }

    // Check for drop zone under touch and provide visual feedback
    this.updateTouchDropZoneFeedback(touch.clientX, touch.clientY);
  }

  updateGhostPosition(x, y) {
    if (this.dragGhost) {
      this.dragGhost.style.left = x - 60 + "px";
      this.dragGhost.style.top = y - 60 + "px";
    }
  }

  updateTouchDropZoneFeedback(x, y) {
    // Remove previous feedback
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.classList.remove("drag-over", "touch-hover");
    });

    // Find drop zone under touch
    const elementBelow = document.elementFromPoint(x, y);
    const dropZone = elementBelow?.closest(".drop-zone");

    if (dropZone && !dropZone.classList.contains("occupied")) {
      dropZone.classList.add("drag-over", "touch-hover");

      // Add haptic feedback when hovering over valid drop zone
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    }
  }

  handleTouchEnd(e) {
    if (this.isMatched) return;

    if (this.isDragging) {
      e.preventDefault();
      const touch = e.changedTouches[0];

      // Find drop zone at touch position
      const elementBelow = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      );
      let dropZone = elementBelow?.closest(".drop-zone");

      // If not found, try to find by coordinates
      if (!dropZone) {
        const dropZones = document.querySelectorAll(".drop-zone");
        dropZones.forEach((zone) => {
          const rect = zone.getBoundingClientRect();
          if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
          ) {
            dropZone = zone;
          }
        });
      }

      if (dropZone) {
        // Add success haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([10, 50, 10]);
        }

        // Create custom event with more details
        const customEvent = new CustomEvent("touchdrop", {
          detail: {
            card: this,
            dropZone: dropZone,
            touch: touch,
            coordinates: { x: touch.clientX, y: touch.clientY },
          },
          bubbles: true,
        });
        document.dispatchEvent(customEvent);
      } else {
        // Feedback for failed drop
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }

      this.cleanupTouchDrag();
    } else {
      // Simple tap - check if it was quick enough
      const timeDelta = Date.now() - this.startTime;
      if (timeDelta < 300 && !this.isHandlingClick) {
        this.handleClick(e);
      }
    }

    this.touchStartPos = null;
    this.isDragging = false;
  }

  cleanupTouchDrag() {
    // Remove ghost element
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }

    // Reset original card styles
    this.element.style.opacity = "";
    this.element.style.transform = "";
    this.element.classList.remove("touch-dragging");

    // Reset body styles
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";

    // Clear drop zone feedback
    document.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.classList.remove("drag-over", "touch-hover");
    });
  }

  handleMouseEnter() {
    if (this.isMatched) return;
    this.element.classList.add("hover");
  }

  handleMouseLeave() {
    this.element.classList.remove("hover");
  }

  toggleSelection() {
    this.isSelected = !this.isSelected;
    this.element.classList.toggle("selected", this.isSelected);
    this.element.setAttribute("aria-selected", this.isSelected.toString());
  }

  setSelected(selected = true) {
    this.isSelected = selected;
    this.element.classList.toggle("selected", selected);
    this.element.setAttribute("aria-selected", selected.toString());
  }

  setMatched(matched = true, matchedWith = null) {
    this.isMatched = matched;
    this.matchedWith = matchedWith;
    this.element.classList.toggle("matched", matched);
    this.element.setAttribute("aria-disabled", matched.toString());

    if (matched) {
      this.element.classList.remove("selected", "incorrect");
      this.isSelected = false;
      Utils.animate(
        this.element,
        [
          { transform: "scale(1)" },
          { transform: "scale(1.1)" },
          { transform: "scale(1)" },
        ],
        { duration: 400 }
      );
    }
  }

  setIncorrect(incorrect = true) {
    this.element.classList.toggle("incorrect", incorrect);

    if (incorrect) {
      setTimeout(() => {
        this.element.classList.remove("incorrect");
      }, 2000);
    }
  }

  setDisabled(disabled = true) {
    this.element.classList.toggle("disabled", disabled);
    this.element.setAttribute("aria-disabled", disabled.toString());

    if (disabled) {
      this.element.setAttribute("tabindex", "-1");
    } else {
      this.element.setAttribute("tabindex", "0");
    }
  }

  focus() {
    this.element.focus();
  }

  dispatchEvent(eventName, detail = {}) {
    // Add safety check to prevent infinite loops
    if (this.isHandlingClick && eventName === "click") {
      console.warn("Prevented potential infinite loop in click event dispatch");
      return;
    }

    const event = new CustomEvent(eventName, {
      detail: detail,
      bubbles: true,
    });
    this.element.dispatchEvent(event);
  }

  destroy() {
    // Clean up any ongoing touch drag
    if (this.isDragging) {
      this.cleanupTouchDrag();
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
