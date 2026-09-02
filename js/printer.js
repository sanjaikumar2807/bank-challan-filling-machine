// Thermal Printer Support for Bank Challan Machine

class ThermalPrinter {
    constructor() {
        this.printerConnected = false;
        this.printerName = 'Thermal Printer';
        this.paperWidth = 80; // mm
        this.lineHeight = 32; // pixels
        this.fontSize = 24;
        this.bold = false;
        this.align = 'left';
        
        this.initialize();
    }
    
    initialize() {
        // Check for printer support
        this.checkPrinterSupport();
        
        // Setup print styles
        this.setupPrintStyles();
        
        console.log('Thermal printer initialized');
    }
    
    checkPrinterSupport() {
        // Check if browser supports printing
        if ('print' in window) {
            this.printerConnected = true;
            console.log('Print support detected');
        } else {
            console.warn('Print not supported in this browser');
        }
    }
    
    setupPrintStyles() {
        // Create print-specific CSS
        const printStyles = document.createElement('style');
        printStyles.textContent = `
            @media print {
                @page {
                    size: 80mm auto;
                    margin: 0;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.2;
                    width: 80mm;
                    background: white;
                }
                
                .print-only {
                    display: block !important;
                }
                
                .no-print {
                    display: none !important;
                }
                
                .challan-print {
                    width: 100%;
                    padding: 5mm;
                    box-sizing: border-box;
                }
                
                .challan-header {
                    text-align: center;
                    margin-bottom: 5mm;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 3mm;
                }
                
                .challan-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 2mm;
                }
                
                .challan-subtitle {
                    font-size: 10px;
                    margin-bottom: 2mm;
                }
                
                .challan-section {
                    margin-bottom: 5mm;
                }
                
                .section-title {
                    font-weight: bold;
                    margin-bottom: 2mm;
                    border-bottom: 1px solid #000;
                    padding-bottom: 1mm;
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1mm;
                    font-size: 10px;
                }
                
                .detail-label {
                    font-weight: normal;
                }
                
                .detail-value {
                    font-weight: bold;
                    text-align: right;
                }
                
                .amount-section {
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                    padding: 3mm 0;
                    margin: 5mm 0;
                }
                
                .amount-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 1mm;
                    font-size: 12px;
                }
                
                .total-amount {
                    font-weight: bold;
                    font-size: 14px;
                    border-top: 1px solid #000;
                    padding-top: 2mm;
                    margin-top: 2mm;
                }
                
                .challan-footer {
                    text-align: center;
                    margin-top: 5mm;
                    border-top: 1px dashed #000;
                    padding-top: 3mm;
                    font-size: 8px;
                }
                
                .barcode-section {
                    text-align: center;
                    margin: 5mm 0;
                }
                
                .barcode-lines {
                    height: 20mm;
                    background: repeating-linear-gradient(
                        90deg,
                        #000,
                        #000 1px,
                        #fff 1px,
                        #fff 2px
                    );
                    margin-bottom: 2mm;
                }
                
                .barcode-number {
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    letter-spacing: 1px;
                }
                
                .cut-line {
                    border-top: 2px dashed #000;
                    margin: 5mm 0;
                    height: 1px;
                }
            }
        `;
        
        document.head.appendChild(printStyles);
    }
    
    async printChallan(challanData) {
        try {
            // Generate print content
            const printContent = this.generatePrintContent(challanData);
            
            // Create print window
            const printWindow = this.createPrintWindow(printContent);
            
            // Wait for content to load
            await this.waitForPrintReady(printWindow);
            
            // Print the content
            await this.executePrint(printWindow);
            
            // Show success message
            window.challanApp.showNotification('Challan printed successfully', 'success');
            
            // Voice feedback
            if (window.challanApp.voiceEnabled) {
                window.voiceSystem.speak('Challan printed successfully');
            }
            
            return true;
            
        } catch (error) {
            console.error('Print error:', error);
            window.challanApp.showNotification('Print failed: ' + error.message, 'error');
            return false;
        }
    }
    
