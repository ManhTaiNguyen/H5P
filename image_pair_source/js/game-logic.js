// Game Logic for Image Pair game

class ImagePairGameLogic {
  constructor() {
    this.cards = [];
    this.sourceCards = [];
    this.matches = [];
    this.score = 0;
    this.totalPairs = 0;
    this.gameCompleted = false;
    this.gameStarted = false;
    this.selectedCard = null;
    this.l10n = {};

    this.callbacks = {
      onScoreUpdate: null,
      onGameComplete: null,
      onMatch: null,
      onMismatch: null,
    };
  }

  async loadContent() {
    try {
      const contentData = await Utils.loadJSON("content/content.json");
      this.cards = contentData.cards;
      this.l10n = contentData.l10n || {
        checkAnswer: "Check",
        tryAgain: "Retry",
        showSolution: "Show Solution",
        score: "You got @score of @total points",
      };
      this.totalPairs = this.cards.length;
      return true;
    } catch (error) {
      console.error("Failed to load content:", error);
      Utils.showNotification("Failed to load game content", "error");
      return false;
    }
  }

  initializeGame() {
    this.createSourceCards();
    this.resetGame();
    this.gameStarted = true;
  }

  createSourceCards() {
    const cardsContainer = document.getElementById("cards-container");
    if (!cardsContainer) {
      console.error("Cards container not found");
      throw new Error("Cards container element not found in DOM");
    }

    cardsContainer.innerHTML = "";
    this.sourceCards = [];

    // Shuffle the cards for random order
    const shuffledCards = Utils.shuffleArray(this.cards);

    shuffledCards.forEach((cardData, index) => {
      const originalIndex = this.cards.indexOf(cardData);
      const card = new ImagePairCard(cardData, originalIndex, false);
      this.sourceCards.push(card);
      cardsContainer.appendChild(card.element);
    });
  }

  makeMatch(sourceCardIndex, targetIndex) {
    const sourceCard = this.sourceCards.find(
      (card) => card.index === sourceCardIndex
    );
    if (!sourceCard || sourceCard.isMatched) {
      return false;
    }

    // Check if this is the correct match
    const isCorrect = sourceCardIndex === targetIndex;

    if (isCorrect) {
      this.processCorrectMatch(sourceCard, targetIndex);
      return true;
    } else {
      this.processIncorrectMatch(sourceCard);
      return false;
    }
  }

  processCorrectMatch(sourceCard, targetIndex) {
    sourceCard.setMatched(true, targetIndex);
    sourceCard.setSelected(false);
    this.selectedCard = null;

    this.matches.push({
      sourceIndex: sourceCard.index,
      targetIndex: targetIndex,
      timestamp: Date.now(),
    });

    this.score++;
    this.updateScore();

    // Trigger callback
    if (this.callbacks.onMatch) {
      this.callbacks.onMatch(sourceCard.index, targetIndex);
    }

    // Check if game is completed
    if (this.score === this.totalPairs) {
      this.completeGame();
    }

    Utils.showNotification("Correct match!", "success", 1500);
  }

  processIncorrectMatch(sourceCard) {
    sourceCard.setIncorrect(true);

    // Trigger callback
    if (this.callbacks.onMismatch) {
      this.callbacks.onMismatch(sourceCard.index);
    }

    Utils.showNotification("Try again!", "warning", 1500);
  }

  completeGame() {
    this.gameCompleted = true;

    // Disable all remaining cards
    this.sourceCards.forEach((card) => {
      card.setDisabled(true);
    });

    // Show completion message
    const completionMessage = `Congratulations! You completed the game with ${this.score} out of ${this.totalPairs} matches!`;
    Utils.showNotification(completionMessage, "success", 5000);

    // Add success message to the page
    this.showSuccessMessage();

    // Trigger callback
    if (this.callbacks.onGameComplete) {
      this.callbacks.onGameComplete(this.score, this.totalPairs);
    }

    // Save completion stats
    this.saveGameStats();
  }

