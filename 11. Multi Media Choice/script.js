// H5P Multimedia Choice Static Implementation
class MultimediaChoice {
  constructor() {
    this.selectedOption = null;
    this.isAnswered = false;
    this.score = 0;
    this.maxScore = 1;
    this.options = [];
    this.contentData = null;
    this.h5pData = null;
    this.l10n = {
      checkAnswerButtonText: "Check",
      showSolutionButtonText: "Show solution",
      retryText: "Retry",
      correctAnswer: "Correct answer",
      wrongAnswer: "Wrong answer",
      result: "You got :num out of :total points",
    };

    this.loadData();
  }

  async loadData() {
    try {
      // Load content data
      const contentResponse = await fetch("content/content.json");
      if (!contentResponse.ok) {
        throw new Error(`HTTP error! status: ${contentResponse.status}`);
      }
      this.contentData = await contentResponse.json();

      // Load h5p configuration
      const h5pResponse = await fetch("h5p.json");
      if (!h5pResponse.ok) {
        throw new Error(`HTTP error! status: ${h5pResponse.status}`);
      }
      this.h5pData = await h5pResponse.json();

      // Update l10n if available
      if (this.contentData.l10n) {
        this.l10n = { ...this.l10n, ...this.contentData.l10n };
      }

      // Initialize after data is loaded
      this.init();
    } catch (error) {
      console.error("Error loading data:", error);
      // Fallback to existing hardcoded content
      this.init();
    }
  }

  init() {
    this.renderContent();
    this.setupButtons();
    this.setupAudio();
  }

  renderContent() {
    if (!this.contentData) return;

    // Render media (audio/video/image) if exists
    this.renderMedia();

    // Render options dynamically
    this.renderOptions();

    // Update button texts
    this.updateButtonTexts();
  }

  renderMedia() {
    const mediaContainer = document.querySelector(".h5p-question-audio");
    if (!this.contentData.media || !this.contentData.media.type) {
      mediaContainer.style.display = "none";
      return;
    }

    const mediaData = this.contentData.media.type;
    const mediaParams = mediaData.params;

    // Clear existing content
    mediaContainer.innerHTML = "";
    mediaContainer.style.display = "block"; // Ensure container is visible

    if (mediaData.library.includes("H5P.Audio")) {
      this.renderAudio(mediaContainer, mediaParams);
    } else if (mediaData.library.includes("H5P.Video")) {
      this.renderVideo(mediaContainer, mediaParams);
    } else if (mediaData.library.includes("H5P.Image")) {
      this.renderImage(mediaContainer, mediaParams);
    }
  }

  renderAudio(container, params) {
    const audioWrapper = document.createElement("div");
    audioWrapper.className = "h5p-audio-wrapper";

    const audio = document.createElement("audio");
    audio.id = "questionAudio";
    audio.controls = true; // Always show controls
    audio.autoplay = params.autoplay === true;

    if (params.files && params.files.length > 0) {
      params.files.forEach((file) => {
        const source = document.createElement("source");
        source.src = `content/${file.path}`;
        source.type = file.mime;
        audio.appendChild(source);
      });
    }

    // Add error handling for audio loading
    audio.addEventListener("error", () => {
      audio.style.display = "none";
      const errorMsg = document.createElement("div");
      errorMsg.className = "audio-error-message";
      errorMsg.textContent =
        params.audioNotSupported || "Your browser does not support this audio";
      errorMsg.style.padding = "10px";
      errorMsg.style.backgroundColor = "#f8d7da";
      errorMsg.style.color = "#721c24";
      errorMsg.style.border = "1px solid #f5c6cb";
      errorMsg.style.borderRadius = "4px";
      audioWrapper.appendChild(errorMsg);
    });

    // Auto-play audio when loaded (if autoplay is enabled or by default)
    audio.addEventListener("loadeddata", () => {
      if (params.autoplay !== false) {
        audio.play().catch(() => {
          // Auto-play might be blocked by browser policy
          console.log("Auto-play blocked, user interaction required");
        });
      }
    });

    audioWrapper.appendChild(audio);
    container.appendChild(audioWrapper);
  }

