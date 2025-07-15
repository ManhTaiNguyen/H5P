// Image Multiple Hotspot Question Implementation
class ImageMultipleHotspotQuestion {
    constructor() {
        this.score = 0;
        this.maxScore = 0;
        this.selectedHotspots = new Set();
        this.hotspotFeedbacks = [];
        this.currentFeedback = null;
        this.contentData = null;

        this.congratulations = [
            "Tuyệt vời! Bạn đã tìm thấy một mảnh ghép quan trọng!",
            "Chính xác! Kiến thức của bạn thật đáng nể!",
            "Xuất sắc! Bạn đang tiến gần đến mục tiêu!",
            "Hoàn hảo! Không gì có thể làm khó bạn!",
            "Chuẩn không cần chỉnh! Bạn thật sự hiểu vấn đề!",
            "Quá đỉnh! Bạn đang làm rất tốt!",
            "Không thể tin được! Bạn thật tài năng!",
            "Chính xác 100%! Tiếp tục phát huy nhé!",
            "Tuyệt cú mèo! Bạn đang trên đà chiến thắng!",
            "Quá xuất sắc! Bạn xứng đáng được tuyên dương!"
        ];
        
        // Initialize the question
        this.loadContent().then(() => {
            this.init();
        });
    }
    
    async loadContent() {
        try {
            const response = await fetch('content/content.json');
            this.contentData = await response.json();
            
            // Set max score from content data
            const hotspots = this.contentData.imageMultipleHotspotQuestion.hotspotSettings.hotspot;
            const numberHotspots = this.contentData.imageMultipleHotspotQuestion.hotspotSettings.numberHotspots;
            
            if (numberHotspots && numberHotspots <= hotspots.length) {
                this.maxScore = numberHotspots;
            } else {
                this.maxScore = hotspots.filter(h => h.userSettings.correct).length;
            }
            
            // Update HTML with dynamic content
            this.updateHTML();
        } catch (error) {
            console.error('Error loading content:', error);
            // Fallback to default values
            this.maxScore = 5;
        }
    }
    
