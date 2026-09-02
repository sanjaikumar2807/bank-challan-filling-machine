// Voice System for Bank Challan Machine

class VoiceSystem {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.currentLanguage = 'en-IN';
        this.voiceSettings = {
            rate: 0.9,
            pitch: 1.0,
            volume: 1.0
        };
        
        this.supportedLanguages = {
            'en-IN': 'English (India)',
            'hi-IN': 'Hindi (India)',
            'bn-IN': 'Bengali (India)',
            'gu-IN': 'Gujarati (India)',
            'kn-IN': 'Kannada (India)',
            'ml-IN': 'Malayalam (India)',
            'mr-IN': 'Marathi (India)',
            'pa-IN': 'Punjabi (India)',
            'ta-IN': 'Tamil (India)',
            'te-IN': 'Telugu (India)',
            'ur-IN': 'Urdu (India)'
        };
        
        this.initialize();
    }
    
    initialize() {
        this.initializeSpeechRecognition();
        this.loadVoices();
        console.log('Voice system initialized');
    }
    
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configure recognition
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.currentLanguage;
            this.recognition.maxAlternatives = 1;
            
            // Set up event handlers
            this.recognition.onstart = () => {
                this.isListening = true;
                this.onRecognitionStart();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.onRecognitionEnd();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;
                this.onRecognitionResult(transcript, confidence);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.onRecognitionError(event.error);
            };
            
            console.log('Speech recognition initialized');
        } else {
            console.warn('Speech recognition not supported');
        }
    }
    
    loadVoices() {
        const loadVoices = () => {
            const voices = this.synthesis.getVoices();
            console.log('Available voices:', voices.length);
            
            // Find preferred voice for current language
            const preferredVoice = this.findPreferredVoice(voices);
            if (preferredVoice) {
                this.voiceSettings.voice = preferredVoice;
            }
        };
        
        if (this.synthesis.getVoices().length > 0) {
            loadVoices();
        } else {
            this.synthesis.onvoiceschanged = loadVoices;
        }
    }
    
    findPreferredVoice(voices) {
        // Try to find voice that matches current language
        const langVoices = voices.filter(voice => voice.lang.startsWith(this.currentLanguage));
        
        if (langVoices.length > 0) {
            // Prefer female voices if available
            const femaleVoice = langVoices.find(voice => 
                voice.name.toLowerCase().includes('female')
            );
            return femaleVoice || langVoices[0];
        }
        
        // Fallback to default English voice
        const englishVoice = voices.find(voice => 
            voice.lang.startsWith('en')
        );
        
        return englishVoice || voices[0];
    }
    
    // Text-to-Speech Methods
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            return false;
        }
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings
        const settings = { ...this.voiceSettings, ...options };
        utterance.rate = settings.rate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;
        utterance.lang = settings.language || this.currentLanguage;
        
        // Set voice if specified
        if (settings.voice) {
            utterance.voice = settings.voice;
        }
        
        // Set up event handlers
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.onSpeechStart(text);
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            this.onSpeechEnd(text);
        };
        
        utterance.onerror = (event) => {
            this.isSpeaking = false;
            console.error('Speech synthesis error:', event.error);
            this.onSpeechError(event.error, text);
        };
        
        // Start speaking
        this.synthesis.speak(utterance);
        return true;
    }
    
    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }
    
    // Speech-to-Text Methods
    startListening(options = {}) {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return false;
        }
        
        if (this.isListening) {
            console.warn('Already listening');
            return false;
        }
        
        // Configure options
        if (options.language) {
            this.recognition.lang = options.language;
        }
        
        if (options.continuous !== undefined) {
            this.recognition.continuous = options.continuous;
        }
        
        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            return false;
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    // Event Handlers
    onSpeechStart(text) {
        console.log('Started speaking:', text);
        // Update UI if needed
        this.updateSpeakingIndicator(true);
    }
    
    onSpeechEnd(text) {
        console.log('Finished speaking:', text);
        // Update UI if needed
        this.updateSpeakingIndicator(false);
    }
    
    onSpeechError(error, text) {
        console.error('Speech error:', error, 'for text:', text);
        this.updateSpeakingIndicator(false);
    }
    
    onRecognitionStart() {
        console.log('Started listening');
        this.updateListeningIndicator(true);
    }
    
    onRecognitionEnd() {
        console.log('Stopped listening');
        this.updateListeningIndicator(false);
    }
    
    onRecognitionResult(transcript, confidence) {
        console.log('Recognition result:', transcript, 'Confidence:', confidence);
        this.processVoiceCommand(transcript, confidence);
    }
    
    onRecognitionError(error) {
        console.error('Recognition error:', error);
        this.updateListeningIndicator(false);
        
        const errorMessage = this.getRecognitionErrorMessage(error);
        window.challanApp.showNotification(errorMessage, 'error');
    }
    
    getRecognitionErrorMessage(error) {
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone not available. Please check your microphone.',
            'not-allowed': 'Microphone permission denied. Please allow microphone access.',
            'network': 'Network error occurred. Please check your connection.',
            'service-not-allowed': 'Speech recognition service not allowed.'
        };
        
        return errorMessages[error] || 'Speech recognition failed. Please try again.';
    }
    
    // Voice Command Processing
    processVoiceCommand(transcript, confidence) {
        const command = transcript.toLowerCase().trim();
        
        // Handle navigation commands
        if (this.handleNavigationCommand(command)) {
            return;
        }
        
        // Handle amount commands
        if (this.handleAmountCommand(command)) {
            return;
        }
        
        // Handle help commands
        if (this.handleHelpCommand(command)) {
            return;
        }
        
        // Unknown command
        this.handleUnknownCommand(command);
    }
    
    handleNavigationCommand(command) {
        const navigationCommands = {
            'go back': () => window.challanApp.goBack(),
            'back': () => window.challanApp.goBack(),
            'home': () => window.challanApp.showScreen('welcome-screen'),
            'main menu': () => window.challanApp.showScreen('welcome-screen'),
            'help': () => window.challanApp.showHelp(),
            'cancel': () => this.stopListening(),
            'stop': () => this.stopListening()
        };
        
        for (const [keyword, action] of Object.entries(navigationCommands)) {
            if (command.includes(keyword)) {
                action();
                return true;
            }
        }
        
        return false;
    }
    
    handleAmountCommand(command) {
        // Extract amount from command
        const amount = this.extractAmountFromText(command);
        
        if (amount > 0) {
            window.challanApp.setAmount(amount);
            this.speak(`Amount set to ${amount} rupees`);
            return true;
        }
        
        return false;
    }
    
    handleHelpCommand(command) {
        const helpCommands = [
            'help',
            'what can i say',
            'commands',
            'instructions'
        ];
        
        if (helpCommands.some(helpCmd => command.includes(helpCmd))) {
            this.provideHelpInstructions();
            return true;
        }
        
        return false;
    }
    
    handleUnknownCommand(command) {
        console.log('Unknown command:', command);
        this.speak('I did not understand that. Please say help for instructions.');
    }
    
    provideHelpInstructions() {
        const instructions = [
            'You can say: go back, home, help, or stop to control the application.',
            'For amounts, say: one hundred rupees, five hundred, or two thousand.',
            'You can also say: scan barcode, or print challan when available.'
        ];
        
        instructions.forEach((instruction, index) => {
            setTimeout(() => this.speak(instruction), index * 3000);
        });
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
        
        // Look for direct numbers first
        const numberMatch = text.match(/\d+/);
        if (numberMatch) {
            return parseInt(numberMatch[0]);
        }
        
        // Convert words to numbers
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
    
    // UI Update Methods
    updateSpeakingIndicator(speaking) {
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            if (speaking) {
                voiceBtn.classList.add('speaking');
            } else {
                voiceBtn.classList.remove('speaking');
            }
        }
    }
    
    updateListeningIndicator(listening) {
        const voiceBtn = document.getElementById('voice-btn');
        const voiceStatus = document.getElementById('voice-status');
        
        if (voiceBtn) {
            if (listening) {
                voiceBtn.classList.add('listening');
            } else {
                voiceBtn.classList.remove('listening');
            }
        }
        
        if (voiceStatus) {
            const statusIndicator = voiceStatus.querySelector('.status-indicator');
            const statusText = voiceStatus.querySelector('.status-text');
            
            if (listening) {
                statusIndicator.classList.add('active');
                statusText.textContent = 'Listening...';
            } else {
                statusIndicator.classList.remove('active');
                statusText.textContent = 'Ready to listen';
            }
        }
    }
    
    // Utility Methods
    setLanguage(language) {
        if (this.supportedLanguages[language]) {
            this.currentLanguage = language;
            
            // Update recognition language
            if (this.recognition) {
                this.recognition.lang = language;
            }
            
            // Reload voices for new language
            this.loadVoices();
            
            return true;
        }
        
        return false;
    }
    
    getSupportedLanguages() {
        return { ...this.supportedLanguages };
    }
    
    updateSettings(settings) {
        if (settings.rate !== undefined) {
            this.voiceSettings.rate = Math.max(0.1, Math.min(10, settings.rate));
        }
        
        if (settings.pitch !== undefined) {
            this.voiceSettings.pitch = Math.max(0, Math.min(2, settings.pitch));
        }
        
        if (settings.volume !== undefined) {
            this.voiceSettings.volume = Math.max(0, Math.min(1, settings.volume));
        }
        
        if (settings.language) {
            this.setLanguage(settings.language);
        }
    }
    
    getSettings() {
        return {
            ...this.voiceSettings,
            language: this.currentLanguage
        };
    }
    
    // Pre-defined speech methods
    speakWelcome() {
        const messages = [
            'Welcome to Bank Challan Machine',
            'Please select a transaction type to begin',
            'You can choose deposit or withdrawal'
        ];
        
        messages.forEach((message, index) => {
            setTimeout(() => this.speak(message), index * 2000);
        });
    }
    
    speakTransactionType(type) {
        const messages = {
            'deposit': 'You selected deposit. Please enter your account number.',
            'withdrawal': 'You selected withdrawal. Please enter your account number.'
        };
        
        this.speak(messages[type] || 'Transaction selected');
    }
    
    speakAmount(amount) {
        this.speak(`Amount set to ${amount} rupees`);
    }
    
    speakConfirmation() {
        this.speak('Please confirm your transaction details before proceeding.');
    }
    
    speakSuccess() {
        this.speak('Transaction completed successfully. Your challan has been generated.');
    }
    
    speakError(error) {
        this.speak(`Error: ${error}. Please try again.`);
    }
    
    speakHelp() {
        this.provideHelpInstructions();
    }
    
    // Status Methods
    isVoiceEnabled() {
        return !!(this.synthesis && this.recognition);
    }
    
    isCurrentlySpeaking() {
        return this.isSpeaking;
    }
    
    isCurrentlyListening() {
        return this.isListening;
    }
    
    // Cleanup
    destroy() {
        this.stopSpeaking();
        this.stopListening();
    }
}

// Initialize voice system
window.voiceSystem = new VoiceSystem();

// Global functions for HTML onclick handlers
function toggleVoiceInput() {
    if (window.voiceSystem.isCurrentlyListening()) {
        window.voiceSystem.stopListening();
    } else {
        window.voiceSystem.startListening();
    }
}

// Make voice system globally accessible for the main app
window.VoiceSystem = VoiceSystem;
