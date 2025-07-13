let questions = [];
let currentIndex = 0;
let score = 0;
let answeredQuestions = [];
const REQUIRED_CORRECT_ANSWERS = 5; // Số câu cần trả lời đúng để hoàn thành

// Load content.json
fetch("content/content.json")
  .then((res) => res.json())
  .then((data) => {
    questions = shuffle(data.questions);
    renderQuestion();
  });

function renderQuestion() {
  const container = document.getElementById("question-container");
  const question = questions[currentIndex];
  const videoSrc = question.params.media.type.params.sources[0].path;
  const acceptedAnswers = question.params.acceptedAnswers;
  const answerStatus = answeredQuestions[currentIndex];

  let speakButtonHTML = '';
  let resultHTML = '';

  if (answerStatus === 'correct') {
    // Nếu đã trả lời đúng, hiển thị đáp án và disable nút nói
    resultHTML = `
      <div class="answered-result">
        <span style="color: var(--success-color);">✓ Đã trả lời đúng</span>
        <div class="correct-answers">
          <strong>Đáp án đúng:</strong> ${acceptedAnswers.join(", ")}
        </div>
      </div>
    `;
    
    speakButtonHTML = `
      <button id="speakButton" class="control-btn" disabled>
        <i class="fa-solid fa-microphone-slash"></i>Đã trả lời
      </button>
    `;
  } else {
    // Nếu chưa trả lời hoặc trả lời sai, cho phép trả lời lại
    speakButtonHTML = `
      <button id="speakButton" class="control-btn" onclick="startSpeechRecognition()">
        <i class="fa-solid fa-microphone"></i>Nhấn để nói
      </button>
    `;
    
    if (answerStatus === 'wrong') {
      resultHTML = `
        <div class="answered-result">
          <span style="color: var(--error-color);">✗ Đã trả lời sai</span>
          <div id="resultText">Bạn nói: ${transcript}</div>
        </div>
      `;
    }
    else {
      resultHTML = '<div id="resultText"></div>';
    }
  }

  container.innerHTML = `
    <video id="questionVideo" src="content/${videoSrc}" controls autoplay></video>
    <p>${question.params.question}</p>
    ${speakButtonHTML}
    ${resultHTML}
  `;

  document.getElementById("score").innerText = score;

  document.querySelector(".controls").innerHTML = `
    <button class="control-btn" onclick="prevQuestion()">⟵</button>
    <div id="dots-container" class="dots"></div>
    <button class="control-btn" onclick="nextQuestion()">⟶</button>
  `;
  updateDots();

  // Kiểm tra nếu đủ số câu trả lời đúng
  if (checkAllQuestionsAnswered()) {
    showCompletionNotification();
  }
}

function startSpeechRecognition() {
  const resultEl = document.getElementById("resultText");
  const speakButton = document.getElementById("speakButton");
  
  // Kiểm tra nếu câu hỏi đã được trả lời đúng thì không làm gì
  if (answeredQuestions[currentIndex] === 'correct') return;

  // Thêm hiệu ứng sóng âm thanh
  speakButton.innerHTML = `
    <i class="fa-solid fa-microphone"></i> Đang nghe...
    <div class="sound-wave">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
  `;
  
  speakButton.classList.add("listening");
  resultEl.innerHTML = '<div class="listening-animation">🎤 Đang lắng nghe...</div>';

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let transcript = event.results[0][0].transcript.toLowerCase().trim();
    transcript = transcript.replace(/[.,!?]+$/, '');
    resultEl.innerText = "Bạn nói: " + transcript;

    const correctAnswers = questions[currentIndex].params.acceptedAnswers.map(a => a.toLowerCase().trim());

    const isCorrect = correctAnswers.includes(transcript);    
    // Chỉ cập nhật nếu chưa trả lời đúng hoặc đang trả lời lại
    if (answeredQuestions[currentIndex] !== 'correct') {
      answeredQuestions[currentIndex] = isCorrect ? 'correct' : 'wrong';
    }

    if (isCorrect) {
      resultEl.innerHTML += "<br><span style='color:green'>✅ Câu trả lời đúng!</span>";
      score += 1;
      // Thêm hiệu ứng khi trả lời đúng
      const correctAnim = document.createElement('div');
      correctAnim.className = 'correct-answer-animation';
      correctAnim.innerHTML = '✓';
      document.body.appendChild(correctAnim);
      setTimeout(() => correctAnim.remove(), 1500);

      // Kiểm tra nếu đủ số câu trả lời đúng
      if (checkAllQuestionsAnswered()) {
        setTimeout(() => {
          showCompletionNotification();
        }, 1000);
      }
    } else {
      resultEl.innerHTML += "<br><span style='color:red'>❌ Câu trả lời sai! Hãy thử lại.</span>";
    }

    document.getElementById("score").innerText = score;
    resetSpeakButton();
    renderQuestion();
  };

  recognition.onerror = () => {
    resultEl.innerHTML = "<span style='color:red'>Không thể nhận dạng giọng nói.</span>";
    resetSpeakButton();
  };

  recognition.onend = () => {
    resetSpeakButton();
  };

  recognition.start();
}

