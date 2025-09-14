// Drag and Drop functionality for Image Pair game

class DragDropManager {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.dropZones = [];
    this.draggedCard = null;
    this.activeDropZone = null;

    this.init();
  }

  init() {
    this.createDropZones();
    this.bindGlobalEvents();
  }

  createDropZones() {
    const matchesContainer = document.getElementById("matches-container");
    matchesContainer.innerHTML = "";
    this.dropZones = [];

    this.gameLogic.cards.forEach((cardData, index) => {
      const dropZone = this.createDropZone(cardData, index);
      matchesContainer.appendChild(dropZone);
      this.dropZones.push(dropZone);
    });
  }

  createDropZone(cardData, index) {
    const dropZone = Utils.createElement("div", ["drop-zone"], {
      "data-index": index,
      role: "button",
      tabindex: "0",
      "aria-label": `Drop zone ${index + 1}`,
    });

    // Create match card to display in drop zone
    const matchCard = this.createMatchCard(cardData, index);
    dropZone.appendChild(matchCard);

    // Bind drop zone events
    this.bindDropZoneEvents(dropZone);

    return dropZone;
  }

  createMatchCard(cardData, index) {
    const matchCard = Utils.createElement(
      "div",
      ["image-pair-card", "match-card"],
      {
        "data-index": index,
        "data-type": "match",
      }
    );

    const imageContainer = Utils.createElement("div", ["card-image-container"]);

    const image = Utils.createElement("img", ["card-image"], {
      src: `content/${cardData.match.path}`,
      alt: `Match ${index + 1}`,
      loading: "lazy",
    });

    // Handle image load error
    image.onerror = () => {
      console.warn(`Failed to load match image: ${cardData.match.path}`);
      image.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+";
    };

    imageContainer.appendChild(image);
    matchCard.appendChild(imageContainer);

    return matchCard;
  }

  bindDropZoneEvents(dropZone) {
    // Drag and drop events
    dropZone.addEventListener("dragover", this.handleDragOver.bind(this));
    dropZone.addEventListener("dragenter", this.handleDragEnter.bind(this));
    dropZone.addEventListener("dragleave", this.handleDragLeave.bind(this));
    dropZone.addEventListener("drop", this.handleDrop.bind(this));

    // Click events for keyboard/touch accessibility
    dropZone.addEventListener("click", this.handleDropZoneClick.bind(this));
    dropZone.addEventListener("keydown", this.handleDropZoneKeyDown.bind(this));
  }

  bindGlobalEvents() {
    // Listen for card events
    document.addEventListener("dragstart", this.handleCardDragStart.bind(this));
    document.addEventListener("dragend", this.handleCardDragEnd.bind(this));
    document.addEventListener("touchdrop", this.handleTouchDrop.bind(this));

    // Clean up any stuck touch states on window focus
    window.addEventListener("focus", this.cleanupStuckTouchStates.bind(this));
    window.addEventListener(
      "visibilitychange",
      this.cleanupStuckTouchStates.bind(this)
    );
  }

  cleanupStuckTouchStates() {
    // Clean up any stuck touch-dragging states
    const stuckCards = document.querySelectorAll(
      ".image-pair-card.touch-dragging"
    );
    stuckCards.forEach((card) => {
      card.classList.remove("touch-dragging");
      card.style.opacity = "";
      card.style.transform = "";
    });

    // Clean up any ghost elements
    const ghosts = document.querySelectorAll(".drag-ghost");
    ghosts.forEach((ghost) => ghost.remove());

    // Reset body styles
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
  }

  handleCardDragStart(e) {
    const cardElement = e.target.closest(".image-pair-card");
    if (!cardElement) return;

    const cardIndex = parseInt(cardElement.dataset.index);
    // Find the card object by matching the index
    this.draggedCard = this.gameLogic.sourceCards.find(
      (card) => card.index === cardIndex
    );

    // Highlight valid drop zones
    this.highlightDropZones(true);
  }

  handleCardDragEnd(e) {
    this.draggedCard = null;
    this.highlightDropZones(false);
    this.clearDropZoneStates();
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  handleDragEnter(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;

    if (this.canDrop(dropZone)) {
      dropZone.classList.add("drag-over");
      this.activeDropZone = dropZone;
    }
  }

  handleDragLeave(e) {
    const dropZone = e.currentTarget;
    const rect = dropZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Only remove drag-over if mouse is actually outside the drop zone
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dropZone.classList.remove("drag-over");
      if (this.activeDropZone === dropZone) {
        this.activeDropZone = null;
      }
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    const cardIndex = parseInt(e.dataTransfer.getData("text/plain"));

    this.processDrop(cardIndex, dropZone);
  }

  handleTouchDrop(e) {
    const cardIndex = e.detail.card.index;
    const dropZone = e.detail.dropZone;

    this.processDrop(cardIndex, dropZone);
  }

  handleDropZoneClick(e) {
    const dropZone = e.currentTarget;
    const selectedCard = this.gameLogic.getSelectedCard();

    if (selectedCard && this.canDrop(dropZone)) {
      this.processDrop(selectedCard.index, dropZone);
    }
  }

  handleDropZoneKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.handleDropZoneClick(e);
    }
  }

  processDrop(cardIndex, dropZone) {
    const dropZoneIndex = parseInt(dropZone.dataset.index);

    if (!this.canDrop(dropZone) || cardIndex === undefined) {
      this.showInvalidDrop(dropZone);
      return;
    }

    // Find the source card by index
    const sourceCard = this.gameLogic.sourceCards.find(
      (card) => card.index === cardIndex
    );
    if (!sourceCard) {
      console.error("Source card not found for index:", cardIndex);
      this.showInvalidDrop(dropZone);
      return;
    }

    const success = this.gameLogic.makeMatch(cardIndex, dropZoneIndex);

    if (success) {
      this.showSuccessfulDrop(dropZone, sourceCard);
    } else {
      this.showInvalidDrop(dropZone);
    }

    this.clearDropZoneStates();
  }

  canDrop(dropZone) {
    // Check if drop zone is already occupied
    return (
      !dropZone.classList.contains("occupied") &&
      !dropZone.classList.contains("correct")
    );
  }

  showSuccessfulDrop(dropZone, sourceCard) {
    dropZone.classList.add("occupied", "correct");

    // Find the match card in the drop zone and show success state
    const matchCard = dropZone.querySelector(".match-card");
    if (matchCard) {
      matchCard.classList.add("matched");
    }

    // Animation
    Utils.animate(
      dropZone,
      [
        { transform: "scale(1)" },
        { transform: "scale(1.1)" },
        { transform: "scale(1)" },
      ],
      { duration: 500 }
    );
  }

  showInvalidDrop(dropZone) {
    dropZone.classList.add("incorrect");

    Utils.animate(
      dropZone,
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 400 }
    );

    setTimeout(() => {
      dropZone.classList.remove("incorrect");
    }, 1500);
  }

  highlightDropZones(highlight) {
    this.dropZones.forEach((zone) => {
      if (highlight && this.canDrop(zone)) {
        zone.classList.add("highlighted");
      } else {
        zone.classList.remove("highlighted");
      }
    });
  }

  clearDropZoneStates() {
    this.dropZones.forEach((zone) => {
      zone.classList.remove("drag-over", "highlighted");
    });
    this.activeDropZone = null;
  }

  resetDropZone(index) {
    const dropZone = this.dropZones[index];
    if (dropZone) {
      dropZone.classList.remove("occupied", "correct", "incorrect");

      // Reset the match card to its original state
      const matchCard = dropZone.querySelector(".match-card");
      if (matchCard) {
        matchCard.classList.remove("matched");
      }
    }
  }

  resetAllDropZones() {
    this.dropZones.forEach((zone, index) => {
      this.resetDropZone(index);
    });
  }

  showSolution() {
    this.gameLogic.cards.forEach((cardData, index) => {
      const dropZone = this.dropZones[index];
      // Find the correct source card by index
      const sourceCard = this.gameLogic.sourceCards.find(
        (card) => card.index === index
      );

      if (!dropZone.classList.contains("correct") && sourceCard) {
        this.showSuccessfulDrop(dropZone, sourceCard);
        sourceCard.setMatched(true, index);
      }
    });
  }

  getDropZoneByIndex(index) {
    return this.dropZones[index];
  }

  destroy() {
    this.dropZones.forEach((zone) => {
      if (zone.parentNode) {
        zone.parentNode.removeChild(zone);
      }
    });
    this.dropZones = [];
    this.draggedCard = null;
    this.activeDropZone = null;
  }
}
