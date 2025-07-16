import { showNotification } from "./utils.js";
import { createConfetti } from "./celebration.js";
import {
  playClickSound,
  playHoverSound,
  playSuccessSound,
  playErrorSound,
} from "./sound-effects.js";

export class QuizGame {
  constructor() {
    // DOM Elements
    this.questionsContainer = document.getElementById("questionsContainer");
    this.resultContainer = document.getElementById("resultContainer");
    this.resultText = document.getElementById("result");
    this.feedbackText = document.getElementById("feedback");
    this.checkBtn = document.getElementById("checkBtn");
    this.resetBtn = document.getElementById("resetBtn");
    this.showAnswersBtn = document.getElementById("showAnswersBtn");

    // State
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.score = 0;
    this.quizCompleted = false;
  }

  async initQuiz() {
    try {
      if (!this.questionsContainer) {
        throw new Error("Missing #questionsContainer in HTML");
      }

      const res = await fetch("content/content.json");
      const data = await res.json();

      // Xử lý cấu trúc dữ liệu khác nhau
      this.questions = Array.isArray(data) ? data : data.questions ?? [data];

      this.userAnswers = Array(this.questions.length).fill(null);

      this.renderQuestions();
      this.showQuestion(this.currentQuestionIndex);
      this.setupEvents();
    } catch (err) {
      console.error(err);
      this.questionsContainer.innerHTML = `<div class="error-message">Error loading questions: ${err.message}</div>`;
    }
  }

  renderQuestions() {
    this.questionsContainer.innerHTML = "";

    this.questions.forEach((q, index) => {
      const questionText =
        q.question || q.params?.question || `Question ${index + 1}`;
      const correctAnswer = q.answer ?? q.params?.correct ?? true;
      const imagePath = q.image
        ? `content/images/${q.image}`
        : q.media?.type?.params?.file?.path
        ? `content/${q.media.type.params.file.path}`
        : "";

      const el = document.createElement("div");
      el.className = "question";
      el.dataset.index = index;
      el.dataset.answer = correctAnswer;

      el.innerHTML = `
        <h3>${questionText}</h3>
        ${
          imagePath
            ? `<img src="${imagePath}" alt="" class="question-image">`
            : ""
        }
        <div class="answer-buttons">
          <button class="answer-btn true-btn" data-answer="true">True</button>
          <button class="answer-btn false-btn" data-answer="false">False</button>
        </div>
        <div class="answer-feedback"><span class="feedback-text"></span></div>
      `;

      this.questionsContainer.appendChild(el);
    });
  }

  showQuestion(index) {
    const all = document.querySelectorAll(".question");
    all.forEach((el, i) => (el.style.display = i === index ? "block" : "none"));

    const isAnswered = this.userAnswers[index] !== null;
    this.checkBtn.disabled = isAnswered;
  }

  checkCurrentQuestion() {
    const currentEl = document.querySelector(
      `.question[data-index="${this.currentQuestionIndex}"]`
    );
    if (!currentEl) return;

    const selectedBtn = currentEl.querySelector(".answer-btn.selected");
    if (!selectedBtn) return;

    const userAnswer = selectedBtn.dataset.answer === "true";
    const correctAnswer = currentEl.dataset.answer === "true";
    const isCorrect = userAnswer === correctAnswer;

    this.userAnswers[this.currentQuestionIndex] = userAnswer;
    currentEl.classList.add("answered");
    this.checkBtn.disabled = true;

    const feedback = currentEl.querySelector(".feedback-text");
    const feedbackBox = currentEl.querySelector(".answer-feedback");

    if (isCorrect) {
      selectedBtn.classList.add("correct");
      feedback.textContent = "Câu trả lời chính xác!";
      feedbackBox.classList.add("correct-feedback");

      // 🎉 Thêm hiệu ứng khi trả lời đúng
      createConfetti();
      showNotification("Answers revealed 🎉", "info");
      playSuccessSound();
    } else {
      selectedBtn.classList.add("incorrect");
      feedback.textContent = "Rất tiếc, đáp án này chưa chính xác!";
      feedbackBox.classList.add("incorrect-feedback");

      const correctBtn = currentEl.querySelector(
        `.answer-btn[data-answer="${correctAnswer}"]`
      );
      if (correctBtn) correctBtn.classList.add("correct-answer");
      playErrorSound();
    }

    feedbackBox.style.display = "flex";

    // Disable all buttons
    currentEl.querySelectorAll(".answer-btn").forEach((btn) => {
      btn.classList.add("disabled");
    });

    if (this.userAnswers.every((a) => a !== null)) {
      this.showResult();
    }
  }

