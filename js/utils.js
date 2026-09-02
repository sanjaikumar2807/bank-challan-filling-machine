// Utility Functions for Bank Challan Machine

class Utils {
    // Format currency for Indian Rupees
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    // Format date for Indian format
    static formatDate(date, options = {}) {
        const defaultOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-IN', { ...defaultOptions, ...options }).format(date);
    }
    
    // Format time for Indian format
    static formatTime(date) {
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    }
    
    // Format datetime for Indian format
    static formatDateTime(date) {
        return this.formatDate(date) + ' ' + this.formatTime(date);
    }
    
    // Validate account number (12 digits)
    static validateAccountNumber(accountNumber) {
        const cleanNumber = accountNumber.replace(/\s/g, '');
        return /^\d{12}$/.test(cleanNumber);
    }
    
    // Format account number with spaces
    static formatAccountNumber(accountNumber) {
        const cleanNumber = accountNumber.replace(/\s/g, '');
        if (cleanNumber.length === 12) {
            return cleanNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
        }
        return accountNumber;
    }
    
    // Validate amount (positive number, reasonable limits)
    static validateAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num <= 1000000; // Max 10 lakh
    }
    
    // Generate random account number for testing
    static generateTestAccountNumber() {
        return Math.floor(Math.random() * 900000000000) + 100000000000;
    }
    
    // Generate random challan number
    static generateChallanNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `CH${timestamp}${random}`;
    }
    
    // Generate transaction ID
    static generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `TXN${timestamp}${random}`;
    }
    
    // Debounce function for input handling
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle function for scroll events
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
    
    // Download data as file
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Check if device is touch enabled
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    // Check if device is mobile
    static isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Get device type
    static getDeviceType() {
        if (this.isMobileDevice()) {
            return 'mobile';
        } else if (this.isTouchDevice()) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    // Get browser information
    static getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = userAgent.match(/Chrome\/(\d+)/)[1];
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
            browserVersion = userAgent.match(/Version\/(\d+)/)[1];
        } else if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = userAgent.match(/Firefox\/(\d+)/)[1];
        } else if (userAgent.indexOf('Edge') > -1) {
            browserName = 'Edge';
            browserVersion = userAgent.match(/Edge\/(\d+)/)[1];
        }
        
        return {
            name: browserName,
            version: browserVersion,
            userAgent: userAgent
        };
    }
    
    // Check browser compatibility
    static checkBrowserCompatibility() {
        const features = {
            camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
            speechSynthesis: 'speechSynthesis' in window,
            speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            localStorage: 'localStorage' in window,
            sessionStorage: 'sessionStorage' in window,
            webGL: this.checkWebGL(),
            canvas: !!document.createElement('canvas').getContext
        };
        
        return {
            supported: Object.values(features).every(f => f),
            features: features
        };
    }
    
    static checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    // Local storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }
    
    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }
    
    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }
    
    static clearLocalStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
    
    // Session storage helpers
    static setSessionStorage(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
            return false;
        }
    }
    
    static getSessionStorage(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return defaultValue;
        }
    }
    
    // URL helpers
    static getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    static setURLParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    }
    
    // Validation helpers
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    static validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }
    
    static validateName(name) {
        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        return nameRegex.test(name.trim());
    }
    
    static validatePincode(pincode) {
        const pincodeRegex = /^[1-9][0-9]{5}$/;
        return pincodeRegex.test(pincode);
    }
    
    // Number to words converter
    static numberToWords(num) {
        const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
        const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
        
        if (num === 0) return 'zero';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const one = num % 10;
            return tens[ten] + (one ? ' ' + ones[one] : '');
        }
        if (num < 1000) {
            const hundred = Math.floor(num / 100);
            const remainder = num % 100;
            return ones[hundred] + ' hundred' + (remainder ? ' ' + this.numberToWords(remainder) : '');
        }
        if (num < 100000) {
            const thousand = Math.floor(num / 1000);
            const remainder = num % 1000;
            return this.numberToWords(thousand) + ' thousand' + (remainder ? ' ' + this.numberToWords(remainder) : '');
        }
        if (num < 10000000) {
            const lakh = Math.floor(num / 100000);
            const remainder = num % 100000;
            return this.numberToWords(lakh) + ' lakh' + (remainder ? ' ' + this.numberToWords(remainder) : '');
        }
        
        return num.toString();
    }
    
    // Calculate age from date of birth
    static calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }
    
    // Calculate difference between two dates
    static dateDifference(date1, date2) {
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    // Generate random string
    static generateRandomString(length = 10, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    
    // Generate OTP
    static generateOTP(length = 6) {
        return this.generateRandomString(length, '0123456789');
    }
    
    // Hash password (simple implementation)
    static hashPassword(password) {
        // In production, use a proper hashing library like bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    // Check if string is empty or whitespace
    static isEmpty(str) {
        return !str || str.trim().length === 0;
    }
    
    // Truncate text with ellipsis
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }
    
    // Capitalize first letter of each word
    static capitalizeWords(str) {
        return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    }
    
    // Convert to title case
    static toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }
    
    // Check if element is in viewport
    static isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Scroll element into view
    static scrollIntoView(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
    }
    
    // Get element's position relative to viewport
    static getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
        };
    }
    
    // Add event listener with cleanup
    static addEventListenerWithCleanup(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        
        return () => {
            element.removeEventListener(event, handler, options);
        };
    }
    
    // Wait for specified time
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Retry function with exponential backoff
    static async retry(fn, maxAttempts = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed:`, error);
                
                if (attempt < maxAttempts) {
                    await this.wait(delay * Math.pow(2, attempt - 1));
                }
            }
        }
        
        throw lastError;
    }
    
    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Get file extension
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
    }
    
    // Check if file type is image
    static isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const extension = this.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(extension);
    }
    
    // Create loading indicator
    static createLoadingIndicator(container, message = 'Loading...') {
        const indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        if (container) {
            container.appendChild(indicator);
        }
        
        return indicator;
    }
    
    // Remove loading indicator
    static removeLoadingIndicator(indicator) {
        if (indicator && indicator.parentElement) {
            indicator.parentElement.removeChild(indicator);
        }
    }
    
    // Show confirmation dialog
    static showConfirmation(message, onConfirm, onCancel) {
        const confirmed = confirm(message);
        if (confirmed && onConfirm) {
            onConfirm();
        } else if (!confirmed && onCancel) {
            onCancel();
        }
        return confirmed;
    }
    
    // Get random color
    static getRandomColor() {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Get contrasting text color
    static getContrastColor(hexColor) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }
}

// Make Utils globally available
window.Utils = Utils;
