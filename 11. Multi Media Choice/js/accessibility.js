// Accessibility and Keyboard Navigation
class AccessibilityManager {
    constructor() {
        this.announcementEl = null;
        this.init();
    }
    
    init() {
        this.setupAccessibility();
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
    }
    
    // Setup accessibility features
    setupAccessibility() {
        // Add screen reader announcements
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(announcement);
        this.announcementEl = announcement;
        
        // Add keyboard navigation hints
        const instructions = document.createElement('div');
        instructions.className = 'keyboard-instructions';
        instructions.innerHTML = `
            <h2>Hướng dẫn điều khiển:</h2>
            <ul>
                <li>Sử dụng phím Tab để di chuyển giữa các tùy chọn</li>
                <li>Nhấn Enter hoặc Space để chọn</li>
                <li>Sử dụng phím mũi tên để điều hướng</li>
                <li>Nhấn Escape để đóng menu cài đặt</li>
            </ul>
        `;
        instructions.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(instructions);
        
        // Add skip links
        this.addSkipLinks();
        
        // Add ARIA labels and descriptions
        this.addAriaLabels();
    }
    
    // Add skip links for better navigation
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#h5p-question" class="skip-link">Chuyển đến nội dung chính</a>
            <a href="#h5p-options" class="skip-link">Chuyển đến các tùy chọn</a>
            <a href="#h5p-buttons" class="skip-link">Chuyển đến các nút điều khiển</a>
        `;
        skipLinks.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 100;
            border-radius: 4px;
        `;
        
