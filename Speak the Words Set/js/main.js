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
    <p style="font-size: 1rem;
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
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
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
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
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
