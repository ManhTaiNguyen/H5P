let questions = [];
let currentIndex = 0;
let score = 0;

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

  container.innerHTML = `
    <video id="questionVideo" src="content/${videoSrc}" controls autoplay></video>
    <p style="font-size: 1.1rem;
              font-weight: 500;
              margin: 15px 0;
              color: var(--dark-color);
              text-align: center;
              padding: 0 10px;">
      ${question.params.question}</p>
    <button id="speakButton" class="control-btn" onclick="startSpeechRecognition()">
      <i class="fa-solid fa-microphone"></i>Nhấn để nói
    </button>
    <div id="resultText"></div>
  `;

  document.getElementById("score").innerText = score;

  document.querySelector(".controls").innerHTML = `
    <button class="control-btn" onclick="prevQuestion()">⟵</button>
    <div id="dots-container" class="dots"></div>
    <button class="control-btn" onclick="nextQuestion()">⟶</button>
  `;
  updateDots();
}

function startSpeechRecognition() {
  const resultEl = document.getElementById("resultText");
  const speakButton = document.getElementById("speakButton");
  
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
    if (correctAnswers.includes(transcript)) {
      resultEl.innerHTML += "<br><span style='color:green'>✅ Câu trả lời đúng!</span>";
      score += 1;
      // Thêm hiệu ứng khi trả lời đúng
      const correctAnim = document.createElement('div');
      correctAnim.className = 'correct-answer-animation';
      correctAnim.innerHTML = '✓';
      document.body.appendChild(correctAnim);
      setTimeout(() => correctAnim.remove(), 1500);

      // Kiểm tra nếu đây là câu hỏi cuối cùng và đã trả lời đúng
      if (currentIndex === questions.length - 1) {
        setTimeout(() => {
          showCompletionNotification();
        }, 1000);
      }
    } else {
      resultEl.innerHTML += "<br><span style='color:red'>❌ Câu trả lời sai!</span>";
    }

    document.getElementById("score").innerText = score;
    resetSpeakButton();
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

function resetSpeakButton() {
  const speakButton = document.getElementById("speakButton");
  speakButton.innerHTML = '<i class="fa-solid fa-microphone"></i> Nhấn để nói';
  speakButton.classList.remove("listening");
}

function nextQuestion() {
  currentIndex = (currentIndex + 1) % questions.length;
  renderQuestion();
  
  // Kiểm tra nếu đã quay lại câu đầu tiên (đã hoàn thành vòng lặp)
  if (currentIndex === 0) {
    showCompletionNotification();
  }
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

function createConfetti() {
  const colors = ['#4361ee', '#3f37c9', '#4cc9f0', '#4ad66d', '#f72585'];
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
    confetti.style.opacity = Math.random() + 0.5;
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = confetti.style.width;
    
    document.body.appendChild(confetti);
    
    // Tự động xóa confetti sau khi animation kết thúc
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

function prevQuestion() {
  currentIndex = (currentIndex - 1 + questions.length) % questions.length;
  renderQuestion();
}

function retry() {
  score = 0;
  currentIndex = 0;
  questions = shuffle(questions);
  renderQuestion();
  closeCompletionModal(); // Thêm dòng này để đóng modal nếu đang mở
  
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
  dotsContainer.innerHTML = questions.map((_, i) => `
    <span class="dot ${i === currentIndex ? "active" : ""}" onclick="goToQuestion(${i})"></span>
  `).join("");
}

function goToQuestion(index) {
  currentIndex = index;
  renderQuestion();
}

function testCompletion() {
  // Đặt score bằng tổng số câu hỏi để test hiệu ứng
  score = questions.length;
  document.getElementById("score").innerText = score;
  showCompletionNotification();
}

// Thêm hàm tạo hiệu ứng confetti (tùy chọn)
function createConfetti() {
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
  
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = getRandomColor();
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = '50%';
    confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
    
    confettiContainer.appendChild(confetti);
  }
  
  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

function getRandomColor() {
  const colors = ['#4361ee', '#3f37c9', '#4cc9f0', '#4ad66d', '#f72585'];
  return colors[Math.floor(Math.random() * colors.length)];
}