  showResult() {
    let score = 0;
    this.questions.forEach((q, i) => {
      const correct = q.answer ?? q.params?.correct ?? true;
      const expected = correct === true || correct === "true";
      if (this.userAnswers[i] === expected) score++;
    });

    this.resultText.textContent = `You got ${score} out of ${this.questions.length} correct`;
    this.feedbackText.textContent =
      score / this.questions.length >= 0.9
        ? "Excellent! 🎉"
        : score / this.questions.length >= 0.7
        ? "Good job! 👍"
        : score / this.questions.length >= 0.5
        ? "Keep practicing! 😊"
        : "Try again! 💪";

    this.resultContainer.style.display = "block";
    this.quizCompleted = true;

    this.checkBtn.disabled = true;
    this.showAnswersBtn.disabled = true;
    this.checkBtn.classList.add("disabled-btn");
    this.showAnswersBtn.classList.add("disabled-btn");
  }

  resetQuiz() {
    this.userAnswers = Array(this.questions.length).fill(null);
    this.currentQuestionIndex = 0;
    this.quizCompleted = false;
    this.resultContainer.style.display = "none";
    this.checkBtn.classList.remove("disabled-btn");
    this.showAnswersBtn.classList.remove("disabled-btn");
    this.checkBtn.disabled = true;
    this.showAnswersBtn.disabled = false;

    this.renderQuestions();
    this.showQuestion(0);
    showNotification("Quiz reset! 🔄", "info");
  }

  showAnswers() {
    if (this.quizCompleted) return;
    if (!confirm("Show solution? This will end the game.")) return;

    document.querySelectorAll(".question").forEach((qEl, i) => {
      const correctAnswer = qEl.dataset.answer === "true";
      this.userAnswers[i] = correctAnswer;

      qEl.classList.add("answered");

      const buttons = qEl.querySelectorAll(".answer-btn");
      const feedback = qEl.querySelector(".feedback-text");
      const feedbackBox = qEl.querySelector(".answer-feedback");

      buttons.forEach((btn) => {
        btn.classList.add("disabled");

        if (btn.dataset.answer === String(correctAnswer)) {
          btn.classList.add("correct", "selected", "correct-answer");
        } else {
          btn.classList.add("faded");
        }
      });

      if (feedback && feedbackBox) {
        feedback.textContent = "Câu trả lời chính xác!";
        feedbackBox.classList.add("correct-feedback");
        feedbackBox.style.display = "flex";
      }
    });

    this.quizCompleted = true;
    this.showResult();
    createConfetti(); // 🎉 hiệu ứng khi xem đáp án
    showNotification("Answers revealed 🎉", "info");
    playSuccessSound();
  }

  setupEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".answer-btn");
      if (btn) {
        const parent = btn.closest(".question");
        const index = +parent.dataset.index;

        if (!parent.classList.contains("answered")) {
          // Loại bỏ trạng thái cũ
          parent.querySelectorAll(".answer-btn").forEach((b) => {
            b.classList.remove("selected", "faded");
          });

          // Đánh dấu nút được chọn
          btn.classList.add("selected");
          playClickSound();

          // Làm mờ nút còn lại
          parent.querySelectorAll(".answer-btn").forEach((b) => {
            if (!b.classList.contains("selected")) {
              b.classList.add("faded");
            }
          });

          // Lưu đáp án
          this.userAnswers[index] = btn.dataset.answer === "true";

          // Cho phép kiểm tra nếu đang ở câu hiện tại
          if (index === this.currentQuestionIndex) {
            this.checkBtn.disabled = false;
          }
        }
      }
    });

    this.checkBtn?.addEventListener("click", () => this.checkCurrentQuestion());
    this.resetBtn?.addEventListener("click", () => this.resetQuiz());
    this.showAnswersBtn?.addEventListener("click", () => this.showAnswers());
  }
}
