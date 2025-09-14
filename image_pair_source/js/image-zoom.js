// Image Zoom functionality for Image Pair game

class ImageZoomManager {
  constructor() {
    this.overlay = null;
    this.dialog = null;
    this.closeBtn = null;
    this.image = null;
    this.title = null;
    this.isOrientationChanging = false;

    this.init();
  }

  init() {
    // Get DOM elements
    this.overlay = document.getElementById("image-zoom-overlay");
    this.dialog = this.overlay?.querySelector(".image-zoom-dialog");
    this.closeBtn = document.getElementById("image-zoom-close");
    this.image = document.getElementById("image-zoom-image");
    this.title = document.getElementById("image-zoom-title");

    if (!this.overlay) {
      console.warn("Image zoom overlay not found");
      return;
    }

    this.setupEventListeners();
    this.setupOrientationHandler();
  }

  setupEventListeners() {
    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.hideZoom());
      // Add touch support for close button
      this.closeBtn.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.hideZoom();
      });
    }

    // Click outside dialog to close
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.hideZoom();
      }
    });

    // Touch outside dialog to close (mobile)
    this.overlay.addEventListener("touchend", (e) => {
      if (e.target === this.overlay) {
        e.preventDefault();
        this.hideZoom();
      }
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.overlay.classList.contains("show")) {
        this.hideZoom();
      }
    });

    // Prevent dialog click from closing
    if (this.dialog) {
      this.dialog.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      // Prevent dialog touch from closing
      this.dialog.addEventListener("touchend", (e) => {
        e.stopPropagation();
      });
    }
  }

  showZoom(imageSrc, imageTitle = "Image Preview") {
    if (!this.overlay || !this.image) {
      console.warn("Image zoom elements not available");
      return;
    }

    // Debug logging for mobile
    if (window.innerWidth <= 480) {
      console.log("showZoom called on mobile:", imageSrc);
    }

    // Clear any previous error handlers
    this.image.onerror = null;
    this.image.onload = null;

    // Set image source and title
    this.image.src = imageSrc;
    this.image.alt = imageTitle;

    if (this.title) {
      this.title.textContent = imageTitle;
    }

    // Handle image load error - only set once
    this.image.onerror = () => {
      console.error("Failed to load image:", imageSrc);
      this.hideZoom();
      if (typeof Utils !== "undefined" && Utils.showNotification) {
        Utils.showNotification("Failed to load image", "error", 3000);
      }
    };

    // Handle successful load
    this.image.onload = () => {
      // Debug for mobile
      if (window.innerWidth <= 480) {
        console.log("Image loaded successfully on mobile, showing overlay...");
      }

      // Show overlay with animation only after image loads
      this.overlay.style.display = "flex";

      // Force reflow before adding show class for animation
      this.overlay.offsetHeight;

      this.overlay.classList.add("show");

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // On mobile, ensure the overlay is properly positioned
      if (window.innerWidth <= 480) {
        this.overlay.style.position = "fixed";
        this.overlay.style.top = "0";
        this.overlay.style.left = "0";
        this.overlay.style.width = "100vw";
        this.overlay.style.height = "100vh";
        this.overlay.style.zIndex = "10000";

        console.log("Mobile overlay styles applied");
      }

      // Adjust for current orientation
      setTimeout(() => {
        this.adjustModalForOrientation();
      }, 50);

      // Add meta viewport adjustment for better mobile handling
      this.adjustViewportForModal();
    };
  }

  adjustViewportForModal() {
    // Get or create viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.name = "viewport";
      document.head.appendChild(viewport);
    }

    // Store original viewport content
    if (!this.originalViewport) {
      this.originalViewport = viewport.content;
    }

    // Set viewport for modal display
    viewport.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
  }

  restoreViewport() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && this.originalViewport) {
      viewport.content = this.originalViewport;
    }
  }

  hideZoom() {
    if (!this.overlay) return;

    this.overlay.classList.remove("show");

    // Hide overlay after animation
    setTimeout(() => {
      this.overlay.style.display = "none";
      // Restore body scroll
      document.body.style.overflow = "";

      // Restore viewport
      this.restoreViewport();

      // Clear image source and event handlers
      if (this.image) {
        this.image.src = "";
        this.image.onerror = null;
        this.image.onload = null;
      }
    }, 300);
  }

  // Method to attach double-click listeners to images
  attachToImages(images) {
    images.forEach((img) => {
      this.attachToImage(img);
    });
  }

  attachToImage(imgElement) {
    // Find the parent card element
    const card = imgElement.closest(".image-pair-card, .match-card");

    if (!card) return;

    // Add double-click instruction if not already present
    if (!card.querySelector(".double-click-instruction")) {
      const instruction = document.createElement("div");
      instruction.className = "double-click-instruction";

      // Different text for mobile vs desktop
      if (window.innerWidth <= 480) {
        instruction.textContent = "Double-tap to zoom";
      } else {
        instruction.textContent = "Double-click/tap to zoom";
      }

      card.style.position = "relative";
      card.appendChild(instruction);
    }

    // Touch properties for double-tap detection (based on image_sequencing approach)
    let lastTouchTime = 0;
    let touchCount = 0;
    const doubleTapDelay = 300; // milliseconds - increased for mobile browsers

    // Add double-click listener for desktop
    imgElement.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const imageSrc = imgElement.src;
      const imageTitle = imgElement.alt || "Image Preview";

      this.showZoom(imageSrc, imageTitle);
    });

    // Touch event listeners for mobile double-tap (improved based on image_sequencing)
    imgElement.addEventListener(
      "touchstart",
      (e) => {
        console.log("Touch start detected");
        // Skip if orientation is changing
        if (this.isOrientationChanging) {
          return;
        }

        // Always prevent default to stop browser zoom behavior
        e.preventDefault();

        // Add visual feedback
        imgElement.classList.add("touch-active");

        // Double tap detection logic (improved timing)
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastTouchTime;
        console.log(
          `Touch start: ${currentTime}, last touch: ${lastTouchTime}, timeDiff: ${timeDiff}ms`
        );

        if (timeDiff < doubleTapDelay && timeDiff > 30) {
          // This is a potential double tap (minimum 30ms to avoid accidental)
          touchCount++;
          console.log(`Touch count: ${touchCount}, timeDiff: ${timeDiff}ms`);
          if (touchCount === 2) {
            // Double tap detected - open modal
            e.stopPropagation();

            console.log("Double-tap detected, showing zoom...");

            const imageSrc = imgElement.src;
            const imageTitle = imgElement.alt || "Image Preview";

            this.showZoom(imageSrc, imageTitle);

            // Reset counters
            touchCount = 0;
            lastTouchTime = 0;

            // Remove visual feedback
            imgElement.classList.remove("touch-active");
            return;
          }
        } else {
          // Reset touch count for new gesture
          touchCount = 1;
        }

        lastTouchTime = currentTime;

        // Debug logging for mobile
        if (window.innerWidth <= 480) {
          console.log(
            `Touch ${touchCount}, timeDiff: ${timeDiff}ms, viewport: ${window.innerWidth}x${window.innerHeight}`
          );
        }
      },
      { passive: false }
    );

    // Add touchend listener for cleanup
    imgElement.addEventListener("touchend", (e) => {
      // Remove visual feedback after a short delay
      setTimeout(() => {
        imgElement.classList.remove("touch-active");
      }, 100);
    });

    // Add cursor pointer for better UX
    imgElement.style.cursor = "pointer";

    // Improve touch interaction styles
    imgElement.style.transition = "opacity 0.1s ease";
  }

  // Method to initialize zoom for existing cards
  initializeExistingCards() {
    const existingImages = document.querySelectorAll(
      ".card-image, .match-card img"
    );
    this.attachToImages(existingImages);
  }

  // Debug method to test touch events
  debugTouchEvents() {
    console.log("Touch support:", "ontouchstart" in window);
    console.log("Max touch points:", navigator.maxTouchPoints);
    console.log(
      "Screen orientation:",
      window.screen?.orientation?.type || "unknown"
    );
    console.log("Viewport size:", window.innerWidth + "x" + window.innerHeight);
    console.log("Device pixel ratio:", window.devicePixelRatio);
  }

  // Test method for mobile zoom
  testMobileZoom() {
    console.log("Testing mobile zoom...");
    console.log(
      "Current viewport:",
      window.innerWidth + "x" + window.innerHeight
    );
    console.log("Touch support:", "ontouchstart" in window);

    // Find first image and test zoom
    const firstImage = document.querySelector(".card-image");
    if (firstImage) {
      console.log("Found test image, showing zoom...");
      this.showZoom(firstImage.src, "Test Mobile Zoom");
    } else {
      console.log("No .card-image found for testing");
    }
  }

  setupOrientationHandler() {
    // Handle orientation changes
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener("change", () => {
        this.handleOrientationChange();
      });
    } else {
      // Fallback for older browsers
      window.addEventListener("orientationchange", () => {
        this.handleOrientationChange();
      });
    }

    // Also listen for resize events as a fallback
    window.addEventListener("resize", () => {
      if (this.isOrientationChanging) {
        setTimeout(() => {
          this.isOrientationChanging = false;
          this.adjustModalForOrientation();
        }, 300);
      }
    });
  }

  handleOrientationChange() {
    this.isOrientationChanging = true;

    // If modal is open, adjust its position/size after orientation change
    if (this.overlay && this.overlay.classList.contains("show")) {
      setTimeout(() => {
        this.adjustModalForOrientation();
        this.isOrientationChanging = false;
      }, 100);
    } else {
      setTimeout(() => {
        this.isOrientationChanging = false;
      }, 100);
    }
  }

  adjustModalForOrientation() {
    if (!this.overlay || !this.overlay.classList.contains("show")) return;

    // Force a reflow to ensure proper sizing
    this.overlay.style.display = "none";
    this.overlay.offsetHeight; // Force reflow
    this.overlay.style.display = "flex";

    // Ensure proper positioning
    setTimeout(() => {
      if (this.dialog) {
        this.dialog.scrollTop = 0;
      }
    }, 50);
  }
}

// Global instance
window.imageZoomManager = new ImageZoomManager();
