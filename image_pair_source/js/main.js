// Main application file for Image Pair game

class ImagePairApp {
  constructor() {
    this.gameLogic = null;
    this.dragDropManager = null;
    this.isInitialized = false;

    this.init();
  }

  async init() {
    try {
      // Show loading state
      this.showLoading();

      // Initialize game logic
      this.gameLogic = new ImagePairGameLogic();

      // Load content
      const contentLoaded = await this.gameLogic.loadContent();
      if (!contentLoaded) {
        this.showError(
          "Failed to load game content. Please check your connection and try again."
        );
        return;
      }

      // Setup UI
      this.setupUI();

      // Initialize game
      this.gameLogic.initializeGame();

      // Initialize drag and drop
      this.dragDropManager = new DragDropManager(this.gameLogic);

      // Setup event listeners
      this.setupEventListeners();

      // Setup game callbacks
      this.setupGameCallbacks();

      this.isInitialized = true;
      this.hideLoading();

      // Initialize image zoom for existing cards
      setTimeout(() => {
        if (window.imageZoomManager) {
          window.imageZoomManager.initializeExistingCards();
        }
      }, 100);

      Utils.showNotification("Game loaded successfully!", "success", 2000);
    } catch (error) {
      console.error("Failed to initialize game:", error);
      this.showError(
        "Failed to initialize the game. Please refresh the page and try again."
      );
    }
  }

  setupUI() {
    // Set task description
    const taskDescription = document.getElementById("task-description");
    if (this.gameLogic.cards.length > 0) {
      // Try to get description from content, fallback to default
      const description =
        this.gameLogic.cards[0]?.taskDescription ||
        "Drag images from the left to match them with corresponding images on the right";
      taskDescription.textContent = description;
    }

    // Update button labels
    const l10n = this.gameLogic.getL10n();
    document.getElementById("check-btn").textContent = l10n.checkAnswer;
    document.getElementById("retry-btn").textContent = l10n.tryAgain;
    document.getElementById("solution-btn").textContent = l10n.showSolution;

    // Initialize score
    this.gameLogic.updateScore();
  }