    updateHTML() {
        if (!this.contentData) return;
        
        const data = this.contentData.imageMultipleHotspotQuestion;
        
        // Update task description
        const introElement = document.querySelector('.h5p-question-introduction p');
        if (introElement && data.hotspotSettings.taskDescription) {
            // Decode Unicode characters properly
            const decodedText = data.hotspotSettings.taskDescription
                .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)))
                .replace(/&quot;/g, '"');
            introElement.textContent = decodedText;
        }
        
        // Update image source
        const imageElement = document.querySelector('.hotspot-image');
        if (imageElement && data.backgroundImageSettings.backgroundImage.path) {
            imageElement.src = `content/${data.backgroundImageSettings.backgroundImage.path}`;
        }
        
        // Update max score display
        const maxScoreElement = document.getElementById('max-score');
        if (maxScoreElement) {
            maxScoreElement.textContent = this.maxScore;
        }
        
        // Clear existing hotspots and create new ones
        this.createHotspotsFromData();
    }
    
    createHotspotsFromData() {
        if (!this.contentData) return;
        
        const imageWrapper = document.querySelector('.image-wrapper');
        const existingHotspots = imageWrapper.querySelectorAll('.image-hotspot');
        existingHotspots.forEach(hotspot => hotspot.remove());
        
        const hotspots = this.contentData.imageMultipleHotspotQuestion.hotspotSettings.hotspot;
        
        hotspots.forEach((hotspotData, index) => {
            const hotspot = document.createElement('div');
            hotspot.className = `image-hotspot ${hotspotData.computedSettings.figure}`;
            hotspot.dataset.correct = hotspotData.userSettings.correct.toString();
            hotspot.dataset.index = index.toString();
            
            hotspot.style.left = hotspotData.computedSettings.x + '%';
            hotspot.style.top = hotspotData.computedSettings.y + '%';
            hotspot.style.width = hotspotData.computedSettings.width + '%';
            hotspot.style.height = hotspotData.computedSettings.height + '%';
            
            imageWrapper.appendChild(hotspot);
        });
    }
    
    init() {
        this.setupEventListeners();
        this.updateScoreDisplay();
        this.resizeHandler();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resizeHandler());
    }
    
    setupEventListeners() {
        const imageWrapper = document.querySelector('.image-wrapper');
        const retryButton = document.getElementById('retry-button');
        
        // Add click listener to image wrapper (will handle both hotspots and incorrect clicks)
        imageWrapper.addEventListener('click', (e) => {
            if (e.target.classList.contains('image-hotspot')) {
                e.stopPropagation();
                const index = parseInt(e.target.dataset.index);
                this.handleHotspotClick(e.target, e, index);
            } else {
                this.handleIncorrectClick(e);
            }
        });
        
        // Add retry button listener
        retryButton.addEventListener('click', () => {
            this.resetTask();
        });
        
        // Add hover effects for dynamically created hotspots
        this.addHoverEffects();
    }
    
    addHoverEffects() {
        const imageWrapper = document.querySelector('.image-wrapper');
        
        imageWrapper.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('image-hotspot') && !e.target.classList.contains('selected')) {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
            }
        }, true);
        
        imageWrapper.addEventListener('mouseleave', (e) => {
            if (e.target.classList.contains('image-hotspot') && !e.target.classList.contains('selected')) {
                e.target.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                e.target.style.border = '2px solid transparent';
            }
        }, true);

        imageWrapper.addEventListener('mouseover', (e) => {
            const parent = document.querySelector('.image-hotspot-question');
            if (e.target.classList.contains('image-hotspot') && e.target.dataset.correct === "true" && !e.target.classList.contains('selected')) {
                parent.classList.add('no-hover');
            }
        });

        imageWrapper.addEventListener('mouseout', (e) => {
            const parent = document.querySelector('.image-hotspot-question');
            parent.classList.remove('no-hover');
        });
    }
    
    addCheckmarkToHotspot(hotspot) {
        // Remove any existing checkmark
        const existingCheckmark = hotspot.querySelector('.checkmark');
        if (existingCheckmark) {
            existingCheckmark.remove();
        }
        
        // Create checkmark element
        const checkmark = document.createElement('div');
        checkmark.className = 'checkmark';
        checkmark.innerHTML = '✓';
        
        // Style the checkmark
        checkmark.style.position = 'absolute';
        checkmark.style.top = '50%';
        checkmark.style.left = '50%';
        checkmark.style.transform = 'translate(-50%, -50%)';
        checkmark.style.color = '#4CAF50';
        checkmark.style.fontSize = '24px';
        checkmark.style.fontWeight = 'bold';
        checkmark.style.textShadow = '0 0 3px rgba(255, 255, 255, 0.8)';
        checkmark.style.zIndex = '10';
        checkmark.style.pointerEvents = 'none';
        checkmark.style.padding = '5px';
        checkmark.style.borderRadius = '50%';
        checkmark.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        checkmark.style.width = '40px';
        checkmark.style.height = '40px';
        checkmark.style.display = 'flex';
        checkmark.style.alignItems = 'center';
        checkmark.style.justifyContent = 'center';
        
        // Add animation
        checkmark.style.opacity = '0';
        checkmark.style.transform = 'translate(-50%, -50%) scale(0.5)';
        
        hotspot.appendChild(checkmark);
        
        // Animate the checkmark appearance
        setTimeout(() => {
            checkmark.style.transition = 'all 0.3s ease-out';
            checkmark.style.opacity = '1';
            checkmark.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);
    }
    
    handleHotspotClick(hotspot, event, index) {
        const isCorrect = hotspot.dataset.correct === 'true';
        const hotspotId = `hotspot-${index}`;
        
        // Remove any existing feedback
        this.removeFeedback();
        
        if (this.score >= this.maxScore) {
            return; // Max score reached
        }
        
        if (this.selectedHotspots.has(hotspotId)) {
            // Already selected
            const alreadySelectedMsg = this.getAlreadySelectedMessage();
            this.createFeedback(event, 'already-selected', alreadySelectedMsg);
        } else if (isCorrect) {
            // Correct selection
            this.selectedHotspots.add(hotspotId);
            hotspot.classList.add('selected', 'correct');
            
            // Add checkmark icon to the hotspot
            this.addCheckmarkToHotspot(hotspot);
            
            this.score++;
            
            const correctMsg = this.getCorrectMessage(index);
            this.createFeedback(event, 'correct', correctMsg);
            this.updateScoreDisplay();
            this.checkCompletion();
        } else {
            // Incorrect selection
            const incorrectMsg = this.getIncorrectMessage(index);
            this.createFeedback(event, 'incorrect', incorrectMsg);
        }
    }
    
    getCorrectMessage(index) {
        if (!this.contentData) {
            const randomCongrat = this.congratulations[Math.floor(Math.random() * this.congratulations.length)];
            return `${randomCongrat} ${this.score} of ${this.maxScore}`;
        }
        
        const hotspotData = this.contentData.imageMultipleHotspotQuestion.hotspotSettings.hotspot[index];
        const hotspotName = this.contentData.imageMultipleHotspotQuestion.hotspotSettings.hotspotName;
        
        let message = '';
        if (hotspotData && hotspotData.userSettings.feedbackText) {
            message = hotspotData.userSettings.feedbackText;
        } else {
            message = this.congratulations[Math.floor(Math.random() * this.congratulations.length)];
        }
        
        if (hotspotName) {
            message += ` ${this.score} of ${this.maxScore} ${hotspotName}.`;
        }
        
        return message || `Correct! ${this.score} of ${this.maxScore}`;
    }
    
    getIncorrectMessage(index) {
        if (!this.contentData) {
            return 'Try again!';
        }
        
        const hotspotData = this.contentData.imageMultipleHotspotQuestion.hotspotSettings.hotspot[index];
        return (hotspotData && hotspotData.userSettings.feedbackText) || 'Try again!';
    }
    
    getAlreadySelectedMessage() {
        if (!this.contentData) {
            return 'Already selected!';
        }
        
        return this.contentData.imageMultipleHotspotQuestion.hotspotSettings.alreadySelectedFeedback || 'Already selected!';
    }
    
    getNoneSelectedMessage() {
        if (!this.contentData) {
            return 'Not a correct item. Try again!';
        }
        
        return this.contentData.imageMultipleHotspotQuestion.hotspotSettings.noneSelectedFeedback || 'Not a correct item. Try again!';
    }
    
    handleIncorrectClick(event) {
        if (this.score >= this.maxScore) {
            return;
        }
        
        this.removeFeedback();
        const noneSelectedMsg = this.getNoneSelectedMessage();
        this.createFeedback(event, 'incorrect', noneSelectedMsg);
    }
    
    createFeedback(event, type, message) {
        const imageWrapper = document.querySelector('.image-wrapper');
        const rect = imageWrapper.getBoundingClientRect();
        
        // Calculate click position relative to image wrapper
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.className = `hotspot-feedback ${type}`;
        
        // Position feedback
        feedback.style.left = (x - 16) + 'px'; // Center the 32px feedback
        feedback.style.top = (y - 16) + 'px';
        
        imageWrapper.appendChild(feedback);
        
        // Store feedback data for resizing
        this.currentFeedback = {
            element: feedback,
            percentageX: (x / imageWrapper.offsetWidth) * 100,
            percentageY: (y / imageWrapper.offsetHeight) * 100
        };
        
        // Add fade-in animation
        setTimeout(() => {
            feedback.classList.add('fade-in');
        }, 10);
        
        // Update feedback text
        this.setFeedback(message);
        
        // Auto-remove all feedback after a delay
        const delay = type === 'correct' ? 3000 : 2000; // Correct feedback stays longer
        setTimeout(() => {
            this.removeFeedback();
        }, delay);
    }
    
    removeFeedback() {
        const existingFeedback = document.querySelector('.hotspot-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        this.currentFeedback = null;
        this.setFeedback('');
    }
    
    setFeedback(message) {
        const feedbackElement = document.getElementById('feedback');
        const feedbackText = document.getElementById('feedback-text');
        
        if (message) {
            feedbackText.textContent = message;
            feedbackElement.classList.add('visible');
        } else {
            feedbackElement.classList.remove('visible');
        }
    }
    
    updateScoreDisplay() {
        const currentScoreElement = document.getElementById('current-score');
        const progressFill = document.getElementById('progress-fill');
        
        currentScoreElement.textContent = this.score;
        
        const percentage = (this.score / this.maxScore) * 100;
        progressFill.style.width = percentage + '%';
    }
    
    checkCompletion() {
        if (this.score >= this.maxScore) {
            setTimeout(() => {
                showSolution();
                // Thêm dòng này để kích hoạt hiệu ứng ăn mừng
                showCompletionNotification(this.score, this.maxScore);

                // Cập nhật điểm thật (vì showSolution hiển thị max điểm)
                const finalScore = document.getElementById('finalScore');
                finalScore.textContent = `${this.score} / ${this.maxScore}`;
            }, 500);
        }
    }
    
    resetTask() {
        // Reset score and selections
        this.score = 0;
        this.selectedHotspots.clear();

        // Remove all visual indicators
        const hotspots = document.querySelectorAll('.image-hotspot');
        hotspots.forEach(hotspot => {
            hotspot.classList.remove('selected', 'correct');
            // Remove checkmarks
            const checkmark = hotspot.querySelector('.checkmark');
            if (checkmark) {
                checkmark.remove();
            }
            // Re-enable interaction
            hotspot.style.pointerEvents = 'auto';
        });

        // Remove feedback
        this.removeFeedback();

        // Update display
        this.updateScoreDisplay();

        // Hide retry button
        document.getElementById('completionModal').classList.remove('active');

        // Clear feedback
        this.setFeedback('');

        this.showToast("Quiz reset! 🔄");

        // Reset Show Solution button
        const showSolutionBtn = document.getElementById('show-solution-button');
        if (showSolutionBtn) {
            showSolutionBtn.disabled = false;
            showSolutionBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Show Solution';
            showSolutionBtn.style.opacity = '1';
            showSolutionBtn.style.cursor = 'pointer';
        }

        const checkProgressBtn = document.getElementById('check-progress-button');
        if (checkProgressBtn) {
            checkProgressBtn.disabled = false;
            checkProgressBtn.style.opacity = 1;
            checkProgressBtn.style.cursor = 'pointer';
        }
    }
    
    resizeHandler() {
        // Reposition current feedback if it exists
        if (this.currentFeedback) {
            const imageWrapper = document.querySelector('.image-wrapper');
            const x = (this.currentFeedback.percentageX / 100) * imageWrapper.offsetWidth;
            const y = (this.currentFeedback.percentageY / 100) * imageWrapper.offsetHeight;
            
            this.currentFeedback.element.style.left = (x - 16) + 'px';
            this.currentFeedback.element.style.top = (y - 16) + 'px';
        }
    }

    showToast(message = "Quiz reset! 🔄") {
        let toast = document.getElementById('toast-notification');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.position = 'fixed';
            toast.style.top = '20px';
            toast.style.right = '20px';
            toast.style.background = '#0984e3';
            toast.style.color = 'white';
            toast.style.padding = '12px 20px';
            toast.style.borderRadius = '8px';
            toast.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
            toast.style.fontSize = '16px';
            toast.style.fontWeight = '500';
            toast.style.zIndex = '2000';
            toast.style.opacity = '0';
            toast.style.pointerEvents = 'none';
            toast.style.transform = 'translateY(-20px)';
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            document.body.appendChild(toast);
        }

        toast.textContent = message;

        // Hiện toast
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        toast.style.pointerEvents = 'auto';

        // Ẩn sau 3 giây
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.style.pointerEvents = 'none';
        }, 3000);
    }
    
    // Public methods for external access
    getScore() {
        return this.score;
    }
    
    getMaxScore() {
        return this.maxScore;
    }
    
    getAnswerGiven() {
        return this.selectedHotspots.size > 0;
    }
}

