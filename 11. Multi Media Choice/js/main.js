// H5P Multimedia Choice Main Class
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
      checkAnswerButtonText: "Kiểm tra",
      showSolutionButtonText: "Xem đáp án",
      retryText: "Thử lại",
      correctAnswer: "🎉 Chính xác! Bạn đã chọn đúng rồi!",
      wrongAnswer: "❌ Chưa đúng! Hãy thử lại nhé!",
      result: "Bạn đã đạt được :num/:total điểm",
      showSolution: "💡 Đáp án đúng đã được làm nổi bật",
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
    this.updateProgressBar(0);
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
    const mediaContainer = document.querySelector(".media-container");
    if (!this.contentData.media || !this.contentData.media.type) {
      mediaContainer.style.display = "none";
      return;
    }

    const mediaData = this.contentData.media.type;
    const mediaParams = mediaData.params;

    // Clear existing content
    mediaContainer.innerHTML = "";
    mediaContainer.style.display = "block";

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

    // Add audio title
    const audioTitle = document.createElement("div");
    audioTitle.className = "audio-title";
    audioTitle.innerHTML =
      "🎵 <strong>Hãy nghe và chọn hình ảnh phù hợp</strong>";
    audioTitle.style.cssText = `
            margin-bottom: 20px;
            font-size: 1.2em;
            color: #667eea;
            font-weight: 600;
            text-align: center;
        `;
    audioWrapper.appendChild(audioTitle);

    const audio = document.createElement("audio");
    audio.id = "questionAudio";
    audio.controls = true;
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
        params.audioNotSupported ||
        "Trình duyệt không hỗ trợ định dạng âm thanh này";
      errorMsg.style.cssText = `
                padding: 15px;
                background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
                color: #721c24;
                border: 2px solid #f5c6cb;
                border-radius: 10px;
                text-align: center;
                font-weight: 500;
            `;
      audioWrapper.appendChild(errorMsg);
    });

    // Auto-play audio when loaded
    audio.addEventListener("loadeddata", () => {
      if (params.autoplay !== false) {
        audio.play().catch(() => {
          console.log("Auto-play blocked, user interaction required");
        });
      }
    });

    // Add play/pause visual feedback
    audio.addEventListener("play", () => {
      audioWrapper.classList.add("playing");
    });

    audio.addEventListener("pause", () => {
      audioWrapper.classList.remove("playing");
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
    video.style.cssText = `
            width: 100%;
            max-width: 600px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        `;

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
    img.alt = params.contentName || "Hình ảnh";
    img.style.cssText = `
            width: 100%;
            max-width: 600px;
            height: auto;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        `;

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
    optionsList.innerHTML = "";
    this.options = [];

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
      optionDiv.setAttribute("aria-label", `Tùy chọn ${index + 1}`);
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
        img.src = `content/${option.media.params.file.path}`;
        img.alt =
          option.media.params.contentName || `Hình ảnh tùy chọn ${index + 1}`;
        img.draggable = false;

        mediaWrapper.appendChild(img);
      } else if (option.media && option.media.library.includes("H5P.Video")) {
        const video = document.createElement("video");
        video.className =
          "h5p-multi-media-choice-media h5p-multi-media-choice-media-specific-ratio";
        video.muted = true;
        video.loop = true;
        video.poster = option.media.params.poster
          ? `content/${option.media.params.poster.path}`
          : "";

        if (option.media.params.sources) {
          option.media.params.sources.forEach((source) => {
            const sourceElement = document.createElement("source");
            sourceElement.src = `content/${source.path}`;
            sourceElement.type = source.mime;
            video.appendChild(sourceElement);
          });
        }

        // Add play button overlay
        const playButton = document.createElement("div");
        playButton.className = "video-play-button";
        playButton.innerHTML = "▶️";
        playButton.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 2em;
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px;
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 5;
                `;

        playButton.addEventListener("click", (e) => {
          e.stopPropagation();
          if (video.paused) {
            video.play();
            playButton.style.display = "none";
          }
        });

        mediaWrapper.appendChild(video);
        mediaWrapper.appendChild(playButton);
      } else if (option.media && option.media.library.includes("H5P.Audio")) {
        const audioPlaceholder = document.createElement("div");
        audioPlaceholder.className =
          "h5p-multi-media-choice-media h5p-multi-media-choice-media-specific-ratio audio-placeholder";
        audioPlaceholder.style.cssText = `
                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 10px;
                `;

        const audioIcon = document.createElement("div");
        audioIcon.innerHTML = "🎵";
        audioIcon.style.fontSize = "3em";

        const audioLabel = document.createElement("div");
        audioLabel.textContent = "Âm thanh";
        audioLabel.style.cssText = `
                    font-size: 1.2em;
                    font-weight: 600;
                    color: #1976d2;
                `;

        audioPlaceholder.appendChild(audioIcon);
        audioPlaceholder.appendChild(audioLabel);

        // Add audio element
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.style.cssText = `
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    width: 80px;
                    height: 35px;
                    z-index: 10;
                `;

        if (option.media.params.files) {
          option.media.params.files.forEach((file) => {
            const source = document.createElement("source");
            source.src = `content/${file.path}`;
            source.type = file.mime;
            audio.appendChild(source);
          });
        }

        mediaWrapper.appendChild(audioPlaceholder);
        mediaWrapper.appendChild(audio);
      }

      optionDiv.appendChild(mediaWrapper);
      listItem.appendChild(optionDiv);
      optionsList.appendChild(listItem);

      // Add to options array and setup event listeners
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
      if (ratio === "auto") {
        return "16to9";
      }
      return ratio;
    }
    return "16to9";
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

    if (checkButton) checkButton.textContent = this.l10n.checkAnswerButtonText;
    if (showSolutionButton)
      showSolutionButton.textContent = this.l10n.showSolutionButtonText;
    if (retryButton) retryButton.textContent = this.l10n.retryText;
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
      audio.addEventListener("error", () => {
        console.warn("Audio file could not be loaded");
      });

      // Add loading state
      audio.addEventListener("loadstart", () => {
        if (window.showNotification) {
          window.showNotification("Đang tải âm thanh...");
        }
      });

      audio.addEventListener("canplaythrough", () => {
        if (window.showNotification) {
          window.showNotification("Âm thanh đã sẵn sàng!");
        }
      });
    }
  }

  // Update progress bar
  updateProgressBar(progress) {
    const progressFill = document.getElementById("progressFill");
    const progressText = document.querySelector(".progress-text");

    if (progressFill) {
      progressFill.style.width = progress + "%";
      progressText.textContent = `Tiến độ học tập: ${progress}%`;
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

    // Announce selection
    if (window.announce) {
      window.announce(`Đã chọn tùy chọn ${index + 1}`);
    }

    // Enable check button
    const checkButton = document.querySelector(".h5p-question-check-answer");
    checkButton.disabled = false;

    // Show buttons
    this.showButtonContainer();

    // Update progress
    this.updateProgressBar(50);
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
      if (window.announce) {
        window.announce("Chính xác! Bạn đã chọn đúng rồi!");
      }
      if (window.playSuccessSound) {
        window.playSuccessSound();
      }
      this.updateProgressBar(100);
    } else {
      selectedOptionData.element.classList.add("h5p-multi-media-choice-wrong");
      this.score = 0;
      this.showFeedback(this.l10n.wrongAnswer, false);
      if (window.announce) {
        window.announce("Chưa đúng! Hãy thử lại nhé!");
      }
      if (window.playErrorSound) {
        window.playErrorSound();
      }
      this.updateProgressBar(25);
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

    this.showFeedback(this.l10n.showSolution, true);
    if (window.announce) {
      window.announce("Đáp án đúng đã được làm nổi bật");
    }
    this.showButtons(["retry"]);
    this.updateProgressBar(75);
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
    this.updateProgressBar(0);

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
        console.log("Auto-play blocked, user interaction required");
      });
    }

    // Announce retry
    if (window.announce) {
      window.announce("Đã đặt lại bài tập, hãy thử lại");
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
    feedback.style.color = isCorrect ? "#28a745" : "#dc3545";

    // Add animation class
    feedbackContent.style.animation = "feedbackSlideIn 0.5s ease-out";
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
    }, 1000);
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
          checkButton.style.display = "flex";
          checkButton.disabled = this.selectedOption === null;
          break;
        case "showSolution":
          showSolutionButton.style.display = "flex";
          break;
        case "retry":
          retryButton.style.display = "flex";
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
