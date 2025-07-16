// Application Initialization
class App {
    constructor() {
        this.multimediaChoice = null;
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.initializeApp.bind(this));
        } else {
            this.initializeApp();
        }
    }
    
    initializeApp() {
        // Add loading animation
        this.addLoadingAnimation();
        
        // Initialize components in order
        this.initializeComponents();
        
        // Setup global event listeners
        this.setupGlobalEventListeners();
        
        // Add performance monitoring
        this.setupPerformanceMonitoring();
    }
    
    addLoadingAnimation() {
        const container = document.querySelector('.h5p-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                container.style.transition = 'all 0.8s ease-out';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 100);
        }
    }
    
    initializeComponents() {
        // Initialize the main application
        this.multimediaChoice = new MultimediaChoice();
        
        // Add hover sound effects to interactive elements
        this.addHoverSoundEffects();
        
        // Add click sound effects
        this.addClickSoundEffects();
        
        // Setup responsive design handlers
        this.setupResponsiveHandlers();
    }
    
    addHoverSoundEffects() {
        // Add hover sound to options
        const options = document.querySelectorAll('.h5p-multi-media-choice-option');
        options.forEach(option => {
            option.addEventListener('mouseenter', () => {
                if (!this.multimediaChoice.isAnswered && window.playHoverSound) {
                    window.playHoverSound();
                }
            });
        });
        
        // Add hover sound to buttons
        const buttons = document.querySelectorAll('.h5p-joubelui-button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (window.playHoverSound) {
                    window.playHoverSound();
                }
            });
        });
    }
    
    addClickSoundEffects() {
        // Add click sound to interactive elements
        const clickElements = document.querySelectorAll(
            '.h5p-joubelui-button, .control-panel-btn, .reset-btn'
        );
        
        clickElements.forEach(element => {
            element.addEventListener('click', () => {
                if (window.playClickSound) {
                    window.playClickSound();
                }
            });
        });
    }
    
    setupGlobalEventListeners() {
        // Window resize handler for responsive design
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Visibility change handler
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Before unload handler
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Error handler
        window.addEventListener('error', this.handleError.bind(this));
    }
    
    handleResize() {
        const container = document.querySelector('.h5p-container');
        if (container && window.innerWidth < 768) {
            container.style.margin = '10px';
        } else if (container) {
            container.style.margin = '0 auto';
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause any running audio when page becomes hidden
            const audio = document.getElementById('questionAudio');
            if (audio && !audio.paused) {
                audio.pause();
            }
        }
    }
    
    handleBeforeUnload(e) {
        // Save current state if needed
        if (this.multimediaChoice && this.multimediaChoice.selectedOption !== null) {
            // Could save progress here if needed
        }
    }
    
    handleError(e) {
        console.error('Application error:', e.error);
        if (window.showNotification) {
            window.showNotification('Đã xảy ra lỗi. Vui lòng thử lại.', 'error');
        }
    }
    
    setupResponsiveHandlers() {
        // Handle responsive grid adjustments
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleResponsiveChange = (e) => {
            const optionsList = document.querySelector('.h5p-multi-media-choice-option-list');
            if (optionsList) {
                if (e.matches) {
                    optionsList.style.gridTemplateColumns = '1fr';
                } else {
                    optionsList.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
                }
            }
        };
        
        mediaQuery.addListener(handleResponsiveChange);
        handleResponsiveChange(mediaQuery);
    }
    
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = performance.now();
                console.log(`H5P Multimedia Choice loaded in ${Math.round(loadTime)}ms`);
                
                // Report performance metrics
                setTimeout(() => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                        console.log('Performance metrics:', {
                            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                            loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                            totalTime: Math.round(navigation.loadEventEnd - navigation.navigationStart)
                        });
                    }
                }, 1000);
            });
        }
    }
    
    // Public methods for external interaction
    getMultimediaChoice() {
        return this.multimediaChoice;
    }
    
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        }
    }
    
    resetApplication() {
        if (this.multimediaChoice) {
            this.multimediaChoice.retry();
        }
    }
}

// Enhanced DOM ready function
function domReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(fn, 1);
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

// Initialize the application
domReady(() => {
    window.app = new App();
    
    // Add CSS animation for slideInRight and slideOutRight
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Global utility functions
    window.utils = {
        // Debounce function
        debounce: function(func, wait) {
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
        
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Format time
        formatTime: function(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },
        
        // Get device type
        getDeviceType: function() {
            const width = window.innerWidth;
            if (width <= 480) return 'mobile';
            if (width <= 768) return 'tablet';
            return 'desktop';
        },
        
        // Check if element is in viewport
        isInViewport: function(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        }
    };
    
    // Add global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R to reset (but allow default browser refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
            e.preventDefault();
            window.app.resetApplication();
        }
        
        // Ctrl/Cmd + K to open settings
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) {
                settingsBtn.click();
            }
        }
    });
    
    // Add meta viewport for mobile devices
    if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
    }
    
    // Log app initialization
    console.log('H5P Multimedia Choice App initialized successfully');
    console.log('Device type:', window.utils.getDeviceType());
    console.log('Available features:', {
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        localStorage: typeof Storage !== 'undefined',
        touchEvents: 'ontouchstart' in window
    });
}); 