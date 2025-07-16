import { updateFontSize, updateImageSize } from './utils.js';
import { QuizGame } from './game-logic.js';
import { setupImageZoom } from './image-zoom.js';

document.addEventListener('DOMContentLoaded', function() {
  // Khởi tạo game
  const game = new QuizGame();
  game.initQuiz();
  
  // Setup image zoom functionality
  setupImageZoom();
  
  // Cài đặt các controls
  const fontSizeRange = document.getElementById('fontSizeRange');
  const fontSizeValue = document.getElementById('fontSizeValue');
  const imgSizeRange = document.getElementById('imgSizeRange');
  const imgSizeValue = document.getElementById('imgSizeValue');
  
  // Cập nhật giá trị ban đầu
  fontSizeValue.textContent = `${fontSizeRange.value}px`;
  imgSizeValue.textContent = `${imgSizeRange.value}px`;
  
  // Thiết lập event listeners cho controls
  fontSizeRange.addEventListener('input', () => {
    const size = fontSizeRange.value;
    fontSizeValue.textContent = `${size}px`;
    updateFontSize(size);
  });
  
  imgSizeRange.addEventListener('input', () => {
    const size = imgSizeRange.value;
    imgSizeValue.textContent = `${size}px`;
    updateImageSize(size);
  });
});