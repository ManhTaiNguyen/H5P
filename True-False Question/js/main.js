// Global variables
let currentQuestionIndex = 0;
let questions = [];
let quizData = {};

// DOM elements
const questionsContainer = document.getElementById('questionsContainer');
const progressDots = document.getElementById('progressDots');
const progressText = document.getElementById('progressText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const checkBtn = document.getElementById('checkBtn');
const showAnswersBtn = document.getElementById('showAnswersBtn');
const resetBtn = document.getElementById('resetBtn');
const resultContainer = document.getElementById('resultContainer');
const result = document.getElementById('result');
const feedback = document.getElementById('feedback');
const fontSlider = document.getElementById('fontSizeRange');
const imgSlider = document.getElementById('imgSizeRange');
const fontSizeValue = document.getElementById('fontSizeValue');
const imgSizeValue = document.getElementById('imgSizeValue');

// Initialize the quiz
// Hàm load JSON và khởi tạo quiz
async function initQuiz() {
  try {
    // Hiển thị loading
    questionsContainer.innerHTML = '<div class="loading" style="height: 300px; border-radius: var(--border-radius);"></div>';
    
    // 1. Load file content.json
    const response = await fetch('content/content.json');
    if (!response.ok) {
      throw new Error('Không thể tải file content.json');
    }
    
    quizData = await response.json();
    questions = quizData.questions;
    
    // 2. Xử lý đường dẫn ảnh
    questions.forEach(question => {
      if (question.params.media && question.params.media.type) {
        // Thêm đường dẫn tương đối đến thư mục content/images
        const imagePath = question.params.media.type.params.file.path;
        question.params.media.type.params.file.path = `content/${imagePath}`;
      }
    });
    
    // 3. Tạo câu hỏi và giao diện
    createQuestions();
    createProgressIndicators();
    showQuestion(currentQuestionIndex);
    setupEventListeners();
    updateSliderValues();
    
  } catch (error) {
    console.error("Lỗi khi khởi tạo quiz:", error);
    // Hiển thị thông báo lỗi với hiệu ứng
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <p>Có lỗi xảy ra khi tải nội dung quiz. Vui lòng thử lại.</p>
    `;
    questionsContainer.innerHTML = '';
    questionsContainer.appendChild(errorEl);
    questionsContainer.classList.add('shake');
    setTimeout(() => questionsContainer.classList.remove('shake'), 500);
  }
}

// Create question elements
function createQuestions() {
  questionsContainer.innerHTML = '';
  
  questions.forEach((question, index) => {
    const questionEl = document.createElement('div');
    questionEl.className = 'question';
    questionEl.dataset.index = index;
    questionEl.dataset.answer = question.params.correct;
    
    // Media (image)
    if (question.params.media && question.params.media.type) {
      const mediaContainer = document.createElement('div');
      mediaContainer.className = 'question-content';
      
      const img = document.createElement('img');
      img.src = question.params.media.type.params.file.path;
      img.alt = question.params.media.type.params.contentName;
      mediaContainer.appendChild(img);
      
      questionEl.appendChild(mediaContainer);
    }
    
    // Question text
    const questionText = document.createElement('h3');
    questionText.innerHTML = question.params.question;
    questionEl.appendChild(questionText);
    
    // Answer buttons
    const answerButtons = document.createElement('div');
    answerButtons.className = 'answer-buttons';
    
    const trueButton = document.createElement('button');
    trueButton.className = 'answer-btn true-btn';
    trueButton.innerHTML = `${question.params.l10n.trueText}`;
    trueButton.dataset.answer = 'true';
    answerButtons.appendChild(trueButton);
    
    const falseButton = document.createElement('button');
    falseButton.className = 'answer-btn false-btn';
    falseButton.innerHTML = `${question.params.l10n.falseText}`;
    falseButton.dataset.answer = 'false';
    answerButtons.appendChild(falseButton);
    
    // Thêm phần hiển thị feedback
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'answer-feedback';
    feedbackEl.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <span class="feedback-text"></span>
    `;
    
    questionEl.appendChild(answerButtons);
    questionEl.appendChild(feedbackEl);
    
    questionsContainer.appendChild(questionEl);
  });
}

