document.addEventListener("DOMContentLoaded", () => {
  let lastTouchTime = 0;

  // Double-click trên desktop
  document.body.addEventListener("dblclick", handleZoom);

  // Double-tap trên thiết bị cảm ứng
  document.body.addEventListener("touchstart", (e) => {
    const currentTime = new Date().getTime();
    if (currentTime - lastTouchTime < 300) {
      handleZoom(e);
      e.preventDefault();
    }
    lastTouchTime = currentTime;
  });

  function handleZoom(event) {
    let img = event.target;

    if (img.tagName !== "IMG") {
      img = img.querySelector("img");
    }

    if (
      img &&
      img.tagName === "IMG" &&
      (img.closest(".h5p-image-wrapper") ||
        img.closest(".h5p-multi-media-choice-option"))
    ) {
      showZoomOverlay(img.src, img.alt || "Hình ảnh phóng to");
    }
  }

  function showZoomOverlay(src, altText) {
    const overlay = document.createElement("div");
    overlay.className = "zoom-overlay show";
    overlay.innerHTML = `
      <div class="zoom-popup">
        <button class="zoom-close-btn" aria-label="Đóng">×</button>
        <img src="${src}" alt="${altText}" style="max-width: 100%; max-height: 80vh; border-radius: 10px;" />
      </div>
    `;

    document.body.appendChild(overlay);

    // Nút đóng
    overlay.querySelector(".zoom-close-btn").addEventListener("click", () => {
      overlay.classList.remove("show");
      setTimeout(() => document.body.removeChild(overlay), 300);
    });

    // Click bên ngoài để đóng
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.querySelector(".zoom-close-btn").click();
      }
    });
  }
});
