// celebration.js

/**
 * Displays a notification message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - The type of notification (e.g., 'success', 'error', 'info', 'warning').
 */
window.showNotification = function (message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Show the notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 10); // Small delay to trigger CSS transition

  // Hide and remove the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    notification.addEventListener("transitionend", () => {
      notification.remove();
    });
  }, 3000);
};

/**
 * Creates and animates confetti particles on the screen.
 */
window.createConfetti = function () {
  const confettiContainer =
    document.querySelector(".confetti-container") ||
    document.createElement("div");
  confettiContainer.className = "confetti-container";
  if (!document.querySelector(".confetti-container")) {
    document.body.appendChild(confettiContainer);
  }

  const colors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ];
  const numConfetti = 50;

  for (let i = 0; i < numConfetti; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = `${-Math.random() * 20}vh`; // Start above the viewport
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.animationDuration = `${Math.random() * 2 + 3}s`; // 3 to 5 seconds
    confetti.style.animationDelay = `${Math.random() * 0.5}s`; // Stagger animation
    confettiContainer.appendChild(confetti);

    // Remove confetti after animation ends to prevent DOM bloat
    confetti.addEventListener("animationend", () => {
      confetti.remove();
    });
  }
};

/**
 * Shows the completion modal with the final score.
 * @param {number} correct - The number of correct answers.
 * @param {number} total - The total number of questions.
 */
window.showCompletionNotification = function (correct, total) {
  const modal = document.getElementById("completionModal");
  const finalScoreSpan = document.getElementById("finalScore");
  const closeModalBtn = document.getElementById("closeModalBtn");

  if (finalScoreSpan) {
    finalScoreSpan.textContent = `${correct}/${total}`;
  }

  if (modal) {
    modal.classList.add("active");
  }

  if (closeModalBtn) {
    closeModalBtn.onclick = () => {
      if (modal) {
        modal.classList.remove("active");
      }
    };
  }
};
