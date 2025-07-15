// celebration.js
function showCompletionNotification(score, totalQuestions) {
  const modal = document.getElementById('completionModal');
  const finalScore = document.getElementById('finalScore');
  
  finalScore.innerHTML = `${score}/${totalQuestions}`;
  modal.classList.add('active');
  
  createConfetti();
}

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

  const colors = ['#4361ee', '#3f37c9', '#4cc9f0', '#4ad66d', '#f72585'];

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.position = 'absolute';
    confetti.style.width = Math.random() * 10 + 5 + 'px';
    confetti.style.height = confetti.style.width;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.opacity = Math.random() + 0.5;
    confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
    
    confettiContainer.appendChild(confetti);
  }

  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

// Thêm style cho animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

// Xuất hàm để sử dụng trong script.js
window.showCompletionNotification = showCompletionNotification;