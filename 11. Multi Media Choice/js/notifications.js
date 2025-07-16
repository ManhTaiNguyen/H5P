// Notifications and Sound Effects
class NotificationManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.addNotificationStyles();
        this.setupSoundEffects();
    }
    
    // Add notification styles
    addNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(45deg, #28a745, #20c997);
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                font-weight: 600;
                z-index: 2000;
                box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
                animation: slideDown 0.3s ease-out;
                max-width: 400px;
                text-align: center;
            }
            
            .notification.error {
                background: linear-gradient(45deg, #dc3545, #c82333);
                box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
            }
            
            .notification.warning {
                background: linear-gradient(45deg, #ffc107, #e0a800);
                box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
                color: #212529;
            }
            
            .notification.info {
                background: linear-gradient(45deg, #17a2b8, #138496);
                box-shadow: 0 8px 25px rgba(23, 162, 184, 0.3);
            }
            
            .notification.slideOut {
                animation: slideUp 0.3s ease-out forwards;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
            
            @media (max-width: 768px) {
                .notification {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                    transform: none;
                }
                
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Setup sound effects
    setupSoundEffects() {
        this.audioContext = null;
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
        document.addEventListener('keydown', this.initAudioContext.bind(this), { once: true });
    }
    
    // Initialize audio context
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    // Show notification
    showNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-hide notification
        setTimeout(() => {
            notification.classList.add('slideOut');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Play sound based on type
        switch(type) {
            case 'success':
                this.playSuccessSound();
                break;
            case 'error':
                this.playErrorSound();
                break;
            case 'warning':
                this.playWarningSound();
                break;
            case 'info':
                this.playInfoSound();
                break;
        }
        
        // Return notification element for further customization
        return notification;
    }
    
    // Play hover sound effect
    playHoverSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Error playing hover sound:', e);
        }
    }
    
    // Play success sound
    playSuccessSound() {
        if (!this.audioContext) return;
        
        try {
            // Play a happy melody
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            let time = this.audioContext.currentTime;
            
            notes.forEach((freq, index) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.2, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
                
                osc.start(time);
                osc.stop(time + 0.3);
                
                time += 0.2;
            });
        } catch (e) {
            console.log('Error playing success sound:', e);
        }
    }
    
    // Play error sound
    playErrorSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Error playing error sound:', e);
        }
    }
    
    // Play warning sound
    playWarningSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 440;
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Error playing warning sound:', e);
        }
    }
    
    // Play info sound
    playInfoSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 660;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (e) {
            console.log('Error playing info sound:', e);
        }
    }
    
    // Play click sound
    playClickSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        } catch (e) {
            console.log('Error playing click sound:', e);
        }
    }
    
    // Show toast notification
    showToast(message, type = 'info', duration = 2000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 15px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1900;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        return toast;
    }
    
    // Get toast color based on type
    getToastColor(type) {
        switch(type) {
            case 'success':
                return 'linear-gradient(45deg, #28a745, #20c997)';
            case 'error':
                return 'linear-gradient(45deg, #dc3545, #c82333)';
            case 'warning':
                return 'linear-gradient(45deg, #ffc107, #e0a800)';
            case 'info':
            default:
                return 'linear-gradient(45deg, #17a2b8, #138496)';
        }
    }
    
    // Show loading notification
    showLoading(message = 'Đang tải...') {
        const loading = document.createElement('div');
        loading.className = 'loading-notification';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${message}</span>
        `;
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 30px;
            border-radius: 20px;
            font-weight: 600;
            z-index: 2100;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            backdrop-filter: blur(10px);
        `;
        
        // Add spinner styles
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #e9ecef;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinnerStyle);
        
        document.body.appendChild(loading);
        
        return {
            element: loading,
            hide: () => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }
        };
    }
}

// Global notification functions
window.showNotification = function(message, type = 'success', duration = 3000) {
    if (window.notificationManager) {
        return window.notificationManager.showNotification(message, type, duration);
    }
};

window.showToast = function(message, type = 'info', duration = 2000) {
    if (window.notificationManager) {
        return window.notificationManager.showToast(message, type, duration);
    }
};

window.showLoading = function(message = 'Đang tải...') {
    if (window.notificationManager) {
        return window.notificationManager.showLoading(message);
    }
};

// Global sound functions
window.playHoverSound = function() {
    if (window.notificationManager) {
        window.notificationManager.playHoverSound();
    }
};

window.playSuccessSound = function() {
    if (window.notificationManager) {
        window.notificationManager.playSuccessSound();
    }
};

window.playErrorSound = function() {
    if (window.notificationManager) {
        window.notificationManager.playErrorSound();
    }
};

window.playClickSound = function() {
    if (window.notificationManager) {
        window.notificationManager.playClickSound();
    }
};

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
}); 