        // Style skip links
        const style = document.createElement('style');
        style.textContent = `
            .skip-links {
                position: absolute;
                top: -40px;
                left: 6px;
                z-index: 1000;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                z-index: 100;
                border-radius: 4px;
                font-size: 14px;
                white-space: nowrap;
            }
            
            .skip-link:focus {
                top: 6px;
            }
        `;
        document.head.appendChild(style);
        document.body.insertBefore(skipLinks, document.body.firstChild);
    }
    
    // Add ARIA labels and descriptions
    addAriaLabels() {
        // Add main landmark
        const container = document.querySelector('.h5p-container');
        if (container) {
            container.setAttribute('role', 'main');
            container.setAttribute('aria-label', 'Bài tập tương tác Multimedia Choice');
        }
        
        // Add region for question
        const question = document.querySelector('.h5p-question');
        if (question) {
            question.setAttribute('id', 'h5p-question');
            question.setAttribute('role', 'region');
            question.setAttribute('aria-label', 'Câu hỏi');
        }
        
        // Add group for options
        const optionsList = document.querySelector('.h5p-multi-media-choice-option-list');
        if (optionsList) {
            optionsList.setAttribute('id', 'h5p-options');
            optionsList.setAttribute('role', 'radiogroup');
            optionsList.setAttribute('aria-label', 'Các tùy chọn trả lời');
        }
        
        // Add group for buttons
        const buttons = document.querySelector('.h5p-question-buttons');
        if (buttons) {
            buttons.setAttribute('id', 'h5p-buttons');
            buttons.setAttribute('role', 'group');
            buttons.setAttribute('aria-label', 'Các nút điều khiển');
        }
        
        // Add description for settings
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.setAttribute('aria-label', 'Mở menu cài đặt');
            settingsBtn.setAttribute('aria-describedby', 'settings-description');
            
            const settingsDesc = document.createElement('span');
            settingsDesc.id = 'settings-description';
            settingsDesc.textContent = 'Cài đặt kích thước chữ, kích thước nội dung và chủ đề';
            settingsDesc.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(settingsDesc);
        }
    }
    
    // Setup keyboard navigation
    setupKeyboardNavigation() {
        // Add keyboard navigation between options
        document.addEventListener('keydown', (e) => {
            const options = document.querySelectorAll('.h5p-multi-media-choice-option');
            const currentFocus = document.activeElement;
            const currentIndex = Array.from(options).indexOf(currentFocus);
            
            let nextIndex = -1;
            
            switch(e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    nextIndex = (currentIndex + 1) % options.length;
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    nextIndex = (currentIndex - 1 + options.length) % options.length;
                    break;
                case 'Home':
                    e.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    nextIndex = options.length - 1;
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeSettingsMenu();
                    break;
            }
            
            if (nextIndex >= 0 && nextIndex < options.length) {
                options[nextIndex].focus();
            }
        });
        
        // Add focus management for modal-like behaviors
        this.setupFocusTrap();
    }
    
    // Setup focus trap for settings menu
    setupFocusTrap() {
        const settingsMenu = document.getElementById('settingsMenu');
        const settingsBtn = document.getElementById('settingsBtn');
        
        if (settingsMenu && settingsBtn) {
            const focusableElements = settingsMenu.querySelectorAll(
                'input, select, button, [tabindex]:not([tabindex="-1"])'
            );
            
            settingsMenu.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    const firstFocusable = focusableElements[0];
                    const lastFocusable = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstFocusable) {
                            e.preventDefault();
                            lastFocusable.focus();
                        }
                    } else {
                        // Tab
                        if (document.activeElement === lastFocusable) {
                            e.preventDefault();
                            firstFocusable.focus();
                        }
                    }
                }
            });
            
            // Focus first element when menu opens
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (settingsMenu.classList.contains('active')) {
                            setTimeout(() => {
                                focusableElements[0]?.focus();
                            }, 100);
                        }
                    }
                });
            });
            
            observer.observe(settingsMenu, { attributes: true });
        }
    }
    
    // Setup focus management
    setupFocusManagement() {
        // Add focus indicators
        const style = document.createElement('style');
        style.textContent = `
            .h5p-multi-media-choice-option:focus-visible {
                outline: 3px solid #667eea;
                outline-offset: 4px;
            }
            
            .h5p-joubelui-button:focus-visible {
                outline: 3px solid #667eea;
                outline-offset: 2px;
            }
            
            .control-panel-btn:focus-visible {
                outline: 3px solid #667eea;
                outline-offset: 2px;
            }
            
            .setting-item input:focus-visible,
            .setting-item select:focus-visible {
                outline: 3px solid #667eea;
                outline-offset: 2px;
            }
            
            .skip-link:focus {
                position: absolute;
                top: 6px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                z-index: 1000;
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
        
        // Manage focus when question is answered
        this.setupAnswerFocusManagement();
    }
    
    // Setup focus management for answer interactions
    setupAnswerFocusManagement() {
        // Focus management for button visibility
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    
                    // Focus first visible button when buttons become visible
                    if (target.classList.contains('h5p-question-buttons') && 
                        target.classList.contains('h5p-question-visible')) {
                        
                        const visibleButtons = target.querySelectorAll('button:not([style*="display: none"])');
                        if (visibleButtons.length > 0) {
                            setTimeout(() => {
                                visibleButtons[0].focus();
                            }, 100);
                        }
                    }
                }
            });
        });
        
        const buttonContainer = document.querySelector('.h5p-question-buttons');
        if (buttonContainer) {
            observer.observe(buttonContainer, { attributes: true });
        }
    }
    
    // Close settings menu
    closeSettingsMenu() {
        const settingsMenu = document.getElementById('settingsMenu');
        const settingsBtn = document.getElementById('settingsBtn');
        
        if (settingsMenu && settingsMenu.classList.contains('active')) {
            settingsMenu.classList.remove('active');
            settingsBtn.focus();
        }
    }
    
    // Announce to screen readers
    announce(message) {
        if (this.announcementEl) {
            this.announcementEl.textContent = message;
        }
    }
    
    // Add live region for dynamic content
    addLiveRegion(element, level = 'polite') {
        element.setAttribute('aria-live', level);
        element.setAttribute('aria-atomic', 'true');
    }
    
    // Update progress for screen readers
    updateProgressForScreenReaders(progress) {
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.setAttribute('aria-live', 'polite');
            progressText.setAttribute('aria-atomic', 'true');
        }
    }
    
    // Handle high contrast mode
    handleHighContrastMode() {
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        
        const handleContrastChange = (e) => {
            if (e.matches) {
                document.body.classList.add('high-contrast-mode');
                this.announce('Chế độ tương phản cao đã được kích hoạt');
            } else {
                document.body.classList.remove('high-contrast-mode');
            }
        };
        
        mediaQuery.addListener(handleContrastChange);
        handleContrastChange(mediaQuery);
    }
    
    // Handle reduced motion preference
    handleReducedMotionPreference() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const handleMotionChange = (e) => {
            if (e.matches) {
                document.body.classList.add('reduced-motion');
                this.announce('Chế độ giảm chuyển động đã được kích hoạt');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        };
        
        mediaQuery.addListener(handleMotionChange);
        handleMotionChange(mediaQuery);
    }
}

// Global accessibility functions
window.announce = function(message) {
    if (window.accessibilityManager) {
        window.accessibilityManager.announce(message);
    }
};

// Initialize accessibility when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
    
    // Handle system preferences
    window.accessibilityManager.handleHighContrastMode();
    window.accessibilityManager.handleReducedMotionPreference();
}); 