// Create progress indicators
function createProgressIndicators() {
  progressDots.innerHTML = '';
  
  questions.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    dot.dataset.index = index;
    dot.addEventListener('click', () => navigateToQuestion(index));
    progressDots.appendChild(dot);
  });
  
  updateProgressText();
}

// Show a specific question
function showQuestion(index) {
    // Ẩn câu hỏi hiện tại với hiệu ứng
  const currentActive = document.querySelector('.question.active');
  if (currentActive) {
    currentActive.classList.add('fade-out');
    setTimeout(() => {
      currentActive.classList.remove('active', 'fade-out');
    }, 300);
  }
  
  // Hiển thị câu hỏi mới với hiệu ứng
  const newQuestion = document.querySelectorAll('.question')[index];
  newQuestion.classList.add('active', 'fade-in');
  setTimeout(() => newQuestion.classList.remove('fade-in'), 300);

  // Hide all questions
  document.querySelectorAll('.question').forEach(q => {
    q.classList.remove('active');
  });
  
  // Show the selected question
  document.querySelectorAll('.question')[index].classList.add('active');
  
  // Update progress dots
  document.querySelectorAll('.progress-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
  
  // Update navigation buttons
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === questions.length - 1;
  
  // Update current question index
  currentQuestionIndex = index;
  
  // Update progress text
  updateProgressText();
}

// Update progress text
function updateProgressText() {
  const current = currentQuestionIndex + 1;
  const total = questions.length;
  progressText.textContent = quizData.texts.textualProgress
    .replace('@current', current)
    .replace('@total', total);
}

// Navigate to a specific question
function navigateToQuestion(index) {
  if (index >= 0 && index < questions.length) {
    showQuestion(index);
  }
}

// Check answers
function checkAnswers() {
  let score = 0;
  const questionsEl = document.querySelectorAll('.question');
  
  questionsEl.forEach(q => {
    const selected = q.querySelector('button.selected');
    const correct = q.dataset.answer;
    
    if (selected && selected.dataset.answer === correct) {
      score++;
      selected.style.border = '2px solid green';
    } else if (selected) {
      selected.style.border = '2px solid red';
    }

    // Hiển thị kết quả với hiệu ứng
    resultContainer.style.display = 'block';
    resultContainer.classList.add('pop-in');
    setTimeout(() => resultContainer.classList.remove('pop-in'), 500);
    
    // Thêm hiệu ứng confetti nếu điểm cao
    if (percentage >= quizData.passPercentage) {
        createConfetti();
    }
  });
  
  // Calculate percentage
  const percentage = Math.round((score / questions.length) * 100);
  
  // Display result
  result.textContent = `${quizData.endGame.message} ${score} / ${questions.length}`;
  feedback.textContent = getFeedback(percentage);
  
  // Mark answered questions in progress dots
  document.querySelectorAll('.question').forEach((q, i) => {
    const dot = document.querySelector(`.progress-dot[data-index="${i}"]`);
    if (q.querySelector('button.selected')) {
      dot.classList.add('answered');
    }
  });
}

// Show correct answers
function showAnswers() {
  document.querySelectorAll('.question').forEach(q => {
    const correct = q.dataset.answer;
    q.querySelector(`button[data-answer="${correct}"]`).classList.add('correct-answer');
  });
}

// Reset quiz
function resetQuiz() {
  // Reset all answers
  document.querySelectorAll('.question button').forEach(b => {
    b.classList.remove('selected', 'correct-answer');
    b.style.border = 'none';
  });
  
  // Reset progress dots
  document.querySelectorAll('.progress-dot').forEach(dot => {
    dot.classList.remove('answered');
  });
  
  // Reset result display
  result.textContent = '';
  feedback.textContent = '';
  
  // Go back to first question
  showQuestion(0);
  
  // Reset audio elements
  document.querySelectorAll('audio').forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

// Get feedback based on score percentage
function getFeedback(percentage) {
  if (!quizData.endGame.overallFeedback || quizData.endGame.overallFeedback.length === 0) {
    return '';
  }
  
  // In a real implementation, you would use the feedback ranges from quizData
  if (percentage >= quizData.passPercentage) {
    return "Good job! You passed the quiz.";
  } else {
    return "Try again to improve your score.";
  }
}

// Update slider values display
function updateSliderValues() {
  fontSizeValue.textContent = `${fontSlider.value}px`;
  imgSizeValue.textContent = `${imgSlider.value}px`;
}

// Setup event listeners
function setupEventListeners() {
  // Navigation buttons
  prevBtn.addEventListener('click', () => navigateToQuestion(currentQuestionIndex - 1));
  nextBtn.addEventListener('click', () => navigateToQuestion(currentQuestionIndex + 1));
  
  // Action buttons
  checkBtn.addEventListener('click', checkAnswers);
  showAnswersBtn.addEventListener('click', showAnswers);
  resetBtn.addEventListener('click', resetQuiz);
  
  document.querySelectorAll('.answer-btn').forEach(button => {
    button.addEventListener('click', function() {
      const question = this.closest('.question');
      const feedbackEl = question.querySelector('.answer-feedback');
      
      feedbackEl.style.display = 'none';
      
      const allButtons = question.querySelectorAll('.answer-btn');
      allButtons.forEach(btn => {
        btn.classList.remove('selected', 'dimmed');
      });
      this.classList.add('selected');

      // Làm mờ nút còn lại
      allButtons.forEach(btn => {
        if (!btn.classList.contains('selected')) {
          btn.classList.add('dimmed');
        }
      });
      
      const index = parseInt(question.dataset.index);
      document.querySelector(`.progress-dot[data-index="${index}"]`).classList.add('answered');
      
      if (quizData.autoCheck) {
        checkSingleAnswer(question);
      }
    });
  });
  
  // Font and image size sliders
  fontSlider.addEventListener('input', () => {
    document.documentElement.style.setProperty('--font-size', fontSlider.value + 'px');
    updateSliderValues();
  });
  
  imgSlider.addEventListener('input', () => {
    document.documentElement.style.setProperty('--img-size', imgSlider.value + 'px');
    updateSliderValues();
  });
}

// Thêm hàm kiểm tra từng câu hỏi
function checkSingleAnswer(questionEl) {
  const selectedBtn = questionEl.querySelector('.answer-btn.selected');
  const feedbackEl = questionEl.querySelector('.answer-feedback');
  const feedbackText = questionEl.querySelector('.feedback-text');
  const correctAnswer = questionEl.dataset.answer;
  
  if (!selectedBtn) return;
  
  // Hiệu ứng loading
  feedbackEl.style.display = 'block';
  feedbackEl.classList.add('checking');
  
  setTimeout(() => {
    feedbackEl.classList.remove('checking');
    
    if (selectedBtn.dataset.answer === correctAnswer) {
      // Đáp án đúng
      selectedBtn.classList.add('correct');
      feedbackEl.classList.add('correct-feedback');
      feedbackEl.classList.remove('incorrect-feedback');
      feedbackText.textContent = quizData.texts.correctFeedback || 'Chính xác! Đáp án đúng.';
    } else {
      // Đáp án sai
      selectedBtn.classList.add('incorrect');
      feedbackEl.classList.add('incorrect-feedback');
      feedbackEl.classList.remove('correct-feedback');
      feedbackText.textContent = quizData.texts.incorrectFeedback || 'Chưa chính xác. Hãy thử lại!';
      
      // Highlight đáp án đúng
      const correctBtn = questionEl.querySelector(`.answer-btn[data-answer="${correctAnswer}"]`);
      correctBtn.classList.add('correct-answer');
    }
    
    // Ẩn hiệu ứng sau 3s
    setTimeout(() => {
      selectedBtn.classList.remove('correct', 'incorrect');
    }, 3000);
  }, 500);
}

// Cập nhật hàm checkAnswers
function checkAnswers() {
  // Hiệu ứng loading
  checkBtn.classList.add('loading');
  resultContainer.style.opacity = '0';
  
  setTimeout(() => {
    checkBtn.classList.remove('loading');
    
    let score = 0;
    const questionsEl = document.querySelectorAll('.question');
    
    questionsEl.forEach(q => {
      checkSingleAnswer(q);
      
      const selected = q.querySelector('.answer-btn.selected');
      const correct = q.dataset.answer;
      
      if (selected && selected.dataset.answer === correct) {
        score++;
      }
    });
    
    // Tính phần trăm
    const percentage = Math.round((score / questions.length) * 100);
    
    // Hiển thị kết quả
    result.innerHTML = `
      <div class="result">You got ${score} of ${questions.length} points</div>
      <div class="score-bar">
        <div class="bar"></div>
        <span class="star">⭐</span>
        <span class="score-text">${score} / ${questions.length}</span>
      </div>
    `;
    
    // Animate score bar width
    const barEl = document.querySelector('.score-bar .bar');
    const starEl = document.querySelector('.score-bar .star');
    const percent = Math.round((score / questions.length) * 100);

    // Animate bar
    setTimeout(() => {
      barEl.style.width = percent + '%';
    }, 100);

    // Show star AFTER bar fills
    setTimeout(() => {
      if (percent >= quizData.passPercentage) {
        starEl.classList.add('visible');
      }
    }, 1200);

    feedback.textContent = getFeedback(percentage);
    
    // Hiệu ứng hiển thị kết quả
    resultContainer.style.display = 'block';
    setTimeout(() => {
      resultContainer.style.opacity = '1';
    }, 100);
    
    // Confetti nếu điểm cao
    if (percentage >= quizData.passPercentage) {
      createConfetti();
    }
  }, 800);
}

// Thêm hàm tạo confetti
function createConfetti() {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  document.body.appendChild(confettiContainer);
  
  for (let i = 0; i < 150; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
      confetti.style.width = Math.random() * 10 + 5 + 'px';
      confetti.style.height = Math.random() * 10 + 5 + 'px';
      confettiContainer.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }, Math.random() * 1000);
  }
  
  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

// Ẩn intro, hiển thị quiz
document.getElementById('startQuizBtn').addEventListener('click', () => {
  document.getElementById('introScreen').style.display = 'none';
  document.querySelector('.quiz-container').style.display = 'block';
  initQuiz(); // Khởi tạo quiz sau khi nhấn bắt đầu
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.quiz-container').style.display = 'none'; // Ẩn quiz ban đầu
});

document.addEventListener('DOMContentLoaded', function() {
  const trueBubble = document.querySelector('.speech-bubble.true');
  const falseBubble = document.querySelector('.speech-bubble.false');
  const orLabel = document.querySelector('.center-label');
  
  // Hiệu ứng khi di chuột vào TRUE
  trueBubble.addEventListener('mouseenter', () => {
    orLabel.style.color = 'var(--correct-color)';
    orLabel.style.textShadow = '0 0 10px rgba(0, 184, 148, 0.5)';
  });
  
  // Hiệu ứng khi di chuột vào FALSE
  falseBubble.addEventListener('mouseenter', () => {
    orLabel.style.color = 'var(--incorrect-color)';
    orLabel.style.textShadow = '0 0 10px rgba(214, 48, 49, 0.5)';
  });
  
  // Reset khi di chuột ra
  [trueBubble, falseBubble].forEach(bubble => {
    bubble.addEventListener('mouseleave', () => {
      orLabel.style.color = 'var(--primary-color)';
      orLabel.style.textShadow = '1px 1px 3px rgba(0,0,0,0.1)';
    });
  });
});

document.querySelectorAll('.answer-btn').forEach(button => {
  button.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');

    const rect = this.getBoundingClientRect();
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});
