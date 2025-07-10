import { showNotification } from './utils.js';

export class QuizGame {
  constructor() {
    // DOM Elements
    this.questionsContainer = document.getElementById('questionsContainer');
    this.progressDots = document.getElementById('progressDots');
    this.progressText = document.getElementById('progressText');
    this.resultContainer = document.getElementById('resultContainer');
    this.resultText = document.getElementById('result');
    this.feedbackText = document.getElementById('feedback');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.checkBtn = document.getElementById('checkBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.showAnswersBtn = document.getElementById('showAnswersBtn');
    
    // Quiz state
    this.currentQuestionIndex = 0;
    this.questions = [];
    this.score = 0;
    this.checkedQuestions = 0;
    this.totalQuestions = 0;
    this.userAnswers = [];
    this.quizCompleted = false;
  }

  // Khởi tạo quiz
  async initQuiz() {
    try {
      // Load questions from JSON file
      const response = await fetch('content/content.json');
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const quizData = await response.json();
      
      // Handle different JSON structures
      if (Array.isArray(quizData)) {
        this.questions = quizData;
      } else if (quizData.questions && Array.isArray(quizData.questions)) {
        this.questions = quizData.questions;
      } else {
        throw new Error('Invalid quiz data format');
      }
      
      this.totalQuestions = this.questions.length;
      this.userAnswers = Array(this.totalQuestions).fill(null);
      
      this.createQuestions();
      this.updateProgress();
      this.showQuestion(this.currentQuestionIndex);
      
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing quiz:', error);
      this.questionsContainer.innerHTML = `<div class="error-message">Error loading questions: ${error.message}</div>`;
    }
  }

  // Tạo các câu hỏi
  createQuestions() {
    this.questionsContainer.innerHTML = '';
    
    this.questions.forEach((question, index) => {
      const questionElement = document.createElement('div');
      questionElement.className = 'question';
      questionElement.dataset.index = index;
      
      // Get question text - handle different structures
      const questionText = question.question || question.params?.question || `Question ${index + 1}`;
      
      // Get correct answer - handle different structures
      const correctAnswer = question.answer !== undefined ? question.answer : 
                          question.params?.correct !== undefined ? question.params.correct : 
                          true; // default to true if not specified
      
      questionElement.dataset.answer = correctAnswer;
      
      // Add image if available
      let imageHtml = '';
      if (question.image) {
        imageHtml = `<img src="content/images/${question.image}" alt="Question image" class="question-image">`;
      } else if (question.params?.media?.type?.params?.file?.path) {
        imageHtml = `<img src="content/${question.params.media.type.params.file.path}" alt="Question image" class="question-image">`;
      }
      
      questionElement.innerHTML = `
        <h3>${questionText}</h3>
        ${imageHtml}
        <div class="answer-buttons">
          <button class="answer-btn true-btn" data-answer="true">
            True
          </button>
          <button class="answer-btn false-btn" data-answer="false">
            False
          </button>
        </div>
        <div class="answer-feedback">
          <span class="feedback-text"></span>
        </div>
      `;
      
      this.questionsContainer.appendChild(questionElement);
    });
  }

  // Hiển thị câu hỏi cụ thể
  showQuestion(index) {
    const questionElements = document.querySelectorAll('.question');
    questionElements.forEach((q, i) => {
      q.classList.toggle('active', i === index);
    });
    
    // Update navigation buttons
    this.prevBtn.disabled = index === 0;
    this.nextBtn.disabled = index === this.totalQuestions - 1;
    
    // Update check button based on whether question is answered
    const currentQuestion = questionElements[index];
    const answered = currentQuestion.classList.contains('answered');
    this.checkBtn.disabled = answered || this.userAnswers[index] === null;
    
    // Highlight selected answer if exists
    if (this.userAnswers[index] !== null) {
      const answerBtns = currentQuestion.querySelectorAll('.answer-btn');
      answerBtns.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.answer === String(this.userAnswers[index]));
      });
    }
  }

  // Cập nhật tiến trình
  updateProgress() {
    // Update progress dots
    this.progressDots.innerHTML = '';
    for (let i = 0; i < this.totalQuestions; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      if (i === this.currentQuestionIndex) {
        dot.classList.add('active');
      }
      if (this.userAnswers[i] !== null) {
        dot.classList.add('answered');
      }
      dot.addEventListener('click', () => {
        this.currentQuestionIndex = i;
        this.showQuestion(i);
        this.updateProgress();
      });
      this.progressDots.appendChild(dot);
    }
    
    // Update progress text
    const answeredCount = this.userAnswers.filter(answer => answer !== null).length;
    this.progressText.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.totalQuestions} (${answeredCount} answered)`;
    
    // Update result text if all questions are answered
    if (answeredCount === this.totalQuestions && !this.quizCompleted) {
      this.calculateScore();
      this.quizCompleted = true;
    }
  }

  // Tính điểm
  calculateScore() {
    this.score = 0;
    this.questions.forEach((q, i) => {
      const correctAnswer = q.answer !== undefined ? q.answer : 
                         q.params?.correct !== undefined ? q.params.correct : 
                         true;
      
      const userAnswer = this.userAnswers[i];
      const correctAnswerBool = String(correctAnswer) === 'true';
      
      if (userAnswer !== null && userAnswer === correctAnswerBool) {
        this.score++;
      }
    });

    // Hiển thị kết quả
    this.resultText.textContent = `You got ${this.score} out of ${this.totalQuestions} correct`;
    
    // Provide feedback based on score
    const percentage = (this.score / this.totalQuestions) * 100;
    if (percentage >= 90) {
      this.feedbackText.textContent = 'Excellent! You know your stuff! 🎉';
    } else if (percentage >= 70) {
      this.feedbackText.textContent = 'Good job! You did well! 👍';
    } else if (percentage >= 50) {
      this.feedbackText.textContent = 'Not bad! Keep practicing! 😊';
    } else {
      this.feedbackText.textContent = 'Keep trying! You can do better! 💪';
    }
    
    // Show result container
    this.resultContainer.style.display = 'block';

    // Disable check and show answers buttons
    this.checkBtn.disabled = true;
    this.showAnswersBtn.disabled = true;

    // Add visual feedback for disabled buttons
    this.checkBtn.classList.add('disabled-btn');
    this.showAnswersBtn.classList.add('disabled-btn');
  }

  // Kiểm tra câu hỏi hiện tại
  checkCurrentQuestion() {
    const questionElement = document.querySelector(`.question[data-index="${this.currentQuestionIndex}"]`);
    const selectedBtn = questionElement.querySelector('.answer-btn.selected');
    const feedbackEl = questionElement.querySelector('.answer-feedback');
    const feedbackTextEl = questionElement.querySelector('.feedback-text');
    
    if (!selectedBtn) return;
    
    const userAnswer = selectedBtn.dataset.answer === 'true';
    const correctAnswer = questionElement.dataset.answer === 'true';
    const isCorrect = userAnswer === correctAnswer;
    
    // Mark question as answered
    questionElement.classList.add('answered');
    this.userAnswers[this.currentQuestionIndex] = userAnswer;
    
    // Disable check button
    this.checkBtn.disabled = true;
    
    // Apply visual feedback
    if (isCorrect) {
      selectedBtn.classList.add('correct');
      feedbackEl.classList.add('correct-feedback');
      feedbackTextEl.textContent = 'Câu trả lời chính xác!';
    } else {
      selectedBtn.classList.add('incorrect');
      feedbackEl.classList.add('incorrect-feedback');
      feedbackTextEl.textContent = 'Rất tiếc, đáp án này chưa chính xác!';
      
      // Highlight correct answer
      const answerBtns = questionElement.querySelectorAll('.answer-btn');
      answerBtns.forEach(btn => {
        if (btn.dataset.answer === String(correctAnswer)) {
          btn.classList.add('correct-answer');
        }
      });
    }
    
    // Show feedback
    feedbackEl.style.display = 'flex';
    
    // Disable all answer buttons
    const answerBtns = questionElement.querySelectorAll('.answer-btn');
    answerBtns.forEach(btn => {
      btn.classList.add('disabled');
    });
    
    this.checkedQuestions++;
    this.updateProgress();
    
    // If all questions are checked, calculate score
    if (this.checkedQuestions === this.totalQuestions) {
      this.calculateScore();
    }
  }

  // Reset quiz
  resetQuiz() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.checkedQuestions = 0;
    this.userAnswers = Array(this.totalQuestions).fill(null);
    this.quizCompleted = false;
    
    // Reset all question elements
    document.querySelectorAll('.question').forEach(q => {
      q.classList.remove('answered', 'checked');
      const answerBtns = q.querySelectorAll('.answer-btn');
      answerBtns.forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect', 'correct-answer', 'disabled');
      });
      
      // Hide feedback
      const feedbackEl = q.querySelector('.answer-feedback');
      if (feedbackEl) {
        feedbackEl.style.display = 'none';
        feedbackEl.classList.remove('correct-feedback', 'incorrect-feedback');
      }
    });
    
    // Reset UI
    this.updateProgress();
    this.showQuestion(this.currentQuestionIndex);
    this.resultContainer.style.display = 'none';
    this.checkBtn.disabled = true;
    
    // Re-enable and reset buttons
    this.showAnswersBtn.disabled = false;
    this.checkBtn.classList.remove('disabled-btn');
    this.showAnswersBtn.classList.remove('disabled-btn');
    
    // Show notification
    showNotification('Quiz reset! 🔄', 'info');
  }

  // Hiển thị tất cả đáp án
  showAnswers() {
    if (this.quizCompleted) return;
    
    // Confirm before showing answers
    if (!confirm('Are you sure you want to see the solution? This will end the current game.')) {
      return;
    }
    
    // Mark all questions as answered with correct answers
    document.querySelectorAll('.question').forEach((q, i) => {
      const correctAnswer = q.dataset.answer === 'true';
      q.classList.add('answered');
      
      const answerBtns = q.querySelectorAll('.answer-btn');
      answerBtns.forEach(btn => {
        btn.classList.add('disabled');
        if (btn.dataset.answer === q.dataset.answer) {
          btn.classList.add('correct-answer');
        } else if (this.userAnswers[i] !== null && btn.dataset.answer === String(this.userAnswers[i])) {
          btn.classList.add('incorrect');
        }
      });
      
      this.userAnswers[i] = correctAnswer;
    });
    
    this.checkedQuestions = this.totalQuestions;
    this.quizCompleted = true;
    
    // Disable check and show answers buttons
    this.checkBtn.disabled = true;
    this.showAnswersBtn.disabled = true;
    
    // Add visual feedback for disabled buttons
    this.checkBtn.classList.add('disabled-btn');
    this.showAnswersBtn.classList.add('disabled-btn');
    
    this.updateProgress();
    this.calculateScore();
    
    // Show notification
    showNotification('All answers revealed! 🎉', 'info');
  }

  // Thiết lập event listeners
  setupEventListeners() {
    // Navigation buttons
    this.prevBtn.addEventListener('click', () => {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.showQuestion(this.currentQuestionIndex);
        this.updateProgress();
      }
    });
    
    this.nextBtn.addEventListener('click', () => {
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.currentQuestionIndex++;
        this.showQuestion(this.currentQuestionIndex);
        this.updateProgress();
      }
    });
    
    // Answer buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.answer-btn')) {
        const btn = e.target.closest('.answer-btn');
        const questionElement = btn.closest('.question');
        const questionIndex = parseInt(questionElement.dataset.index);
        
        // Only allow selection if question isn't answered
        if (!questionElement.classList.contains('answered')) {
          // Remove selection from other buttons
          questionElement.querySelectorAll('.answer-btn').forEach(b => {
            b.classList.remove('selected');
          });
          
          // Select this button
          btn.classList.add('selected');
          this.userAnswers[questionIndex] = btn.dataset.answer === 'true';
          
          // Enable check button if on current question
          if (questionIndex === this.currentQuestionIndex) {
            this.checkBtn.disabled = false;
          }
        }
      }
    });
    
    // Action buttons
    this.checkBtn.addEventListener('click', () => this.checkCurrentQuestion());
    this.resetBtn.addEventListener('click', () => this.resetQuiz());
    this.showAnswersBtn.addEventListener('click', () => this.showAnswers());
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && !this.prevBtn.disabled) {
        this.prevBtn.click();
      } else if (e.key === 'ArrowRight' && !this.nextBtn.disabled) {
        this.nextBtn.click();
      } else if (e.key === 'Enter' && !this.checkBtn.disabled) {
        this.checkBtn.click();
      }
    });
  }
}