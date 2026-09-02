-- MySQL Database Setup for Bank Challan Machine
-- Run this script to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS bank_challan 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE bank_challan;

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(12) NOT NULL UNIQUE,
    account_holder_name VARCHAR(100) NOT NULL,
    account_type ENUM('savings', 'current', 'fixed_deposit', 'recurring_deposit') DEFAULT 'savings',
    balance DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_account_number (account_number),
    INDEX idx_account_holder_name (account_holder_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id VARCHAR(20) NOT NULL UNIQUE,
    account_number VARCHAR(12) NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    to_account_number VARCHAR(12),
    to_account_holder_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_account_number (account_number),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_session_id (session_id),
    
    FOREIGN KEY (account_number) REFERENCES accounts(account_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challans table
CREATE TABLE IF NOT EXISTS challans (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id CHAR(36) NOT NULL UNIQUE,
    challan_number VARCHAR(20) NOT NULL UNIQUE,
    pdf_file VARCHAR(255),
    printed BOOLEAN DEFAULT FALSE,
    print_count INT DEFAULT 0,
    content TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    printed_at TIMESTAMP NULL,
    
    INDEX idx_challan_number (challan_number),
    INDEX idx_generated_at (generated_at),
    INDEX idx_printed (printed),
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    transaction_count INT DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    
    INDEX idx_session_id (session_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_started_at (started_at),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    level ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(50) NOT NULL,
    function_name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    extra_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level (level),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Printer Status table
CREATE TABLE IF NOT EXISTS printer_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    printer_name VARCHAR(100) NOT NULL UNIQUE,
    is_connected BOOLEAN DEFAULT FALSE,
    has_paper BOOLEAN DEFAULT TRUE,
    ink_level INT DEFAULT 100,
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    error_message TEXT,
    
    INDEX idx_printer_name (printer_name),
    INDEX idx_is_connected (is_connected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurations table
CREATE TABLE IF NOT EXISTS configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key_name (key_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO accounts (account_number, account_holder_name, account_type, balance) VALUES
('123456789012', 'John Doe', 'savings', 50000.00),
('234567890123', 'Jane Smith', 'current', 25000.00),
('345678901234', 'Robert Johnson', 'savings', 75000.00),
('456789012345', 'Mary Williams', 'fixed_deposit', 100000.00),
('567890123456', 'David Brown', 'savings', 15000.00),
('678901234567', 'Sarah Davis', 'current', 35000.00),
('789012345678', 'Michael Miller', 'savings', 60000.00),
('890123456789', 'Emily Wilson', 'recurring_deposit', 20000.00),
('901234567890', 'James Moore', 'savings', 40000.00),
('012345678901', 'Patricia Taylor', 'current', 80000.00);

-- Insert default configurations
INSERT INTO configurations (key_name, value, description) VALUES
('max_transaction_amount', '1000000', 'Maximum transaction amount allowed'),
('min_transaction_amount', '100', 'Minimum transaction amount allowed'),
('session_timeout', '1800', 'Session timeout in seconds'),
('printer_paper_width', '80', 'Thermal printer paper width in mm'),
('voice_enabled', 'true', 'Voice assistance enabled'),
('barcode_enabled', 'true', 'Barcode scanner enabled'),
('daily_withdrawal_limit', '2000000', 'Daily withdrawal limit'),
('daily_deposit_limit', '1000000', 'Daily deposit limit'),
('daily_transfer_limit', '2000000', 'Daily transfer limit');

-- Insert printer status
INSERT INTO printer_status (printer_name, is_connected, has_paper) VALUES
('Thermal Printer', TRUE, TRUE);

-- Create triggers for automatic updates
DELIMITER //

-- Trigger to update account balance on transaction completion
CREATE TRIGGER IF NOT EXISTS update_account_balance
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        IF NEW.transaction_type = 'deposit' THEN
            UPDATE accounts 
            SET balance = balance + NEW.amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE account_number = NEW.account_number;
        ELSEIF NEW.transaction_type = 'withdrawal' THEN
            UPDATE accounts 
            SET balance = balance - NEW.amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE account_number = NEW.account_number;
        END IF;
    END IF;
END//

DELIMITER ;

-- Create views for reporting
CREATE OR REPLACE VIEW transaction_summary AS
SELECT 
    DATE(created_at) as transaction_date,
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM transactions 
WHERE status = 'completed'
GROUP BY DATE(created_at), transaction_type
ORDER BY transaction_date DESC;

CREATE OR REPLACE VIEW daily_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
    SUM(CASE WHEN transaction_type = 'transfer' THEN amount ELSE 0 END) as total_transfers,
    SUM(amount) as total_amount
FROM transactions 
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS get_account_balance(IN account_num VARCHAR(12), OUT balance DECIMAL(12,2))
BEGIN
    SELECT balance INTO balance 
    FROM accounts 
    WHERE account_number = account_num;
END//

CREATE PROCEDURE IF NOT EXISTS validate_transaction_limits(
    IN account_num VARCHAR(12),
    IN trans_type VARCHAR(20),
    IN trans_amount DECIMAL(12,2),
    OUT is_valid BOOLEAN,
    OUT error_message VARCHAR(255)
)
BEGIN
    DECLARE account_balance DECIMAL(12,2);
    DECLARE daily_total DECIMAL(12,2);
    DECLARE max_amount DECIMAL(12,2);
    DECLARE daily_limit DECIMAL(12,2);
    
    -- Get account balance
    SELECT balance INTO account_balance 
    FROM accounts 
    WHERE account_number = account_num;
    
    -- Get daily total for this transaction type
    SELECT COALESCE(SUM(amount), 0) INTO daily_total
    FROM transactions 
    WHERE account_number = account_num 
    AND transaction_type = trans_type 
    AND status = 'completed'
    AND DATE(created_at) = CURDATE();
    
    -- Set limits based on transaction type
    CASE trans_type
        WHEN 'deposit' THEN
            SET max_amount = 500000;
            SET daily_limit = 1000000;
        WHEN 'withdrawal' THEN
            SET max_amount = 1000000;
            SET daily_limit = 2000000;
        WHEN 'transfer' THEN
            SET max_amount = 1000000;
            SET daily_limit = 2000000;
        ELSE
            SET max_amount = 1000000;
            SET daily_limit = 2000000;
    END CASE;
    
    -- Validate limits
    SET is_valid = TRUE;
    SET error_message = '';
    
    -- Check amount limits
    IF trans_amount < 100 THEN
        SET is_valid = FALSE;
        SET error_message = 'Minimum amount is ₹100';
    ELSEIF trans_amount > max_amount THEN
        SET is_valid = FALSE;
        SET error_message = CONCAT('Maximum amount is ₹', FORMAT(max_amount, 0));
    ELSEIF trans_type = 'withdrawal' AND account_balance < trans_amount THEN
        SET is_valid = FALSE;
        SET error_message = 'Insufficient balance';
    ELSEIF daily_total + trans_amount > daily_limit THEN
        SET is_valid = FALSE;
        SET error_message = CONCAT('Daily limit of ₹', FORMAT(daily_limit, 0), ' exceeded');
    END IF;
    
END//

DELIMITER ;

-- Create events for auditing
CREATE EVENT IF NOT EXISTS log_transaction_created
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (level, message, module, function_name, extra_data)
    VALUES ('INFO', 
            CONCAT('Transaction created: ', NEW.transaction_id), 
            'database', 
            'log_transaction_created',
            JSON_OBJECT('transaction_id', NEW.id, 'amount', NEW.amount, 'type', NEW.transaction_type));
END//

CREATE EVENT IF NOT EXISTS log_transaction_completed
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO system_logs (level, message, module, function_name, extra_data)
        VALUES ('INFO', 
                CONCAT('Transaction completed: ', NEW.transaction_id), 
                'database', 
                'log_transaction_completed',
                JSON_OBJECT('transaction_id', NEW.id, 'amount', NEW.amount, 'type', NEW.transaction_type));
    END IF;
END//

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_number, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type_status ON transactions(transaction_type, status);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active, started_at);

-- Add foreign key constraints (if not already present)
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_account 
FOREIGN KEY (account_number) REFERENCES accounts(account_number) 
ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE transactions 
ADD CONSTRAINT chk_amount_positive 
CHECK (amount > 0);

ALTER TABLE accounts 
ADD CONSTRAINT chk_balance_non_negative 
CHECK (balance >= 0);

-- Show table structures
DESCRIBE accounts;
DESCRIBE transactions;
DESCRIBE challans;
DESCRIBE sessions;
DESCRIBE system_logs;

-- Sample queries for testing
-- SELECT * FROM accounts WHERE account_number = '123456789012';
-- SELECT * FROM transactions WHERE account_number = '123456789012' ORDER BY created_at DESC LIMIT 5;
-- CALL get_account_balance('123456789012', @balance);
-- SELECT @balance;

-- Performance optimization settings
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL innodb_log_file_size = 256M;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;

-- Backup and restore information
-- To backup: mysqldump -u root -p bank_challan > bank_challan_backup.sql
-- To restore: mysql -u root -p bank_challan < bank_challan_backup.sql

-- Database maintenance
-- OPTIMIZE TABLE accounts;
-- OPTIMIZE TABLE transactions;
-- OPTIMIZE TABLE challans;
-- ANALYZE TABLE accounts;

-- Security considerations
-- Create a separate user for the application with limited privileges
-- CREATE USER 'challan_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE ON bank_challan.* TO 'challan_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON bank_challan.* TO 'challan_user'@'%';
-- FLUSH PRIVILEGES;

-- Monitoring queries
-- SELECT COUNT(*) as total_transactions FROM transactions WHERE DATE(created_at) = CURDATE();
-- SELECT SUM(amount) as total_amount FROM transactions WHERE status = 'completed' AND DATE(created_at) = CURDATE();
-- SELECT COUNT(*) as active_sessions FROM sessions WHERE is_active = TRUE;
-- SELECT COUNT(*) as total_accounts FROM accounts WHERE is_active = TRUE;