// Initialize the question when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const question = new ImageMultipleHotspotQuestion();
    
    // Make it globally accessible for debugging
    window.hotspotQuestion = question;
    
    // Add some visual enhancements
    const image = document.querySelector('.hotspot-image');
    if (image) {
        image.addEventListener('load', () => {
            // Ensure proper aspect ratio is maintained
            const wrapper = document.querySelector('.image-wrapper');
            wrapper.style.height = 'auto';
        });
    }

    const showSolutionBtn = document.getElementById('show-solution-button');

    if (showSolutionBtn) {
        showSolutionBtn.addEventListener('click', () => {
            showSolution();

            showSolutionBtn.innerHTML = '<i class="fas fa-lightbulb"></i>Solution Shown';
            showSolutionBtn.disabled = true;
            showSolutionBtn.style.opacity = '0.5';
            showSolutionBtn.style.cursor = 'not-allowed';
        });
    }

    const closeModalBtn = document.getElementById('closeModalBtn');
    closeModalBtn.addEventListener('click', () => {
        document.getElementById('completionModal').classList.remove('active');
    });

    const checkProgressBtn = document.getElementById('check-progress-button');
    if (checkProgressBtn) {
        checkProgressBtn.addEventListener('click', () => {
            const score = hotspotQuestion.getScore();
            const max = hotspotQuestion.getMaxScore();
            hotspotQuestion.showToast(`Bạn đã chọn đúng ${score} / ${max} hotspot 🎯`);
        });
    }
});

