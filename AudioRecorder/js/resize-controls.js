document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const DEFAULT_FONT_SIZE = 20;
    const MIN_FONT_SIZE = 12;
    const MAX_FONT_SIZE = 32;
    
    // Create UI elements
    const resizeControls = document.createElement('div');
    resizeControls.className = 'resize-controls-container';
    resizeControls.innerHTML = `
        <button class="resize-toggle-btn" aria-label="Adjust text size">
            <i class="fas fa-text-height"></i>
        </button>
        <div class="resize-panel">Cỡ chữ:
            <input type="range" id="fontSizeSlider" 
                   min="${MIN_FONT_SIZE}" max="${MAX_FONT_SIZE}" 
                   value="${DEFAULT_FONT_SIZE}" step="1"
                   aria-label="Font size slider">
            <span id="fontSizeValue">${DEFAULT_FONT_SIZE}px</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(resizeControls);
    
    // Get elements
    const toggleBtn = document.querySelector('.resize-toggle-btn');
    const resizePanel = document.querySelector('.resize-panel');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const fontSizeValue = document.getElementById('fontSizeValue');
    
    // Toggle panel
    let panelVisible = false;
    toggleBtn.addEventListener('click', function() {
        panelVisible = !panelVisible;
        resizePanel.classList.toggle('visible', panelVisible);
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (panelVisible && !resizeControls.contains(e.target)) {
            panelVisible = false;
            resizePanel.classList.remove('visible');
        }
    });

    // Apply font size with smooth transition
    function applyFontSize(size) {
        document.documentElement.style.transition = 'font-size 0.3s ease';
        document.documentElement.style.fontSize = `${size}px`;
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 300);
    }

    // Handle slider changes
    fontSizeSlider.addEventListener('input', function() {
        const size = this.value;
        fontSizeValue.textContent = `${size}px`;
        applyFontSize(size);
    });

    // Reset to default on double-click
    fontSizeSlider.addEventListener('dblclick', function() {
        this.value = DEFAULT_FONT_SIZE;
        fontSizeValue.textContent = `${DEFAULT_FONT_SIZE}px`;
        applyFontSize(DEFAULT_FONT_SIZE);
    });

    // Always apply default font size on page load
    fontSizeSlider.value = DEFAULT_FONT_SIZE;
    fontSizeValue.textContent = `${DEFAULT_FONT_SIZE}px`;
    applyFontSize(DEFAULT_FONT_SIZE);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .resize-controls-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }

        .resize-toggle-btn {
            background: linear-gradient(135deg, #6e8efb, #a777e3);
            background-size: 200% 200%;
            animation: gradientShift 4s ease infinite;
            color: white;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .resize-toggle-btn:hover, .resize-toggle-btn:focus {
            transform: scale(1.1) rotate(15deg);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            outline: none;
        }

        .resize-toggle-btn:active {
            transform: scale(0.95) rotate(15deg);
        }

        .resize-panel {
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 15px;
            backdrop-filter: blur(5px);
            opacity: 0;
            pointer-events: none;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .resize-panel.visible {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        #fontSizeSlider {
            width: 180px;
            height: 8px;
            -webkit-appearance: none;
            background: linear-gradient(to right, #6e8efb, #a777e3);
            border-radius: 4px;
            outline: none;
            transition: box-shadow 0.2s ease;
        }

        #fontSizeSlider:hover {
            box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.3);
        }

        #fontSizeSlider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            background: #6e8efb;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        #fontSizeSlider::-webkit-slider-thumb:hover {
            background: #a777e3;
            transform: scale(1.1);
        }

        #fontSizeValue {
            font-weight: bold;
            min-width: 45px;
            text-align: center;
            color: #333;
            font-size: 16px;
            transition: color 0.3s ease;
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @media (max-width: 600px) {
            .resize-controls-container {
                bottom: 20px;
                right: 20px;
            }

            .resize-panel {
                padding: 12px 15px;
            }

            #fontSizeSlider {
                width: 140px;
            }
        }
    `;
    document.head.appendChild(style);
});