  renderVideo(container, params) {
    const videoWrapper = document.createElement("div");
    videoWrapper.className = "h5p-video-wrapper";

    const video = document.createElement("video");
    video.controls = params.controls !== false;
    video.autoplay = params.autoplay === true;

    if (params.sources && params.sources.length > 0) {
      params.sources.forEach((source) => {
        const sourceElement = document.createElement("source");
        sourceElement.src = `content/${source.path}`;
        sourceElement.type = source.mime;
        video.appendChild(sourceElement);
      });
    }

    videoWrapper.appendChild(video);
    container.appendChild(videoWrapper);
  }

  renderImage(container, params) {
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "h5p-image-wrapper";

    const img = document.createElement("img");
    img.src = `content/${params.file.path}`;
    img.alt = params.contentName || "Image";
    img.style.width = "100%";
    img.style.height = "auto";

    imageWrapper.appendChild(img);
    container.appendChild(imageWrapper);
  }

  renderOptions() {
    if (!this.contentData.options) {
      return;
    }

    const optionsList = document.querySelector(
      ".h5p-multi-media-choice-option-list"
    );
    optionsList.innerHTML = ""; // Clear existing options
    this.options = []; // Reset options array

    this.contentData.options.forEach((option, index) => {
      const listItem = document.createElement("li");
      listItem.className = "h5p-multi-media-choice-list-item";
      listItem.tabIndex = 0;

      const optionDiv = document.createElement("div");
      optionDiv.className =
        "h5p-multi-media-choice-option h5p-multi-media-choice-enabled";
      optionDiv.setAttribute("data-correct", option.correct.toString());
      optionDiv.setAttribute("role", "radio");
      optionDiv.setAttribute("aria-checked", "false");
      optionDiv.tabIndex = 0;

      // Create media wrapper
      const mediaWrapper = document.createElement("div");
      const aspectRatio = this.getAspectRatio();
      mediaWrapper.className = `h5p-multi-media-choice-media-wrapper h5p-multi-media-choice-media-wrapper-${aspectRatio}`;

      // Render option media
      if (option.media && option.media.library.includes("H5P.Image")) {
        const img = document.createElement("img");
        img.className =
          "h5p-multi-media-choice-media h5p-multi-media-choice-media-specific-ratio";
        img.classList.add("question-image");
        img.src = `content/${option.media.params.file.path}`;
        img.alt = option.media.params.contentName || "Option image";
        img.draggable = false;

        mediaWrapper.appendChild(img);
      } else if (option.media && option.media.library.includes("H5P.Video")) {
        const video = document.createElement("video");
        video.className =
          "h5p-multi-media-choice-media h5p-multi-media-choice-media-specific-ratio";
        video.muted = true;
        video.loop = true;

        if (option.media.params.sources) {
          option.media.params.sources.forEach((source) => {
            const sourceElement = document.createElement("source");
            sourceElement.src = `content/${source.path}`;
            sourceElement.type = source.mime;
            video.appendChild(sourceElement);
          });
        }

        mediaWrapper.appendChild(video);
      } else if (option.media && option.media.library.includes("H5P.Audio")) {
        // For audio options, show a placeholder with audio controls
        const audioPlaceholder = document.createElement("div");
        audioPlaceholder.className =
          "h5p-multi-media-choice-media h5p-multi-media-choice-media-specific-ratio audio-placeholder";
        audioPlaceholder.style.background = "#dbe2e8";
        audioPlaceholder.style.display = "flex";
        audioPlaceholder.style.alignItems = "center";
        audioPlaceholder.style.justifyContent = "center";
        audioPlaceholder.innerHTML =
          '<span style="font-size: 3em; color: #666;">🎵</span>';

        mediaWrapper.appendChild(audioPlaceholder);

        // Add audio element
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.style.position = "absolute";
        audio.style.bottom = "10px";
        audio.style.right = "10px";
        audio.style.width = "60px";
        audio.style.height = "30px";

        if (option.media.params.files) {
          option.media.params.files.forEach((file) => {
            const source = document.createElement("source");
            source.src = `content/${file.path}`;
            source.type = file.mime;
            audio.appendChild(source);
          });
        }

        mediaWrapper.appendChild(audio);
      }

      optionDiv.appendChild(mediaWrapper);
      listItem.appendChild(optionDiv);
      optionsList.appendChild(listItem);

      // Add to options array and setup event listeners immediately
      const isCorrect = option.correct === true;
      this.options.push({
        element: optionDiv,
        isCorrect: isCorrect,
        index: index,
      });

      // Add click event listener
      optionDiv.addEventListener("click", () => this.selectOption(index));

      // Add keyboard support
      optionDiv.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.selectOption(index);
        }
      });
    });
  }

  getAspectRatio() {
    if (this.contentData.behaviour && this.contentData.behaviour.aspectRatio) {
      const ratio = this.contentData.behaviour.aspectRatio;
      // If aspectRatio is 'auto', use default 16to9
      if (ratio === "auto") {
        return "16to9";
      }
      return ratio;
    }
    return "16to9"; // default
  }

  updateButtonTexts() {
    const checkButton = document.querySelector(
      ".h5p-question-check-answer .h5p-joubelui-button-content"
    );
    const showSolutionButton = document.querySelector(
      ".h5p-question-show-solution .h5p-joubelui-button-content"
    );
    const retryButton = document.querySelector(
      ".h5p-question-try-again .h5p-joubelui-button-content"
    );

    if (checkButton)
      checkButton.textContent = this.l10n.checkAnswerButtonText || "Check";
    if (showSolutionButton)
      showSolutionButton.textContent =
        this.l10n.showSolutionButtonText || "Show solution";
    if (retryButton) retryButton.textContent = this.l10n.retryText || "Retry";
  }

  setupButtons() {
    const checkButton = document.querySelector(".h5p-question-check-answer");
    const showSolutionButton = document.querySelector(
      ".h5p-question-show-solution"
    );
    const retryButton = document.querySelector(".h5p-question-try-again");

    checkButton.addEventListener("click", () => this.checkAnswer());
    showSolutionButton.addEventListener("click", () => this.showSolution());
    retryButton.addEventListener("click", () => this.retry());

    // Initially show only check button
    this.showButtons(["check"]);
  }

  setupAudio() {
    const audio = document.getElementById("questionAudio");
    if (audio) {
      // Add audio controls and error handling
      audio.addEventListener("error", () => {
        console.warn("Audio file could not be loaded");
      });
    }
  }

  selectOption(index) {
    if (this.isAnswered) return;

    // Remove previous selection
    this.options.forEach((option) => {
      option.element.classList.remove("h5p-multi-media-choice-selected");
      option.element.setAttribute("aria-checked", "false");
    });

    // Select new option
    this.selectedOption = index;
    this.options[index].element.classList.add(
      "h5p-multi-media-choice-selected"
    );
    this.options[index].element.setAttribute("aria-checked", "true");

    // Enable check button
    const checkButton = document.querySelector(".h5p-question-check-answer");
    checkButton.disabled = false;

    // Show buttons
    this.showButtonContainer();
  }

  checkAnswer() {
    if (this.selectedOption === null || this.isAnswered) return;

    this.isAnswered = true;
    const selectedOptionData = this.options[this.selectedOption];

    // Disable all options
    this.options.forEach((option) => {
      option.element.classList.remove("h5p-multi-media-choice-enabled");
      option.element.style.cursor = "default";
    });

    // Show feedback for selected option
    if (selectedOptionData.isCorrect) {
      selectedOptionData.element.classList.add(
        "h5p-multi-media-choice-correct"
      );
      this.score = 1;
      this.showFeedback(this.l10n.correctAnswer, true);
      console.log("123", this);
      console.log("123123123");
    } else {
      selectedOptionData.element.classList.add("h5p-multi-media-choice-wrong");
      this.score = 0;
      this.showFeedback(this.l10n.wrongAnswer, false);
    }

    // Update score
    this.updateScore();

    // Show appropriate buttons
    if (selectedOptionData.isCorrect) {
      this.showButtons(["retry"]);
    } else {
      this.showButtons(["showSolution", "retry"]);
    }
  }

  showSolution() {
    // Highlight correct answer
    this.options.forEach((option) => {
      if (option.isCorrect) {
        option.element.classList.add("h5p-multi-media-choice-show-correct");
      }
    });

    this.showFeedback("The correct answer is highlighted.", true);
    this.showButtons(["retry"]);
  }

  retry() {
    // Reset all states
    this.isAnswered = false;
    this.selectedOption = null;
    this.score = 0;

    // Reset options
    this.options.forEach((option) => {
      option.element.classList.remove(
        "h5p-multi-media-choice-selected",
        "h5p-multi-media-choice-correct",
        "h5p-multi-media-choice-wrong",
        "h5p-multi-media-choice-show-correct"
      );
      option.element.classList.add("h5p-multi-media-choice-enabled");
      option.element.style.cursor = "pointer";
      option.element.setAttribute("aria-checked", "false");
    });

    // Reset UI
    this.hideFeedback();
    this.hideScore();
    this.showButtons(["check"]);

    // Disable check button initially
    const checkButton = document.querySelector(".h5p-question-check-answer");
    checkButton.disabled = true;

    // Hide button container
    this.hideButtonContainer();

    // Restart audio if available
    const audio = document.getElementById("questionAudio");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Auto-play might be blocked
        console.log("Auto-play blocked, user interaction required");
      });
    }
  }

  showFeedback(message, isCorrect) {
    const feedback = document.querySelector(".h5p-question-feedback");
    const feedbackContent = document.querySelector(
      ".h5p-question-feedback-content"
    );
    const feedbackText = document.querySelector(
      ".h5p-question-feedback-content-text"
    );

    feedbackText.textContent = message;
    feedbackContent.classList.add("has-content");
    feedback.classList.add("h5p-question-visible");

    // Set color based on correctness
    feedback.style.color = isCorrect ? "#6ea776" : "#d33120";
  }

  hideFeedback() {
    const feedback = document.querySelector(".h5p-question-feedback");
    const feedbackContent = document.querySelector(
      ".h5p-question-feedback-content"
    );

    feedback.classList.remove("h5p-question-visible");
    feedbackContent.classList.remove("has-content");
  }

  updateScore() {
    const scoreElement = document.querySelector(
      ".h5p-joubelui-score-bar-text-score"
    );
    const scorebar = document.querySelector(".h5p-question-scorebar");

    scoreElement.textContent = this.score;
    scorebar.classList.add("h5p-question-visible");

    // Update result feedback
    const resultText = this.l10n.result
      .replace(":num", this.score)
      .replace(":total", this.maxScore);

    setTimeout(() => {
      this.showFeedback(resultText, this.score === this.maxScore);
    }, 500);
  }

  hideScore() {
    const scorebar = document.querySelector(".h5p-question-scorebar");
    scorebar.classList.remove("h5p-question-visible");
  }

  showButtons(buttonTypes) {
    const checkButton = document.querySelector(".h5p-question-check-answer");
    const showSolutionButton = document.querySelector(
      ".h5p-question-show-solution"
    );
    const retryButton = document.querySelector(".h5p-question-try-again");

    // Hide all buttons first
    checkButton.style.display = "none";
    showSolutionButton.style.display = "none";
    retryButton.style.display = "none";

    // Show requested buttons
    buttonTypes.forEach((type) => {
      switch (type) {
        case "check":
          checkButton.style.display = "inline-block";
          checkButton.disabled = this.selectedOption === null;
          break;
        case "showSolution":
          showSolutionButton.style.display = "inline-block";
          break;
        case "retry":
          retryButton.style.display = "inline-block";
          break;
      }
    });
  }

  showButtonContainer() {
    const buttonContainer = document.querySelector(".h5p-question-buttons");
    buttonContainer.classList.add("h5p-question-visible");
  }

  hideButtonContainer() {
    const buttonContainer = document.querySelector(".h5p-question-buttons");
    buttonContainer.classList.remove("h5p-question-visible");
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const multimediaChoice = new MultimediaChoice();
  multimediaChoice.loadData();
});

// Add some utility functions for better UX
function addAccessibilitySupport() {
  // Add keyboard navigation between options
  const options = document.querySelectorAll(".h5p-multi-media-choice-option");

  options.forEach((option, index) => {
    option.addEventListener("keydown", (e) => {
      let nextIndex;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          nextIndex = (index + 1) % options.length;
          options[nextIndex].focus();
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          nextIndex = (index - 1 + options.length) % options.length;
          options[nextIndex].focus();
          break;
      }
    });
  });
}

// Initialize accessibility support
document.addEventListener("DOMContentLoaded", addAccessibilitySupport);

// Add loading animation
function showLoadingState() {
  const container = document.querySelector(".h5p-container");
  container.style.opacity = "0";

  setTimeout(() => {
    container.style.transition = "opacity 0.5s ease";
    container.style.opacity = "1";
  }, 100);
}

// Initialize loading animation
document.addEventListener("DOMContentLoaded", showLoadingState);
