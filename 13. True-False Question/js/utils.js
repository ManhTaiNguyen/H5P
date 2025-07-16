/**
 * Hiển thị thông báo
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (info, success, error)
 */
export function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Show animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Cập nhật kích thước font chữ
 * @param {number} size - Kích thước font (px)
 */
export function updateFontSize(size) {
  document.documentElement.style.setProperty("--font-size", `${size}px`);
}

/**
 * Cập nhật kích thước hình ảnh
 * @param {number} size - Kích thước hình ảnh (px)
 */
export function updateImageSize(size) {
  document.documentElement.style.setProperty("--img-size", `${size}px`);
}
