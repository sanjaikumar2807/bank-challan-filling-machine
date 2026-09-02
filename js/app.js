// Bank Challan Machine - Main Application JavaScript

class ChallanApp {
    constructor() {
        this.currentScreen = 'welcome-screen';
        this.transactionData = {
            type: null,
            accountNumber: '',
            accountHolderName: '',
            amount: 0,
            timestamp: null
        };
        this.sessionTimer = 300; // 5 minutes in seconds
        this.sessionInterval = null;
        this.voiceEnabled = true;
        this.currentLanguage = 'en';
        
        this.initializeApp();
    }
    
    initializeApp() {
        console.log('Initializing Bank Challan Machine...');
        
        // Start session timer
        this.startSessionTimer();
        
        // Update datetime
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        
        // Initialize voice system
        this.initializeVoice();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for camera support
        this.checkCameraSupport();
        
        // Load saved preferences
        this.loadUserPreferences();
        
        console.log('Bank Challan Machine initialized successfully');
    }
    
    setupEventListeners() {
        // Prevent context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent zoom on double tap
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        });
        
        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseSession();
            } else {
                this.resumeSession();
            }
        });
        
        // Handle input validation
        this.setupInputValidation();
        
        // Handle amount input
        this.setupAmountInput();
    }
    
    handleKeyPress(event) {
        // Global keyboard shortcuts
        switch(event.key) {
            case 'Escape':
                this.goBack();
                break;
            case 'F1':
                event.preventDefault();
                this.showHelp();
                break;
            case 'F5':
                event.preventDefault();
                this.restartSession();
                break;
        }
    }
    
    setupInputValidation() {
        // Account number validation
        const accountInput = document.getElementById('account-number');
        const confirmAccountInput = document.getElementById('confirm-account-number');
        
        if (accountInput) {
            accountInput.addEventListener('input', (e) => {
                // Only allow numbers
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                
                // Auto-format with spaces for readability
                if (e.target.value.length > 0) {
                    const formatted = e.target.value.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
                    if (formatted !== e.target.value) {
                        // Store actual value without spaces
                        e.target.dataset.actualValue = e.target.value;
                    }
                }
            });
        }
        
        if (confirmAccountInput) {
            confirmAccountInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });
        }
        
        // Account holder name validation
        const nameInput = document.getElementById('account-holder-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                // Only allow letters and spaces
                e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                
                // Capitalize first letter of each word
                const words = e.target.value.split(' ');
                const capitalized = words.map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                e.target.value = capitalized;
            });
        }
    }
    
    setupAmountInput() {
        const amountTextInput = document.getElementById('amount-text-input');
        if (amountTextInput) {
            amountTextInput.addEventListener('input', (e) => {
                // Only allow numbers
                let value = e.target.value.replace(/[^0-9]/g, '');
                
                // Update display
                this.updateAmountDisplay(value);
            });
        }
    }
    
    updateDateTime() {
        const datetimeElement = document.getElementById('datetime');
        if (datetimeElement) {
            const now = new Date();
            const options = {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            };
            datetimeElement.textContent = now.toLocaleString('en-IN', options);
        }
    }
    
    startSessionTimer() {
        this.sessionInterval = setInterval(() => {
            this.sessionTimer--;
            this.updateSessionDisplay();
            
            if (this.sessionTimer <= 0) {
                this.sessionTimeout();
            } else if (this.sessionTimer <= 30) {
                this.showSessionWarning();
            }
        }, 1000);
    }
    
    updateSessionDisplay() {
        const sessionElement = document.getElementById('session-timer');
        if (sessionElement) {
            const minutes = Math.floor(this.sessionTimer / 60);
            const seconds = this.sessionTimer % 60;
            sessionElement.textContent = `Session: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    pauseSession() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
            this.sessionInterval = null;
        }
    }
    
    resumeSession() {
        if (!this.sessionInterval && this.sessionTimer > 0) {
            this.startSessionTimer();
        }
    }
    
    showSessionWarning() {
        // Show warning when less than 30 seconds remaining
        if (this.sessionTimer === 30 || this.sessionTimer === 10) {
            this.showNotification(`Session expiring in ${this.sessionTimer} seconds`, 'warning');
            if (this.voiceEnabled) {
                this.speakText(`Session expiring in ${this.sessionTimer} seconds`);
            }
        }
    }
    
    sessionTimeout() {
        this.showNotification('Session expired. Starting new session...', 'info');
        this.restartSession();
    }
    
    restartSession() {
        // Reset session
        this.sessionTimer = 300;
        this.transactionData = {
            type: null,
            accountNumber: '',
            accountHolderName: '',
            amount: 0,
            timestamp: null
        };
        
        // Clear all inputs
        this.clearAllInputs();
        
        // Go to welcome screen
        this.showScreen('welcome-screen');
        
        // Restart timer
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        this.startSessionTimer();
    }
    
    clearAllInputs() {
        // Clear all form inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Reset amount display
        this.updateAmountDisplay(0);
    }
    
    // Screen Management
    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            
            // Screen-specific initialization
            this.initializeScreen(screenId);
        }
    }
    
    initializeScreen(screenId) {
        switch(screenId) {
            case 'welcome-screen':
                this.speakText('Welcome to Bank Challan Service. Please select a transaction type to begin.');
                break;
            case 'account-screen':
                document.getElementById('account-number').focus();
                break;
            case 'amount-screen':
                this.resetAmountInput();
                break;
            case 'confirmation-screen':
                this.populateConfirmationDetails();
                break;
            case 'challan-screen':
                this.generateChallanContent();
                break;
        }
    }
    
    // Transaction Flow
    selectTransactionType(type) {
        this.transactionData.type = type;
        this.showScreen('account-screen');
        
        // Voice feedback
        const typeNames = {
            'deposit': 'deposit',
            'withdrawal': 'withdrawal'
        };
        this.speakText(`You selected ${typeNames[type]}. Please enter your account number.`);
    }
    
    proceedToAmount() {
        // Validate account details
        const accountNumber = document.getElementById('account-number').value.replace(/\s/g, '');
        const confirmAccountNumber = document.getElementById('confirm-account-number').value;
        const accountHolderName = document.getElementById('account-holder-name').value.trim();
        
        if (!accountNumber || accountNumber.length !== 12) {
            this.showNotification('Please enter a valid 12-digit account number', 'error');
            this.shakeElement('account-number');
            return;
        }
        
        if (accountNumber !== confirmAccountNumber) {
            this.showNotification('Account numbers do not match', 'error');
            this.shakeElement('confirm-account-number');
            return;
        }
        
        if (!accountHolderName || accountHolderName.length < 3) {
            this.showNotification('Please enter a valid account holder name', 'error');
            this.shakeElement('account-holder-name');
            return;
        }
        
        // Save transaction data
        this.transactionData.accountNumber = accountNumber;
        this.transactionData.accountHolderName = accountHolderName;
        
        // Proceed to amount screen
        this.showScreen('amount-screen');
        this.speakText('Please enter the amount using the keypad or voice input.');
    }
    
    // Amount Input Methods
    setInputMethod(method) {
        // Update method buttons
        const methodBtns = document.querySelectorAll('.method-btn');
        methodBtns.forEach(btn => btn.classList.remove('active'));
        event.target.closest('.method-btn').classList.add('active');
        
        // Show corresponding input method
        const inputMethods = document.querySelectorAll('.input-method');
        inputMethods.forEach(method => method.classList.remove('active'));
        
        const targetMethod = document.getElementById(`${method}-input`);
        if (targetMethod) {
            targetMethod.classList.add('active');
        }
        
        // Focus appropriate input
        if (method === 'text') {
            setTimeout(() => {
                const textInput = document.getElementById('amount-text-input');
                if (textInput) textInput.focus();
            }, 100);
        }
    }
    
    addDigit(digit) {
        const currentAmount = this.transactionData.amount.toString();
        const newAmount = currentAmount + digit;
        
        // Prevent amount from being too large
        if (parseInt(newAmount) > 999999) {
            this.showNotification('Maximum amount exceeded', 'warning');
            return;
        }
        
        this.transactionData.amount = parseInt(newAmount);
        this.updateAmountDisplay(this.transactionData.amount);
        
        // Voice feedback for large amounts
        if (this.voiceEnabled && this.transactionData.amount > 0 && this.transactionData.amount % 1000 === 0) {
            this.speakNumber(this.transactionData.amount);
        }
    }
    
    setAmount(amount) {
        this.transactionData.amount = amount;
        this.updateAmountDisplay(amount);
        
        if (this.voiceEnabled) {
            this.speakNumber(amount);
        }
    }
    
    clearAmount() {
        this.transactionData.amount = 0;
        this.updateAmountDisplay(0);
    }
    
    updateAmountDisplay(amount) {
        const displayElement = document.getElementById('amount-display');
        if (displayElement) {
            displayElement.textContent = parseInt(amount).toLocaleString('en-IN');
        }
        
        // Update text input if visible
        const textInput = document.getElementById('amount-text-input');
        if (textInput && document.getElementById('text-input').classList.contains('active')) {
            textInput.value = amount;
        }
    }
    
    resetAmountInput() {
        this.transactionData.amount = 0;
        this.updateAmountDisplay(0);
        
        // Reset to keypad input
        const keypadBtn = document.querySelector('.method-btn');
        if (keypadBtn) {
            keypadBtn.click();
        }
    }
    
    proceedToConfirmation() {
        if (this.transactionData.amount <= 0) {
            this.showNotification('Please enter a valid amount', 'error');
            this.shakeElement('amount-display');
            return;
        }
        
        // Set timestamp
        this.transactionData.timestamp = new Date().toISOString();
        
        // Show confirmation screen
        this.showScreen('confirmation-screen');
        this.speakText('Please confirm your transaction details.');
    }
    
    populateConfirmationDetails() {
        // Update confirmation screen with transaction details
        const typeElement = document.getElementById('confirm-type');
        const accountElement = document.getElementById('confirm-account');
        const nameElement = document.getElementById('confirm-name');
        const amountElement = document.getElementById('confirm-amount');
        const datetimeElement = document.getElementById('confirm-datetime');
        
        if (typeElement) {
            const typeNames = {
                'deposit': 'Deposit',
                'withdrawal': 'Withdrawal'
            };
            typeElement.textContent = typeNames[this.transactionData.type] || '-';
        }
        
        if (accountElement) {
            // Format account number with spaces
            const formatted = this.transactionData.accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
            accountElement.textContent = formatted;
        }
        
        if (nameElement) {
            nameElement.textContent = this.transactionData.accountHolderName || '-';
        }
        
        if (amountElement) {
            amountElement.textContent = `₹${parseInt(this.transactionData.amount).toLocaleString('en-IN')}`;
        }
        
        if (datetimeElement) {
            const date = new Date(this.transactionData.timestamp);
            datetimeElement.textContent = date.toLocaleString('en-IN');
        }
    }
    
    generateChallan() {
        // Check if confirmation checkbox is checked
        const confirmCheckbox = document.getElementById('confirm-checkbox');
        if (!confirmCheckbox || !confirmCheckbox.checked) {
            this.showNotification('Please confirm the transaction details', 'warning');
            this.shakeElement('confirm-checkbox');
            return;
        }
        
        // Show challan screen
        this.showScreen('challan-screen');
        this.speakText('Challan generated successfully. You can now print or download your challan.');
    }
    
    generateChallanContent() {
        const challanDocument = document.getElementById('challan-document');
        if (!challanDocument) return;
        
        const date = new Date(this.transactionData.timestamp);
        const formattedDate = date.toLocaleDateString('en-IN');
        const formattedTime = date.toLocaleTimeString('en-IN');
        const formattedAccount = this.transactionData.accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
        
        const challanHTML = `
            <div class="challan-header">
                <div class="bank-info">
                    <h2>Bank Challan Receipt</h2>
                    <p>Official Bank Document</p>
                </div>
                <div class="challan-number">
                    <p>Challan No: ${this.generateChallanNumber()}</p>
                </div>
            </div>
            
            <div class="challan-details">
                <div class="section">
                    <h3>Transaction Details</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Transaction Type:</label>
                            <span>${this.transactionData.type.charAt(0).toUpperCase() + this.transactionData.type.slice(1)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Date:</label>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="detail-item">
                            <label>Time:</label>
                            <span>${formattedTime}</span>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Account Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Account Number:</label>
                            <span>${formattedAccount}</span>
                        </div>
                        <div class="detail-item">
                            <label>Account Holder:</label>
                            <span>${this.transactionData.accountHolderName}</span>
                        </div>
                    </div>
                </div>
                
                <div class="section amount-section">
                    <h3>Amount Details</h3>
                    <div class="amount-breakdown">
                        <div class="amount-row">
                            <label>Principal Amount:</label>
                            <span>₹${parseInt(this.transactionData.amount).toLocaleString('en-IN')}</span>
                        </div>
                        <div class="amount-row">
                            <label>Processing Fee:</label>
                            <span>₹0.00</span>
                        </div>
                        <div class="amount-row total">
                            <label>Total Amount:</label>
                            <span>₹${parseInt(this.transactionData.amount).toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="challan-footer">
                <div class="verification-info">
                    <p>This is a computer-generated challan and is valid without signature.</p>
                    <p>For any queries, please contact: 1800-123-4567</p>
                </div>
                <div class="barcode">
                    <div class="barcode-lines"></div>
                    <div class="barcode-number">${this.generateChallanNumber()}</div>
                </div>
            </div>
        `;
        
        challanDocument.innerHTML = challanHTML;
    }
    
    generateChallanNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `CH${timestamp}${random}`;
    }
    
    // Voice System
    initializeVoice() {
        // Check if speech synthesis is available
        if ('speechSynthesis' in window) {
            this.voiceEnabled = true;
        } else {
            this.voiceEnabled = false;
            console.warn('Speech synthesis not supported');
        }
    }
    
    speakText(text) {
        if (!this.voiceEnabled) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        window.speechSynthesis.speak(utterance);
    }
    
    speakNumber(number) {
        const numberToWords = (num) => {
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
                return ones[hundred] + ' hundred' + (remainder ? ' ' + numberToWords(remainder) : '');
            }
            if (num < 100000) {
                const thousand = Math.floor(num / 1000);
                const remainder = num % 1000;
                return numberToWords(thousand) + ' thousand' + (remainder ? ' ' + numberToWords(remainder) : '');
            }
            
            return num.toString();
        };
        
        const words = numberToWords(number);
        this.speakText(`${words} rupees`);
    }
    
    // Voice Input for Amount
    toggleVoiceInput() {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceStatus = document.getElementById('voice-status');
        
        if (!this.recognition) {
            this.initSpeechRecognition();
        }
        
        if (this.isListening) {
            this.stopVoiceInput();
        } else {
            this.startVoiceInput();
        }
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-IN';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.processVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopVoiceInput();
                this.showNotification('Voice input failed. Please try again.', 'error');
            };
            
            this.recognition.onend = () => {
                this.stopVoiceInput();
            };
        } else {
            this.showNotification('Voice input not supported in this browser', 'warning');
        }
    }
    
    startVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Voice input not available', 'warning');
            return;
        }
        
        const voiceBtn = document.getElementById('voice-btn');
        const voiceStatus = document.getElementById('voice-status');
        const statusIndicator = voiceStatus.querySelector('.status-indicator');
        const statusText = voiceStatus.querySelector('.status-text');
        
        voiceBtn.classList.add('listening');
        statusIndicator.classList.add('active');
        statusText.textContent = 'Listening...';
        
        this.isListening = true;
        this.recognition.start();
        
        // Visual feedback
        this.speakText('Please say the amount clearly');
    }
    
    stopVoiceInput() {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceStatus = document.getElementById('voice-status');
        const statusIndicator = voiceStatus.querySelector('.status-indicator');
        const statusText = voiceStatus.querySelector('.status-text');
        
        if (voiceBtn) voiceBtn.classList.remove('listening');
        if (statusIndicator) statusIndicator.classList.remove('active');
        if (statusText) statusText.textContent = 'Ready to listen';
        
        this.isListening = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    processVoiceInput(transcript) {
        console.log('Voice input:', transcript);
        
        // Extract amount from voice input
        const amount = this.extractAmountFromText(transcript);
        
        if (amount > 0) {
            this.setAmount(amount);
            this.showNotification(`Amount set: ₹${amount.toLocaleString('en-IN')}`, 'success');
            this.speakText(`Amount set to ${amount} rupees`);
        } else {
            this.showNotification('Could not understand the amount. Please try again.', 'warning');
            this.speakText('Could not understand the amount. Please try again.');
        }
    }
    
    extractAmountFromText(text) {
        const numberWords = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
            'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
            'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
            'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
            'lakh': 100000, 'crore': 10000000
        };
        
        // Look for numbers in the text
        const numberMatch = text.match(/\d+/);
        if (numberMatch) {
            return parseInt(numberMatch[0]);
        }
        
        // Convert words to numbers (simplified)
        const words = text.toLowerCase().split(' ');
        let amount = 0;
        let current = 0;
        
        for (const word of words) {
            if (numberWords[word] !== undefined) {
                const value = numberWords[word];
                if (value >= 100) {
                    current = current === 0 ? value : current * value;
                    amount += current;
                    current = 0;
                } else {
                    current += value;
                }
            }
        }
        
        return amount + current;
    }
    
    // Barcode Scanner
    checkCameraSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera not supported');
            return false;
        }
        return true;
    }
    
    // Utility Functions
    goBack() {
        const screenFlow = ['welcome-screen', 'account-screen', 'amount-screen', 'confirmation-screen', 'challan-screen'];
        const currentIndex = screenFlow.indexOf(this.currentScreen);
        
        if (currentIndex > 0) {
            this.showScreen(screenFlow[currentIndex - 1]);
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} notification-slide-in`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('notification-slide-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    shakeElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('shake');
            setTimeout(() => element.classList.remove('shake'), 500);
        }
    }
    
    showHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = 'block';
            this.pauseSession();
        }
    }
    
    closeHelp() {
        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resumeSession();
        }
    }
    
    loadUserPreferences() {
        // Load saved preferences from localStorage
        const savedVoice = localStorage.getItem('voiceEnabled');
        if (savedVoice !== null) {
            this.voiceEnabled = savedVoice === 'true';
        }
        
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
        }
    }
    
    saveUserPreferences() {
        localStorage.setItem('voiceEnabled', this.voiceEnabled);
        localStorage.setItem('language', this.currentLanguage);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.challanApp = new ChallanApp();
});

// Global functions for HTML onclick handlers
function selectTransactionType(type) {
    window.challanApp.selectTransactionType(type);
}

function proceedToAmount() {
    window.challanApp.proceedToAmount();
}

function setInputMethod(method) {
    window.challanApp.setInputMethod(method);
}

function addDigit(digit) {
    window.challanApp.addDigit(digit);
}

function setAmount(amount) {
    window.challanApp.setAmount(amount);
}

function clearAmount() {
    window.challanApp.clearAmount();
}

function proceedToConfirmation() {
    window.challanApp.proceedToConfirmation();
}

function generateChallan() {
    window.challanApp.generateChallan();
}

function goBack() {
    window.challanApp.goBack();
}

function showHelp() {
    window.challanApp.showHelp();
}

function closeHelp() {
    window.challanApp.closeHelp();
}

function toggleVoiceInput() {
    window.challanApp.toggleVoiceInput();
}

// Modal close on outside click
window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (event.target === modal) {
        closeHelp();
    }
}
