// image-zoom.js
export function setupImageZoom() {
  // Create the modal container
  const modal = document.createElement('div');
  modal.className = 'image-zoom-modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  modal.style.zIndex = '10000';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.opacity = '0';
  modal.style.transition = 'opacity 0.3s ease';
  
  // Create the close button
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '20px';
  closeBtn.style.right = '30px';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '35px';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.cursor = 'pointer';
  
  // Create the zoomed image
  const zoomedImg = document.createElement('img');
  zoomedImg.style.maxWidth = '60%';
  zoomedImg.style.maxHeight = '60%';
  zoomedImg.style.objectFit = 'contain';
  
  modal.appendChild(zoomedImg);
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
  
  // Track touch events for double tap detection
  let lastTouchTime = 0;
  let touchCount = 0;
  
  // Function to open modal with image
  function openModal(imgSrc) {
    zoomedImg.src = imgSrc;
    modal.style.display = 'flex';
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
    document.body.style.overflow = 'hidden';
  }
  
  // Function to close modal
  function closeModal() {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }
  
  // Close modal when clicking the X or outside the image
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close modal with ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
  
  // Add event listeners to all question images
  function setupImageListeners() {
    const questionImages = document.querySelectorAll('.question-image');
    
    questionImages.forEach(img => {
      // Reset any existing listeners
      img.removeEventListener('dblclick', handleDoubleClick);
      img.removeEventListener('touchstart', handleTouch);
      
      // Desktop double click
      img.addEventListener('dblclick', handleDoubleClick);
      
      // Mobile double tap
      img.addEventListener('touchstart', handleTouch);
    });
  }
  
  function handleDoubleClick(e) {
    openModal(e.target.src);
  }
  
  function handleTouch(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTouchTime;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      e.preventDefault();
      openModal(e.target.src);
    } else {
      touchCount = 0;
    }
    
    lastTouchTime = currentTime;
  }
  
  // Initialize listeners when DOM is loaded
  if (document.readyState === 'complete') {
    setupImageListeners();
  } else {
    document.addEventListener('DOMContentLoaded', setupImageListeners);
  }
  
  // Also setup listeners when new questions are loaded dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      setupImageListeners();
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Add CSS styles for the modal
const style = document.createElement('style');
style.textContent = `
  .image-zoom-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 19;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .image-zoom-modal img {
    max-width: 60%;
    max-height: 60%;
    object-fit: contain;
    border-radius: 20px;
  }
  
  .image-zoom-modal span {
    position: absolute;
    top: 20px;
    right: 30px;
    color: white;
    font-size: 35px;
    font-weight: bold;
    cursor: pointer;
  }
  
  @media (max-width: 768px) {
    .image-zoom-modal img {
      max-width: 95%;
      max-height: 95%;
    }
    
    .image-zoom-modal span {
      font-size: 30px;
      top: 15px;
      right: 20px;
    }
  }
`;
document.head.appendChild(style);