// Settings and Control Panel Management
class SettingsManager {
    constructor() {
        this.settings = {
            fontSize: 16,
            contentSize: 100,
            theme: 'default'
        };
        
        this.init();
    }
    
    init() {
        this.setupControlPanel();
        this.loadSettings();
    }
    
    // Control Panel Setup
    setupControlPanel() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsMenu = document.getElementById('settingsMenu');
        const fontSizeRange = document.getElementById('fontSizeRange');
        const contentSizeRange = document.getElementById('contentSizeRange');
        const themeSelect = document.getElementById('themeSelect');
        const resetBtn = document.getElementById('resetBtn');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const contentSizeValue = document.getElementById('contentSizeValue');
        
        // Toggle settings menu
        settingsBtn.addEventListener('click', () => {
            settingsMenu.classList.toggle('active');
        });
        
        // Close settings menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsBtn.contains(e.target) && !settingsMenu.contains(e.target)) {
                settingsMenu.classList.remove('active');
            }
        });
        
        // Font size control
        fontSizeRange.addEventListener('input', (e) => {
            const fontSize = parseInt(e.target.value);
            this.settings.fontSize = fontSize;
            fontSizeValue.textContent = fontSize + 'px';
            this.applyFontSize(fontSize);
            this.saveSettings();
        });
        
        // Content size control
        contentSizeRange.addEventListener('input', (e) => {
            const contentSize = parseInt(e.target.value);
            this.settings.contentSize = contentSize;
            contentSizeValue.textContent = contentSize + '%';
            this.applyContentSize(contentSize);
            this.saveSettings();
        });
        
        // Theme selection
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            this.settings.theme = theme;
            this.applyTheme(theme);
            this.saveSettings();
        });
        
        // Reset button
        resetBtn.addEventListener('click', () => {
            this.resetSettings();
        });
    }
    
    // Apply font size
    applyFontSize(fontSize) {
        document.body.style.fontSize = fontSize + 'px';
        
        // Update specific elements
        const elements = document.querySelectorAll('.h5p-question-content, .h5p-joubelui-button, .instruction-text');
        elements.forEach(el => {
            el.style.fontSize = fontSize + 'px';
        });
    }
    
    // Apply content size
    applyContentSize(contentSize) {
        const container = document.querySelector('.h5p-container');
        container.style.transform = `scale(${contentSize / 100})`;
        container.style.transformOrigin = 'top center';
        
        // Adjust margin to prevent overlap
        const marginTop = contentSize < 100 ? '50px' : '0px';
        container.style.marginTop = marginTop;
    }
    
    // Apply theme
    applyTheme(theme) {
        document.body.classList.remove('dark-theme', 'colorful-theme', 'high-contrast-theme');
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'colorful') {
            document.body.classList.add('colorful-theme');
        } else if (theme === 'high-contrast') {
            document.body.classList.add('high-contrast-theme');
        }
    }
    
    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('h5p-multimedia-choice-settings', JSON.stringify(this.settings));
    }
    
    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('h5p-multimedia-choice-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        // Apply loaded settings
        document.getElementById('fontSizeRange').value = this.settings.fontSize;
        document.getElementById('contentSizeRange').value = this.settings.contentSize;
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('fontSizeValue').textContent = this.settings.fontSize + 'px';
        document.getElementById('contentSizeValue').textContent = this.settings.contentSize + '%';
        
        this.applyFontSize(this.settings.fontSize);
        this.applyContentSize(this.settings.contentSize);
        this.applyTheme(this.settings.theme);
    }
    
    // Reset settings to default
    resetSettings() {
        this.settings = {
            fontSize: 16,
            contentSize: 100,
            theme: 'default'
        };
        
        // Update UI
        document.getElementById('fontSizeRange').value = 16;
        document.getElementById('contentSizeRange').value = 100;
        document.getElementById('themeSelect').value = 'default';
        document.getElementById('fontSizeValue').textContent = '16px';
        document.getElementById('contentSizeValue').textContent = '100%';
        
        // Apply settings
        this.applyFontSize(16);
        this.applyContentSize(100);
        this.applyTheme('default');
        
        // Save settings
        this.saveSettings();
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('Đã đặt lại cài đặt về mặc định');
        }
    }
    
    // Get current settings
    getSettings() {
        return { ...this.settings };
    }
    
    // Update specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        
        // Apply the change
        switch(key) {
            case 'fontSize':
                this.applyFontSize(value);
                break;
            case 'contentSize':
                this.applyContentSize(value);
                break;
            case 'theme':
                this.applyTheme(value);
                break;
        }
    }
}

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
}); 