function checkAllQuestionsAnswered() {
  // Đếm số câu trả lời đúng
  const correctCount = answeredQuestions.filter(answer => answer === 'correct').length;
  return correctCount >= REQUIRED_CORRECT_ANSWERS;
}

function resetSpeakButton() {
  const speakButton = document.getElementById("speakButton");
  speakButton.innerHTML = '<i class="fa-solid fa-microphone"></i> Nhấn để nói';
  speakButton.classList.remove("listening");
}

function nextQuestion() {
  currentIndex = (currentIndex + 1) % questions.length;
  renderQuestion();
}

function prevQuestion() {
  currentIndex = (currentIndex - 1 + questions.length) % questions.length;
  renderQuestion();
}

function showCompletionNotification() {
  const modal = document.getElementById('completionModal');
  const finalScore = document.getElementById('finalScore');
  
  finalScore.innerHTML = `${score}/${questions.length}`;
  modal.classList.add('active');
  
  // Tạo hiệu ứng confetti
  createConfetti();
}

function closeCompletionModal() {
  const modal = document.getElementById('completionModal');
  modal.classList.remove('active');
}

function retry() {
  score = 0;
  currentIndex = 0;
  answeredQuestions = [];
  questions = shuffle(questions);
  renderQuestion();
  closeCompletionModal();
  
  // Hiển thị thông báo
  const notification = document.getElementById('notification');
  notification.textContent = 'Game reset!';
  notification.className = 'notification notification-info';
  notification.style.display = 'block';
  
  // Kích hoạt hiệu ứng hiển thị
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Ẩn thông báo sau 3 giây
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.style.display = 'none';
    }, 300);
  }, 3000);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateDots() {
  const dotsContainer = document.getElementById("dots-container");
  dotsContainer.innerHTML = questions.map((_, i) => {
    let dotClass = "dot";
    
    if (i === currentIndex) {
      dotClass += " current";
    } else if (answeredQuestions[i] === 'correct') {
      dotClass += " answered";
    } else if (answeredQuestions[i] === 'wrong') {
      dotClass += " answered-wrong";
    }
    
    return `<span class="${dotClass}" onclick="goToQuestion(${i})"></span>`;
  }).join("");
}

function goToQuestion(index) {
  currentIndex = index;
  renderQuestion();
}

function createConfetti() {
  // Tạo container cho confetti
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '9999';
  
  document.body.appendChild(confettiContainer);

  // Màu sắc cho confetti
  const colors = ['#4361ee', '#3f37c9', '#4cc9f0', '#4ad66d', '#f72585'];

  // Tạo các phần tử confetti
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Thiết lập style ngẫu nhiên
    confetti.style.position = 'absolute';
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = confetti.style.width;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.opacity = Math.random() + 0.5;
    
    // Animation rơi
    const animationDuration = Math.random() * 3 + 2;
    confetti.style.animation = `fall ${animationDuration}s linear forwards`;
    
    // Thêm vào container
    confettiContainer.appendChild(confetti);
  }
  
  // Tự động xóa confetti sau khi animation kết thúc
  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

// Hàm phụ trợ để lấy màu ngẫu nhiên (nếu cần)
function getRandomColor() {
  const colors = ['#4361ee', '#3f37c9', '#4cc9f0', '#4ad66d', '#f72585'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function testCompletion() {
  // Đặt điểm số bằng số câu hỏi cần để hoàn thành
  score = REQUIRED_CORRECT_ANSWERS;
  
  // Đánh dấu ngẫu nhiên REQUIRED_CORRECT_ANSWERS câu là đúng
  let correctCount = 0;
  answeredQuestions = questions.map((_, index) => {
    if (correctCount < REQUIRED_CORRECT_ANSWERS && Math.random() > 0.5) {
      correctCount++;
      return 'correct';
    }
    return undefined;
  });
  
  // Đảm bảo đủ số câu đúng
  while (correctCount < REQUIRED_CORRECT_ANSWERS) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    if (answeredQuestions[randomIndex] !== 'correct') {
      answeredQuestions[randomIndex] = 'correct';
      correctCount++;
    }
  }
  
  // Cập nhật giao diện
  document.getElementById("score").innerText = score;
  renderQuestion();
  
  // Hiển thị thông báo test
  const notification = document.getElementById('notification');
  notification.textContent = `Test mode: ${REQUIRED_CORRECT_ANSWERS} câu đúng đã được đặt`;
  notification.className = 'notification notification-info';
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.style.display = 'none';
    }, 300);
  }, 3000);
  
  // Tự động hiển thị thông báo hoàn thành nếu đủ điều kiện
  if (checkAllQuestionsAnswered()) {
    setTimeout(() => {
      showCompletionNotification();
    }, 1000);
  }
}