  showSuccessMessage() {
    const gameContainer = document.getElementById("game-container");

    // Remove any existing success message
    const existingMessage = gameContainer.querySelector(".success-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const successMessage = Utils.createElement("div", ["success-message"]);
    successMessage.innerHTML = `
            <h3>🎉 Congratulations!</h3>
            <p>You successfully matched all ${this.totalPairs} pairs!</p>
            <p>Score: ${this.score}/${this.totalPairs}</p>
        `;

    gameContainer.parentNode.insertBefore(
      successMessage,
      gameContainer.nextSibling
    );
  }

  updateScore() {
    const scoreText = Utils.formatScore(
      this.score,
      this.totalPairs,
      this.l10n.score
    );
    document.getElementById("score-text").textContent = scoreText;

    // Trigger callback
    if (this.callbacks.onScoreUpdate) {
      this.callbacks.onScoreUpdate(this.score, this.totalPairs);
    }
  }

  resetGame() {
    this.score = 0;
    this.matches = [];
    this.gameCompleted = false;
    this.selectedCard = null;

    // Reset all source cards
    this.sourceCards.forEach((card) => {
      card.setMatched(false);
      card.setSelected(false);
      card.setDisabled(false);
    });

    // Remove success message
    const successMessage = document.querySelector(".success-message");
    if (successMessage) {
      successMessage.remove();
    }

    this.updateScore();
  }

  checkAnswers() {
    if (this.gameCompleted) {
      Utils.showNotification("Game already completed!", "info");
      return;
    }

    let correctMatches = 0;
    let incorrectMatches = 0;

    this.sourceCards.forEach((card) => {
      if (card.isMatched) {
        if (card.matchedWith === card.index) {
          correctMatches++;
        } else {
          incorrectMatches++;
        }
      }
    });

    const message = `Correct: ${correctMatches}, Incorrect: ${incorrectMatches}, Remaining: ${
      this.totalPairs - correctMatches - incorrectMatches
    }`;
    Utils.showNotification(message, "info", 3000);
  }

  showSolution() {
    if (this.gameCompleted) {
      Utils.showNotification("Game already completed!", "info");
      return;
    }

    // Mark all cards as matched with their correct pairs
    this.sourceCards.forEach((card) => {
      if (!card.isMatched) {
        card.setMatched(true, card.index);
        this.score++;
      }
    });

    this.updateScore();
    this.completeGame();

    Utils.showNotification("Solution shown!", "info");
  }

  selectCard(cardIndex) {
    const card = this.sourceCards.find((c) => c.index === cardIndex);
    if (!card || card.isMatched) return;

    // Deselect previous card
    if (this.selectedCard && this.selectedCard !== card) {
      this.selectedCard.setSelected(false);
    }

    // Toggle selection
    if (this.selectedCard === card) {
      card.setSelected(false);
      this.selectedCard = null;
    } else {
      card.setSelected(true);
      this.selectedCard = card;
    }
  }

  getSelectedCard() {
    return this.selectedCard;
  }

  saveGameStats() {
    const stats = {
      completedAt: new Date().toISOString(),
      score: this.score,
      totalPairs: this.totalPairs,
      matches: this.matches,
    };

    Utils.storage.set("imagePairLastGame", stats);

    // Update overall stats
    let overallStats = Utils.storage.get("imagePairStats", {
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      averageScore: 0,
    });

    overallStats.gamesPlayed++;
    overallStats.totalScore += this.score;
    overallStats.averageScore =
      overallStats.totalScore / overallStats.gamesPlayed;

    if (this.score > overallStats.bestScore) {
      overallStats.bestScore = this.score;
    }

    Utils.storage.set("imagePairStats", overallStats);
  }

  getGameStats() {
    return Utils.storage.get("imagePairStats", {
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      averageScore: 0,
    });
  }

  // Callback setters
  onScoreUpdate(callback) {
    this.callbacks.onScoreUpdate = callback;
  }

  onGameComplete(callback) {
    this.callbacks.onGameComplete = callback;
  }

  onMatch(callback) {
    this.callbacks.onMatch = callback;
  }

  onMismatch(callback) {
    this.callbacks.onMismatch = callback;
  }

  // Public getters
  getScore() {
    return this.score;
  }

  getTotalPairs() {
    return this.totalPairs;
  }

  isGameCompleted() {
    return this.gameCompleted;
  }

  isGameStarted() {
    return this.gameStarted;
  }

  getMatches() {
    return [...this.matches];
  }

  getL10n() {
    return { ...this.l10n };
  }

  destroy() {
    this.sourceCards.forEach((card) => {
      card.destroy();
    });
    this.sourceCards = [];
    this.matches = [];
    this.selectedCard = null;
    this.callbacks = {};
  }
}