    generatePrintContent(challanData) {
        const date = new Date(challanData.timestamp);
        const formattedDate = date.toLocaleDateString('en-IN');
        const formattedTime = date.toLocaleTimeString('en-IN');
        const formattedAccount = challanData.accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
        const challanNumber = this.generateChallanNumber();
        
        return `
            <div class="challan-print">
                <div class="challan-header">
                    <div class="challan-title">BANK CHALLAN RECEIPT</div>
                    <div class="challan-subtitle">Official Bank Document</div>
                    <div class="challan-subtitle">Challan No: ${challanNumber}</div>
                </div>
                
                <div class="challan-section">
                    <div class="section-title">TRANSACTION DETAILS</div>
                    <div class="detail-row">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${challanData.type.toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${formattedTime}</span>
                    </div>
                </div>
                
                <div class="challan-section">
                    <div class="section-title">ACCOUNT INFORMATION</div>
                    <div class="detail-row">
                        <span class="detail-label">Account No:</span>
                        <span class="detail-value">${formattedAccount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Account Holder:</span>
                        <span class="detail-value">${challanData.accountHolderName}</span>
                    </div>
                </div>
                
                <div class="amount-section">
                    <div class="section-title">AMOUNT DETAILS</div>
                    <div class="amount-row">
                        <span class="detail-label">Principal:</span>
                        <span class="detail-value">₹${parseInt(challanData.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="amount-row">
                        <span class="detail-label">Processing Fee:</span>
                        <span class="detail-value">₹0.00</span>
                    </div>
                    <div class="amount-row total-amount">
                        <span class="detail-label">TOTAL AMOUNT:</span>
                        <span class="detail-value">₹${parseInt(challanData.amount).toLocaleString('en-IN')}</span>
                    </div>
                </div>
                
                <div class="barcode-section">
                    <div class="barcode-lines"></div>
                    <div class="barcode-number">${challanNumber}</div>
                </div>
                
                <div class="challan-footer">
                    <div>This is a computer-generated challan</div>
                    <div>No signature required</div>
                    <div>For queries: 1800-123-4567</div>
                </div>
                
                <div class="cut-line"></div>
            </div>
        `;
    }
    
    createPrintWindow(content) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bank Challan Receipt</title>
                <style>
                    body { margin: 0; padding: 0; font-family: 'Courier New', monospace; }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
        
