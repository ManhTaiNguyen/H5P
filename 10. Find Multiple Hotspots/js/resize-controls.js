// resize-controls.js
document.addEventListener('DOMContentLoaded', function () {
  const DEFAULT_FONT_SIZE = 20;
  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 32;

  // Tạo thanh điều chỉnh
  const resizePanel = document.createElement('div');
  resizePanel.className = 'resize-panel resize-centered';
  resizePanel.innerHTML = `
    <label for="fontSizeSlider" class="resize-label">Cỡ chữ:</label>
    <input type="range" id="fontSizeSlider" 
           min="${MIN_FONT_SIZE}" max="${MAX_FONT_SIZE}" 
           value="${DEFAULT_FONT_SIZE}" step="1"
           aria-label="Font size slider">
    <span id="fontSizeValue">${DEFAULT_FONT_SIZE}px</span>
  `;

  // Chèn vào ngay sau phần header
  const header = document.querySelector('.h5p-question-introduction');
  if (header && header.parentNode) {
    header.parentNode.insertBefore(resizePanel, header.nextSibling);
  }

  // Xử lý thay đổi cỡ chữ
  const fontSizeSlider = resizePanel.querySelector('#fontSizeSlider');
  const fontSizeValue = resizePanel.querySelector('#fontSizeValue');

  function applyFontSize(size) {
    document.documentElement.style.transition = 'font-size 0.3s ease';
    document.documentElement.style.fontSize = `${size}px`;
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 300);
  }

  fontSizeSlider.addEventListener('input', function () {
    const size = this.value;
    fontSizeValue.textContent = `${size}px`;
    applyFontSize(size);
  });

  fontSizeSlider.addEventListener('dblclick', function () {
    this.value = DEFAULT_FONT_SIZE;
    fontSizeValue.textContent = `${DEFAULT_FONT_SIZE}px`;
    applyFontSize(DEFAULT_FONT_SIZE);
  });

  // Áp dụng mặc định
  fontSizeSlider.value = DEFAULT_FONT_SIZE;
  fontSizeValue.textContent = `${DEFAULT_FONT_SIZE}px`;
  applyFontSize(DEFAULT_FONT_SIZE);

  // CSS nội tuyến
  const style = document.createElement('style');
  style.textContent = `
    .resize-centered {
      margin: 0 auto;
      margin-top: -10px;
      padding: 16px 24px;
      background: #ffffff;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 0 0 16px 16px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      max-width: 100%;
    }

    .resize-label {
      font-weight: bold;
      font-size: 1rem;
      color: #444;
    }

    #fontSizeSlider {
      width: 180px;
      height: 8px;
      -webkit-appearance: none;
      background: linear-gradient(to right, #6e8efb, #a777e3);
      border-radius: 4px;
      outline: none;
      transition: box-shadow 0.2s ease;
      cursor: pointer;
    }

    #fontSizeSlider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: #6e8efb;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    #fontSizeSlider::-webkit-slider-thumb:hover {
      background: #a777e3;
    }

    #fontSizeValue {
      font-weight: bold;
      font-size: 16px;
      color: #333;
      min-width: 50px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .resize-centered {
        flex-direction: column;
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
        border-radius: 0 0 12px 12px;
      }

      #fontSizeSlider {
        width: 140px;
      }
    }
  `;
  document.head.appendChild(style);
});
