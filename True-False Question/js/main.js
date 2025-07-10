document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const questionsContainer = document.getElementById('questionsContainer');
  const progressDots = document.getElementById('progressDots');
  const progressText = document.getElementById('progressText');
  const resultContainer = document.getElementById('resultContainer');
  const resultText = document.getElementById('result');
  const feedbackText = document.getElementById('feedback');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const checkBtn = document.getElementById('checkBtn');
  const resetBtn = document.getElementById('resetBtn');
  const showAnswersBtn = document.getElementById('showAnswersBtn');
  const fontSizeRange = document.getElementById('fontSizeRange');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const imgSizeRange = document.getElementById('imgSizeRange');
  const imgSizeValue = document.getElementById('imgSizeValue');

  // Quiz state
  let currentQuestionIndex = 0;
  let questions = [];
  let score = 0;
  let checkedQuestions = 0;
  let totalQuestions = 0;
  let userAnswers = [];
  let quizCompleted = false;

  // Initialize the quiz
  async function initQuiz() {
    try {
      // Load questions from JSON file
      const response = await fetch('content/content.json');
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      const quizData = await response.json();
      
      // Handle different JSON structures
      if (Array.isArray(quizData)) {
        // If JSON is directly an array of questions
        questions = quizData;
      } else if (quizData.questions && Array.isArray(quizData.questions)) {
        // If JSON has a questions property containing the array
        questions = quizData.questions;
      } else {
        throw new Error('Invalid quiz data format');
      }
      
      totalQuestions = questions.length;
      userAnswers = Array(totalQuestions).fill(null);
      
      // Create question elements
      createQuestions();
      updateProgress();
      showQuestion(currentQuestionIndex);
      
      // Set up event listeners
      setupEventListeners();
      
      // Initialize settings
      updateFontSize();
      updateImageSize();
    } catch (error) {
      console.error('Error initializing quiz:', error);
      questionsContainer.innerHTML = `<div class="error-message">Error loading questions: ${error.message}</div>`;
    }
  }

  // Create question elements
  function createQuestions() {
    questionsContainer.innerHTML = '';
    
    questions.forEach((question, index) => {
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
        // Simple image path
        imageHtml = `<img src="content/images/${question.image}" alt="Question image" class="question-image">`;
      } else if (question.params?.media?.type?.params?.file?.path) {
        // Complex media structure
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
      
      questionsContainer.appendChild(questionElement);
    });
  }

  // Show a specific question
  function showQuestion(index) {
    const questionElements = document.querySelectorAll('.question');
    questionElements.forEach((q, i) => {
      q.classList.toggle('active', i === index);
    });
    
    // Update navigation buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === totalQuestions - 1;
    
    // Update check button based on whether question is answered
    const currentQuestion = questionElements[index];
    const answered = currentQuestion.classList.contains('answered');
    checkBtn.disabled = answered || userAnswers[index] === null;
    
    // Highlight selected answer if exists
    if (userAnswers[index] !== null) {
      const answerBtns = currentQuestion.querySelectorAll('.answer-btn');
      answerBtns.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.answer === String(userAnswers[index]));
      });
    }
  }

  // Update progress indicators
  function updateProgress() {
    // Update progress dots
    progressDots.innerHTML = '';
    for (let i = 0; i < totalQuestions; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      if (i === currentQuestionIndex) {
        dot.classList.add('active');
      }
      if (userAnswers[i] !== null) {
        dot.classList.add('answered');
      }
      dot.addEventListener('click', () => {
        currentQuestionIndex = i;
        showQuestion(i);
        updateProgress();
      });
      progressDots.appendChild(dot);
    }
    
    // Update progress text
    const answeredCount = userAnswers.filter(answer => answer !== null).length;
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions} (${answeredCount} answered)`;
    
    // Update result text if all questions are answered
    if (answeredCount === totalQuestions && !quizCompleted) {
      calculateScore();
      quizCompleted = true;
    }
  }

  // Calculate final score
  function calculateScore() {
    score = 0;
    questions.forEach((q, i) => {
      // Xác định đáp án đúng
      const correctAnswer = q.answer !== undefined ? q.answer : 
                          q.params?.correct !== undefined ? q.params.correct : 
                          true;
      
      // Chuyển đổi về boolean để so sánh chính xác
      const userAnswer = userAnswers[i];
      const correctAnswerBool = String(correctAnswer) === 'true';
      
      // Chỉ tính điểm nếu đã trả lời và đúng
      if (userAnswer !== null && userAnswer === correctAnswerBool) {
        score++;
      }
    });

    // Hiển thị kết quả
    resultText.textContent = `You got ${score} out of ${totalQuestions} correct`;
    
    // Provide feedback based on score
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 90) {
      feedbackText.textContent = 'Excellent! You know your stuff! 🎉';
    } else if (percentage >= 70) {
      feedbackText.textContent = 'Good job! You did well! 👍';
    } else if (percentage >= 50) {
      feedbackText.textContent = 'Not bad! Keep practicing! 😊';
    } else {
      feedbackText.textContent = 'Keep trying! You can do better! 💪';
    }
    
    // Show result container
    resultContainer.style.display = 'block';

    // Disable check and show answers buttons
    checkBtn.disabled = true;
    showAnswersBtn.disabled = true;

    // Add visual feedback for disabled buttons
    checkBtn.classList.add('disabled-btn');
    showAnswersBtn.classList.add('disabled-btn');
  }

  // Check the current question
  function checkCurrentQuestion() {
    const questionElement = document.querySelector(`.question[data-index="${currentQuestionIndex}"]`);
    const selectedBtn = questionElement.querySelector('.answer-btn.selected');
    const feedbackEl = questionElement.querySelector('.answer-feedback');
    const feedbackTextEl = questionElement.querySelector('.feedback-text');
    
    if (!selectedBtn) return;
    
    const userAnswer = selectedBtn.dataset.answer === 'true';
    const correctAnswer = questionElement.dataset.answer === 'true';
    const isCorrect = userAnswer === correctAnswer;
    
    // Mark question as answered
    questionElement.classList.add('answered');
    userAnswers[currentQuestionIndex] = userAnswer;
    
    // Disable check button
    checkBtn.disabled = true;
    
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
    
    checkedQuestions++;
    updateProgress();
    
    // If all questions are checked, calculate score
    if (checkedQuestions === totalQuestions) {
      calculateScore();
    }
  }

  // Reset the quiz
  function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    checkedQuestions = 0;
    userAnswers = Array(totalQuestions).fill(null);
    quizCompleted = false;
    
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
    updateProgress();
    showQuestion(currentQuestionIndex);
    resultContainer.style.display = 'none';
    checkBtn.disabled = true;
    
    // Re-enable and reset buttons
    showAnswersBtn.disabled = false;
    checkBtn.classList.remove('disabled-btn');
    showAnswersBtn.classList.remove('disabled-btn');
    
    // Show notification
    showNotification('Quiz reset! 🔄', 'info');
  }

  // Show all answers
  function showAnswers() {
    if (quizCompleted) return;
    
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
        } else if (userAnswers[i] !== null && btn.dataset.answer === String(userAnswers[i])) {
          btn.classList.add('incorrect');
        }
      });
      
      userAnswers[i] = correctAnswer;
    });
    
    checkedQuestions = totalQuestions;
    quizCompleted = true;
    
    // Disable check and show answers buttons
    checkBtn.disabled = true;
    showAnswersBtn.disabled = true;
    
    // Add visual feedback for disabled buttons
    checkBtn.classList.add('disabled-btn');
    showAnswersBtn.classList.add('disabled-btn');
    
    updateProgress();
    calculateScore();
    
    // Show notification
    showNotification('All answers revealed! 🎉', 'info');
  }

  // Show notification
  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Update font size
  function updateFontSize() {
    const size = fontSizeRange.value;
    fontSizeValue.textContent = `${size}px`;
    document.documentElement.style.setProperty('--font-size', `${size}px`);
  }

  // Update image size
  function updateImageSize() {
    const size = imgSizeRange.value;
    imgSizeValue.textContent = `${size}px`;
    document.documentElement.style.setProperty('--img-size', `${size}px`);
  }

  // Set up event listeners
  function setupEventListeners() {
    // Navigation buttons
    prevBtn.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
        updateProgress();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
        updateProgress();
      }
    });
    
    // Answer buttons
    document.addEventListener('click', function(e) {
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
          userAnswers[questionIndex] = btn.dataset.answer === 'true';
          
          // Enable check button if on current question
          if (questionIndex === currentQuestionIndex) {
            checkBtn.disabled = false;
          }
        }
      }
    });
    
    // Action buttons
    checkBtn.addEventListener('click', checkCurrentQuestion);
    resetBtn.addEventListener('click', resetQuiz);
    showAnswersBtn.addEventListener('click', showAnswers);
    
    // Settings controls
    fontSizeRange.addEventListener('input', updateFontSize);
    imgSizeRange.addEventListener('input', updateImageSize);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
        prevBtn.click();
      } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
        nextBtn.click();
      } else if (e.key === 'Enter' && !checkBtn.disabled) {
        checkBtn.click();
      }
    });
  }

  // Start the quiz
  initQuiz();
});