        return printWindow;
    }
    
    waitForPrintReady(printWindow) {
        return new Promise((resolve) => {
            if (printWindow.document.readyState === 'complete') {
                resolve();
            } else {
                printWindow.document.addEventListener('load', () => resolve());
            }
        });
    }
    
    async executePrint(printWindow) {
        return new Promise((resolve, reject) => {
            try {
                printWindow.focus();
                printWindow.print();
                
                // Wait for print dialog to close
                const checkClosed = setInterval(() => {
                    if (printWindow.closed) {
                        clearInterval(checkClosed);
                        resolve();
                    }
                }, 1000);
                
                // Fallback timeout
                setTimeout(() => {
                    clearInterval(checkClosed);
                    printWindow.close();
                    resolve();
                }, 10000);
                
            } catch (error) {
                printWindow.close();
                reject(error);
            }
        });
    }
    
    generateChallanNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `CH${timestamp}${random}`;
    }
    
    // Alternative print method for direct thermal printer
    async printDirectThermal(challanData) {
        try {
            // This would interface with actual thermal printer hardware
            // For now, we'll simulate it
            
            console.log('Printing to thermal printer:', challanData);
            
            // Simulate thermal printer commands
            const commands = this.generateThermalCommands(challanData);
            
            // Send to printer (simulation)
            await this.sendToThermalPrinter(commands);
            
            return true;
            
        } catch (error) {
            console.error('Thermal printer error:', error);
            return false;
        }
    }
    
    generateThermalCommands(challanData) {
        // Generate ESC/POS commands for thermal printer
        const commands = [];
        
        // Initialize printer
        commands.push('\x1B@'); // Initialize
        
        // Set alignment to center
        commands.push('\x1B\x61\x01'); // Center align
        
        // Print header
        commands.push('\x1B\x21\x08'); // Double height, double width
        commands.push('BANK CHALLAN');
        commands.push('\x0A'); // Line feed
        commands.push('RECEIPT');
        commands.push('\x1B\x21\x00'); // Normal size
        commands.push('\x0A'); // Line feed
        
        // Print details
        commands.push('-------------------');
        commands.push('\x0A');
        
        // Transaction details
        commands.push(`Type: ${challanData.type.toUpperCase()}`);
        commands.push('\x0A');
        commands.push(`Date: ${new Date(challanData.timestamp).toLocaleDateString('en-IN')}`);
        commands.push('\x0A');
        commands.push(`Time: ${new Date(challanData.timestamp).toLocaleTimeString('en-IN')}`);
        commands.push('\x0A');
        
        commands.push('-------------------');
        commands.push('\x0A');
        
        // Account details
        commands.push(`Account: ${challanData.accountNumber}`);
        commands.push('\x0A');
        commands.push(`Name: ${challanData.accountHolderName}`);
        commands.push('\x0A');
        
        commands.push('-------------------');
        commands.push('\x0A');
        
        // Amount
        commands.push('\x1B\x21\x08'); // Double size
        commands.push(`₹${parseInt(challanData.amount).toLocaleString('en-IN')}`);
        commands.push('\x1B\x21\x00'); // Normal size
        commands.push('\x0A');
        
        commands.push('-------------------');
        commands.push('\x0A');
        
        // Footer
        commands.push('Thank you for banking with us');
        commands.push('\x0A');
        commands.push('1800-123-4567');
        commands.push('\x0A');
        
        // Cut paper
        commands.push('\x1B\x56\x00'); // Full cut
        
        return commands.join('');
    }
    
    async sendToThermalPrinter(commands) {
        // This would interface with actual thermal printer hardware
        // For simulation, we'll just log the commands
        
        console.log('Thermal printer commands:', commands);
        
        // Simulate printing delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        return true;
    }
    
    // Check printer status
    async checkPrinterStatus() {
        try {
            // In a real implementation, this would check the actual printer status
            return {
                connected: this.printerConnected,
                paper: true, // Assume paper is available
                ink: true, // Not applicable for thermal printers
                ready: this.printerConnected
            };
        } catch (error) {
            console.error('Error checking printer status:', error);
            return {
                connected: false,
                paper: false,
                ink: false,
                ready: false
            };
        }
    }
    
    // Get printer information
    getPrinterInfo() {
        return {
            name: this.printerName,
            connected: this.printerConnected,
            paperWidth: this.paperWidth,
            supported: 'print' in window
        };
    }
    
    // Test print
    async testPrint() {
        const testData = {
            type: 'TEST',
            accountNumber: '123456789012',
            accountHolderName: 'TEST USER',
            amount: 100,
            timestamp: new Date().toISOString()
        };
        
        return await this.printChallan(testData);
    }
    
    // Download as PDF (alternative to printing)
    downloadChallanPDF(challanData) {
        try {
            // Generate PDF content
            const pdfContent = this.generatePDFContent(challanData);
            
            // Create blob and download
            const blob = new Blob([pdfContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `challan_${this.generateChallanNumber()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            window.challanApp.showNotification('Challan downloaded successfully', 'success');
            
            return true;
            
        } catch (error) {
            console.error('Download error:', error);
            window.challanApp.showNotification('Download failed: ' + error.message, 'error');
            return false;
        }
    }
    
    generatePDFContent(challanData) {
        const date = new Date(challanData.timestamp);
        const formattedDate = date.toLocaleDateString('en-IN');
        const formattedTime = date.toLocaleTimeString('en-IN');
        const formattedAccount = challanData.accountNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
        const challanNumber = this.generateChallanNumber();
        
        return `
BANK CHALLAN RECEIPT
Official Bank Document
Challan No: ${challanNumber}

TRANSACTION DETAILS
Type: ${challanData.type.toUpperCase()}
Date: ${formattedDate}
Time: ${formattedTime}

ACCOUNT INFORMATION
Account No: ${formattedAccount}
Account Holder: ${challanData.accountHolderName}

AMOUNT DETAILS
Principal: ₹${parseInt(challanData.amount).toLocaleString('en-IN')}
Processing Fee: ₹0.00
TOTAL AMOUNT: ₹${parseInt(challanData.amount).toLocaleString('en-IN')}

${challanNumber}

This is a computer-generated challan
No signature required
For queries: 1800-123-4567
        `.trim();
    }
}

// Initialize printer
window.thermalPrinter = new ThermalPrinter();

// Global functions for HTML onclick handlers
function printChallan() {
    const challanData = window.challanApp.transactionData;
    window.thermalPrinter.printChallan(challanData);
}

function downloadChallan() {
    const challanData = window.challanApp.transactionData;
    window.thermalPrinter.downloadChallanPDF(challanData);
}

// Make printer globally accessible
window.ThermalPrinter = ThermalPrinter;