  setupEventListeners() {
    // Control buttons
    document.getElementById("check-btn").addEventListener("click", () => {
      this.handleCheckAnswers();
    });

    document.getElementById("retry-btn").addEventListener("click", () => {
      this.handleRetry();
    });

    document.getElementById("solution-btn").addEventListener("click", () => {
      this.handleShowSolution();
    });

    // Card selection events
    document.addEventListener("click", (e) => {
      // Skip if this is a synthetic event (dispatched by our code)
      if (e.isTrusted === false) return;

      const cardElement = e.target.closest(".image-pair-card");
      if (cardElement && cardElement.dataset.type === "image") {
        const cardIndex = parseInt(cardElement.dataset.index);

        // Only handle if this is a direct DOM click, not a programmatic one
        if (e.detail !== undefined && e.detail.card) {
          // This is already handled by the card's own click handler
          return;
        }

        this.gameLogic.selectCard(cardIndex);
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardNavigation(e);
    });

    // Window resize handling
    window.addEventListener(
      "resize",
      Utils.debounce(() => {
        this.handleResize();
      }, 250)
    );

    // Visibility change (tab switching)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.handleGamePause();
      } else {
        this.handleGameResume();
      }
    });
  }

  setupGameCallbacks() {
    this.gameLogic.onScoreUpdate((score, total) => {
      // Update UI elements that might depend on score
      this.updateGameProgress(score, total);
    });

    this.gameLogic.onGameComplete((score, total) => {
      // Disable control buttons appropriately
      document.getElementById("check-btn").disabled = true;
      document.getElementById("solution-btn").disabled = true;

      // Focus on retry button for better accessibility
      setTimeout(() => {
        document.getElementById("retry-btn").focus();
      }, 1000);
    });

    this.gameLogic.onMatch((sourceIndex, targetIndex) => {
      // Could add visual effects or sounds here
      console.log(`Match made: ${sourceIndex} -> ${targetIndex}`);
    });

    this.gameLogic.onMismatch((sourceIndex) => {
      // Could add visual feedback for mismatches
      console.log(`Mismatch: ${sourceIndex}`);
    });
  }

  handleCheckAnswers() {
    if (!this.isInitialized) return;
    this.gameLogic.checkAnswers();
  }

  handleRetry() {
    if (!this.isInitialized) return;

    // Reset game logic
    this.gameLogic.resetGame();

    // Reset drag and drop
    this.dragDropManager.resetAllDropZones();

    // Re-enable buttons
    document.getElementById("check-btn").disabled = false;
    document.getElementById("solution-btn").disabled = false;

    // Shuffle cards for a new game experience
    this.gameLogic.createSourceCards();

    Utils.showNotification("Game reset!", "info", 1500);
  }

  handleShowSolution() {
    if (!this.isInitialized) return;

    // Show confirmation dialog for better UX
    if (
      confirm(
        "Are you sure you want to see the solution? This will end the current game."
      )
    ) {
      this.gameLogic.showSolution();
      this.dragDropManager.showSolution();
    }
  }

  handleKeyboardNavigation(e) {
    if (!this.isInitialized) return;

    // Handle control key shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "r":
          e.preventDefault();
          this.handleRetry();
          break;
        case "enter":
          e.preventDefault();
          this.handleCheckAnswers();
          break;
      }
    }

    // Handle arrow key navigation
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      this.handleArrowKeyNavigation(e);
    }
  }

  handleArrowKeyNavigation(e) {
    const focusedElement = document.activeElement;
    if (!focusedElement.classList.contains("image-pair-card")) return;

    e.preventDefault();

    const cards = Array.from(document.querySelectorAll(".image-pair-card"));
    const currentIndex = cards.indexOf(focusedElement);
    let nextIndex;

    switch (e.key) {
      case "ArrowLeft":
        nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
        break;
      case "ArrowRight":
        nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
        break;
      case "ArrowUp":
        // Calculate cards per row based on container width
        const cardsPerRow = Math.floor(
          focusedElement.parentElement.clientWidth / 140
        );
        nextIndex = currentIndex - cardsPerRow;
        if (nextIndex < 0) nextIndex = currentIndex;
        break;
      case "ArrowDown":
        const cardsPerRowDown = Math.floor(
          focusedElement.parentElement.clientWidth / 140
        );
        nextIndex = currentIndex + cardsPerRowDown;
        if (nextIndex >= cards.length) nextIndex = currentIndex;
        break;
    }

    if (nextIndex !== undefined && cards[nextIndex]) {
      cards[nextIndex].focus();
    }
  }

  handleResize() {
    // Could implement responsive adjustments here
    // For now, just log the resize event
    console.log("Window resized");
  }

  handleGamePause() {
    // Could pause timers or save state here
    console.log("Game paused");
  }

  handleGameResume() {
    // Could resume timers or refresh state here
    console.log("Game resumed");
  }

  updateGameProgress(score, total) {
    // Update any progress indicators
    const progress = (score / total) * 100;

    // Could add a progress bar here
    document.documentElement.style.setProperty(
      "--game-progress",
      `${progress}%`
    );
  }

  showLoading() {
    // Create loading overlay instead of replacing content
    const gameContainer = document.getElementById("game-container");

    // Remove existing loading overlay if any
    const existingOverlay = gameContainer.querySelector(".loading-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const loadingOverlay = Utils.createElement("div", ["loading-overlay"]);
    loadingOverlay.innerHTML = '<div class="loading">Loading game...</div>';
    loadingOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    gameContainer.style.position = "relative";
    gameContainer.appendChild(loadingOverlay);

    // Disable buttons
    document.getElementById("check-btn").disabled = true;
    document.getElementById("retry-btn").disabled = true;
    document.getElementById("solution-btn").disabled = true;
  }

  hideLoading() {
    // Remove loading overlay
    const gameContainer = document.getElementById("game-container");
    const loadingOverlay = gameContainer.querySelector(".loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.remove();
    }

    // Enable buttons
    document.getElementById("check-btn").disabled = false;
    document.getElementById("retry-btn").disabled = false;
    document.getElementById("solution-btn").disabled = false;
  }

  showError(message) {
    // Create error overlay instead of replacing content
    const gameContainer = document.getElementById("game-container");

    // Remove existing overlays
    const existingOverlay = gameContainer.querySelector(
      ".loading-overlay, .error-overlay"
    );
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const errorOverlay = Utils.createElement("div", ["error-overlay"]);
    errorOverlay.innerHTML = `
      <div class="error-message">
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" class="btn">Reload Page</button>
      </div>
    `;
    errorOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      text-align: center;
    `;

    gameContainer.style.position = "relative";
    gameContainer.appendChild(errorOverlay);

    Utils.showNotification(message, "error", 5000);
  }

  // Public methods for external access
  getGameStats() {
    return this.gameLogic ? this.gameLogic.getGameStats() : null;
  }

  getGameState() {
    if (!this.gameLogic) return null;

    return {
      score: this.gameLogic.getScore(),
      totalPairs: this.gameLogic.getTotalPairs(),
      isCompleted: this.gameLogic.isGameCompleted(),
      matches: this.gameLogic.getMatches(),
    };
  }

  destroy() {
    if (this.gameLogic) {
      this.gameLogic.destroy();
    }
    if (this.dragDropManager) {
      this.dragDropManager.destroy();
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Make the app globally accessible for debugging
  window.imagePairApp = new ImagePairApp();
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (window.imagePairApp) {
    window.imagePairApp.destroy();
  }
});