// Add some utility functions
function showSolution() {
    const hotspots = document.querySelectorAll('.image-hotspot[data-correct="true"]');
    const showBtn = document.getElementById('show-solution-button');

    hotspots.forEach((hotspot, index) => {
        // Đánh dấu đúng và thêm checkmark
        hotspot.classList.add('selected', 'correct');
        if (!hotspot.querySelector('.checkmark')) {
            const checkmark = document.createElement('div');
            checkmark.className = 'checkmark';
            checkmark.innerHTML = '✓';
            Object.assign(checkmark.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#4CAF50',
                fontSize: '24px',
                fontWeight: 'bold',
                textShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
                zIndex: '10',
                pointerEvents: 'none',
                padding: '5px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            });
            hotspot.appendChild(checkmark);
        }
    });

    // Vô hiệu hóa nút show solution
    showBtn.disabled = true;
    showBtn.style.opacity = 0.5;
    showBtn.style.cursor = "not-allowed";

    // Vô hiệu hóa nút Check Progress
    const checkProgressBtn = document.getElementById('check-progress-button');
    if (checkProgressBtn) {
        checkProgressBtn.disabled = true;
        checkProgressBtn.style.opacity = 0.5;
        checkProgressBtn.style.cursor = 'not-allowed';
    }

    // Hiển thị feedback và modal
    const feedbackElement = document.getElementById('feedback');
    const feedbackText = document.getElementById('feedback-text');
    feedbackText.textContent = `Đây là tất cả các đáp án đúng. Bạn có thể chơi lại nếu muốn.`;
    feedbackElement.classList.add('visible');

    const modal = document.getElementById('completionModal');
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = `${hotspots.length} / ${hotspots.length}`;
    modal.classList.add('active');

    // Khóa tương tác
    document.querySelectorAll('.image-hotspot').forEach(h => {
        h.style.pointerEvents = 'none';
    });

     // Cập nhật thanh progress-bar
    if (window.hotspotQuestion && typeof window.hotspotQuestion.updateScoreDisplay === 'function') {
        window.hotspotQuestion.score = window.hotspotQuestion.maxScore;
        window.hotspotQuestion.updateScoreDisplay();
    }

    // 🎉 Gọi hiệu ứng celebration
    showCompletionNotification(hotspots.length, hotspots.length);
}

// function hideSolution() {
//     const hotspots = document.querySelectorAll('.image-hotspot');
//     hotspots.forEach(hotspot => {
//         if (!hotspot.classList.contains('selected')) {
//             hotspot.style.backgroundColor = 'rgba(0, 0, 0, 0)';
//             hotspot.style.border = '2px solid transparent';
//         }
//     });
// }

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageMultipleHotspotQuestion;
}

