// Utility functions for Image Pair game

const Utils = {
  // Load JSON data from a file
  async loadJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error loading JSON:", error);
      throw error;
    }
  },

  // Shuffle array using Fisher-Yates algorithm
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Create HTML element with classes and attributes
  createElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);

    if (classes.length > 0) {
      element.classList.add(...classes);
    }

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Get element position relative to viewport
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
    };
  },

  // Check if device is touch-enabled
  isTouchDevice() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0 ||
      (window.DocumentTouch && document instanceof window.DocumentTouch)
    );
  },

  // Check if device is mobile
  isMobileDevice() {
    return (
      this.isTouchDevice() &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  },

  // Show notification message
  showNotification(message, type = "info", duration = 3000) {
    const notification = this.createElement("div", [
      "notification",
      `notification-${type}`,
    ]);
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

    // Set background color based on type
    const colors = {
      info: "#3498db",
      success: "#27ae60",
      warning: "#f39c12",
      error: "#e74c3c",
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    });

    // Auto remove
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  },

  // Format score text
  formatScore(score, total, template) {
    return template.replace("@score", score).replace("@total", total);
  },

  // Check if two elements overlap
  elementsOverlap(elem1, elem2) {
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();

    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  },

  // Get closest drop zone to a position
  getClosestDropZone(x, y, dropZones) {
    let closest = null;
    let minDistance = Infinity;

    dropZones.forEach((zone) => {
      const rect = zone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = zone;
      }
    });

    return { zone: closest, distance: minDistance };
  },

  // Animate element
  animate(element, keyframes, options = {}) {
    const defaultOptions = {
      duration: 300,
      easing: "ease",
      fill: "both",
    };

    return element.animate(keyframes, { ...defaultOptions, ...options });
  },

  // Local storage helpers
  storage: {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn("Could not save to localStorage:", error);
        return false;
      }
    },

    get(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.warn("Could not read from localStorage:", error);
        return defaultValue;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn("Could not remove from localStorage:", error);
        return false;
      }
    },
  },
};

// User interaction tracking for haptic feedback
(() => {
  // Initialize user interaction flag
  window.userHasInteracted = false;

  // Track first user interaction
  const trackFirstInteraction = () => {
    window.userHasInteracted = true;

    // Remove listeners after first interaction
    document.removeEventListener("click", trackFirstInteraction, true);
    document.removeEventListener("touchstart", trackFirstInteraction, true);
    document.removeEventListener("keydown", trackFirstInteraction, true);

    console.debug("User interaction detected - haptic feedback enabled");
  };

  // Listen for first user interaction
  document.addEventListener("click", trackFirstInteraction, true);
  document.addEventListener("touchstart", trackFirstInteraction, true);
  document.addEventListener("keydown", trackFirstInteraction, true);
})();

// Debug function for mobile touch events (for testing only)
window.debugTouchEvents = function () {
  console.log("=== Touch Event Debug Info ===");
  console.log("Touch support:", "ontouchstart" in window);
  console.log("Max touch points:", navigator.maxTouchPoints);
  console.log("Viewport size:", window.innerWidth + "x" + window.innerHeight);
  console.log("User has interacted:", window.userHasInteracted);
  console.log("Device pixel ratio:", window.devicePixelRatio);
  console.log("User agent:", navigator.userAgent);

  // Check if images have touch events
  const images = document.querySelectorAll(".card-image");
  console.log("Number of card images found:", images.length);

  if (images.length > 0) {
    const firstImage = images[0];
    console.log("First image element:", firstImage);
    console.log(
      "First image computed style pointer-events:",
      getComputedStyle(firstImage).pointerEvents
    );
    console.log(
      "First image touch-action:",
      getComputedStyle(firstImage).touchAction
    );
  }

  console.log("=== End Debug Info ===");
};
