// Barcode Scanner Module for Bank Challan Machine

class BarcodeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.scanning = false;
        this.scanInterval = null;
        this.lastScanResult = null;
        this.scanHistory = [];
        
        // Supported barcode formats
        this.supportedFormats = [
            'code_128',
            'code_39',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'itf',
            'qr_code',
            'data_matrix',
            'pdf417'
        ];
        
        this.initialize();
    }
    
    initialize() {
        // Create canvas for image processing
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('Barcode scanner initialized');
    }
    
    setupEventListeners() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.scanning) {
                this.pauseScanning();
            } else if (!document.hidden && this.scanning && this.stream) {
                this.resumeScanning();
            }
        });
    }
    
    async startScanner() {
        try {
            if (this.scanning) {
                console.log('Scanner already running');
                return;
            }
            
            // Check camera support
            if (!this.checkCameraSupport()) {
                throw new Error('Camera not supported');
            }
            
            // Get video element
            this.video = document.getElementById('scanner-video');
            if (!this.video) {
                throw new Error('Video element not found');
            }
            
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            
            // Set up video stream
            this.video.srcObject = this.stream;
            await this.video.play();
            
            // Set canvas size
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
            });
            
            // Start scanning
            this.scanning = true;
            this.startScanLoop();
            
            console.log('Barcode scanner started');
            return true;
            
        } catch (error) {
            console.error('Error starting scanner:', error);
            this.handleScannerError(error);
            return false;
        }
    }
    
    stopScanner() {
        if (!this.scanning) {
            return;
        }
        
        this.scanning = false;
        
        // Stop scan loop
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        // Stop video stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Clear video
        if (this.video) {
            this.video.srcObject = null;
        }
        
        console.log('Barcode scanner stopped');
    }
    
    pauseScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
    }
    
    resumeScanning() {
        if (this.scanning && !this.scanInterval) {
            this.startScanLoop();
        }
    }
    
    startScanLoop() {
        this.scanInterval = setInterval(() => {
            this.performScan();
        }, 100); // Scan every 100ms
    }
    
    async performScan() {
        if (!this.scanning || !this.video || !this.context) {
            return;
        }
        
        try {
            // Draw current video frame to canvas
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Scan for barcodes
            const result = await this.scanImageData(imageData);
            
            if (result && result !== this.lastScanResult) {
                this.handleScanResult(result);
                this.lastScanResult = result;
            }
            
        } catch (error) {
            console.error('Error during scan:', error);
        }
    }
    
    async scanImageData(imageData) {
        // In a real implementation, you would use a barcode scanning library
        // For this demo, we'll simulate barcode detection
        
        // Simulate scan delay and random success
        if (Math.random() < 0.02) { // 2% chance per frame
            return this.generateMockBarcode();
        }
        
        return null;
    }
    
    generateMockBarcode() {
        // Generate mock account numbers for demonstration
        const accountNumbers = [
            '123456789012',
            '234567890123',
            '345678901234',
            '456789012345',
            '567890123456'
        ];
        
        const randomAccount = accountNumbers[Math.floor(Math.random() * accountNumbers.length)];
        
        return {
            format: 'code_128',
            data: randomAccount,
            timestamp: new Date().toISOString(),
            confidence: 0.95
        };
    }
    
    handleScanResult(result) {
        console.log('Barcode scanned:', result);
        
        // Validate account number format
        if (!this.validateAccountNumber(result.data)) {
            this.showScanError('Invalid account number format');
            return;
        }
        
        // Add to scan history
        this.addToScanHistory(result);
        
        // Auto-fill account number
        this.autoFillAccountNumber(result.data);
        
        // Show success feedback
        this.showScanSuccess(result);
        
        // Stop scanner after successful scan
        setTimeout(() => {
            this.stopScanner();
            this.hideScannerSection();
        }, 1000);
        
        // Play success sound
        this.playSuccessSound();
        
        // Vibrate if supported
        this.vibrate();
    }
    
    validateAccountNumber(accountNumber) {
        // Basic validation for 12-digit account number
        return /^\d{12}$/.test(accountNumber);
    }
    
    addToScanHistory(result) {
        this.scanHistory.unshift(result);
        
        // Keep only last 10 scans
        if (this.scanHistory.length > 10) {
            this.scanHistory = this.scanHistory.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('scanHistory', JSON.stringify(this.scanHistory));
    }
    
    autoFillAccountNumber(accountNumber) {
        const accountInput = document.getElementById('account-number');
        const confirmAccountInput = document.getElementById('confirm-account-number');
        
        if (accountInput) {
            accountInput.value = accountNumber;
            // Trigger input event for validation
            accountInput.dispatchEvent(new Event('input'));
        }
        
        if (confirmAccountInput) {
            confirmAccountInput.value = accountNumber;
            confirmAccountInput.dispatchEvent(new Event('input'));
        }
        
        // Focus on next field
        const nameInput = document.getElementById('account-holder-name');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 500);
        }
    }
    
    showScanSuccess(result) {
        const message = `Account number scanned: ${result.data}`;
        window.challanApp.showNotification(message, 'success');
        
        if (window.challanApp.voiceEnabled) {
            window.challanApp.speakText('Account number scanned successfully');
        }
    }
    
    showScanError(message) {
        window.challanApp.showNotification(message, 'error');
        
        if (window.challanApp.voiceEnabled) {
            window.challanApp.speakText('Invalid barcode. Please try again.');
        }
    }
    
    handleScannerError(error) {
        console.error('Scanner error:', error);
        
        let errorMessage = 'Scanner error occurred';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please connect a camera.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Camera not supported in this browser.';
        }
        
        window.challanApp.showNotification(errorMessage, 'error');
        this.hideScannerSection();
    }
    
    playSuccessSound() {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
    }
    
    checkCameraSupport() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
    
    async checkPermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state;
        } catch (error) {
            console.warn('Could not check camera permissions:', error);
            return 'prompt';
        }
    }
    
    async requestPermissions() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Camera permission denied:', error);
            return false;
        }
    }
    
    showScannerSection() {
        const scannerSection = document.getElementById('scanner-section');
        if (scannerSection) {
            scannerSection.style.display = 'block';
            scannerSection.classList.add('fade-in');
        }
    }
    
    hideScannerSection() {
        const scannerSection = document.getElementById('scanner-section');
        if (scannerSection) {
            scannerSection.classList.add('fade-out');
            setTimeout(() => {
                scannerSection.style.display = 'none';
                scannerSection.classList.remove('fade-in', 'fade-out');
            }, 300);
        }
    }
    
    // Alternative scanning methods
    async scanFromImage(file) {
        try {
            const result = await this.processImageFile(file);
            if (result) {
                this.handleScanResult(result);
                return result;
            } else {
                this.showScanError('No barcode found in image');
                return null;
            }
        } catch (error) {
            console.error('Error scanning image:', error);
            this.showScanError('Failed to scan image');
            return null;
        }
    }
    
    async processImageFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                try {
                    // Set canvas size
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    
                    // Draw image to canvas
                    this.context.drawImage(img, 0, 0);
                    
                    // Get image data
                    const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Scan for barcodes
                    const result = this.scanImageData(imageData);
                    
                    // Cleanup
                    URL.revokeObjectURL(url);
                    
                    resolve(result);
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }
    
    getScanHistory() {
        return [...this.scanHistory];
    }
    
    clearScanHistory() {
        this.scanHistory = [];
        localStorage.removeItem('scanHistory');
    }
    
    // Utility methods
    getSupportedFormats() {
        return [...this.supportedFormats];
    }
    
    isScanning() {
        return this.scanning;
    }
    
    getLastScanResult() {
        return this.lastScanResult;
    }
    
    // Cleanup
    destroy() {
        this.stopScanner();
        this.clearScanHistory();
    }
}

// Initialize scanner
window.barcodeScanner = new BarcodeScanner();

// Global functions for HTML onclick handlers
async function startBarcodeScanner() {
    const success = await window.barcodeScanner.startScanner();
    if (success) {
        window.barcodeScanner.showScannerSection();
        
        if (window.challanApp.voiceEnabled) {
            window.challanApp.speakText('Position the barcode in front of the camera');
        }
    }
}

function stopScanner() {
    window.barcodeScanner.stopScanner();
    window.barcodeScanner.hideScannerSection();
}

function captureScan() {
    // Manual capture trigger (if needed)
    console.log('Manual capture triggered');
}

// File upload handler
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        window.barcodeScanner.scanFromImage(file);
    }
}

// Add file upload handler to page
document.addEventListener('DOMContentLoaded', () => {
    // Create hidden file input for image upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileUpload);
    document.body.appendChild(fileInput);
    
    // Make it globally accessible
    window.fileInputForBarcode = fileInput;
});

// Alternative: Add upload button to scanner section
function showUploadOption() {
    if (window.fileInputForBarcode) {
        window.fileInputForBarcode.click();
    }
}
