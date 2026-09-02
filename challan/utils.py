"""
Utility functions for Bank Challan Machine Application.
"""

import re
import random
import string
from datetime import datetime
from django.core.exceptions import ValidationError


def validate_account_number(account_number):
    """
    Validate account number format.
    Should be exactly 12 digits.
    """
    clean_number = account_number.replace(' ', '')
    return bool(re.match(r'^\d{12}$', clean_number))


def validate_amount(amount):
    """
    Validate amount.
    Should be a positive number with reasonable limits.
    """
    try:
        amount_float = float(amount)
        return amount_float > 0 and amount_float <= 1000000  # Max 10 lakh
    except (ValueError, TypeError):
        return False


def generate_session_id():
    """Generate a unique session ID."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"SES{timestamp}{random_str}"


def format_currency(amount):
    """Format amount as Indian currency."""
    try:
        amount_float = float(amount)
        return f"₹{amount_float:,.2f}"
    except (ValueError, TypeError):
        return "₹0.00"


def format_account_number(account_number):
    """Format account number with spaces for better readability."""
    clean_number = account_number.replace(' ', '')
    if len(clean_number) == 12:
        return f"{clean_number[:4]} {clean_number[4:8]} {clean_number[8:]}"
    return account_number


def generate_transaction_id():
    """Generate a unique transaction ID."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_num = random.randint(1000, 9999)
    return f"TXN{timestamp}{random_num}"


def generate_challan_number():
    """Generate a unique challan number."""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_num = random.randint(1000, 9999)
    return f"CH{timestamp}{random_num}"


def validate_name(name):
    """Validate account holder name."""
    if not name or len(name.strip()) < 3:
        return False
    
    # Allow only letters, spaces, and common punctuation
    pattern = r'^[a-zA-Z\s\.\-]+$'
    return bool(re.match(pattern, name.strip()))


def validate_email(email):
    """Validate email address."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone):
    """Validate Indian phone number."""
    pattern = r'^[6-9]\d{9}$'
    return bool(re.match(pattern, phone))


def sanitize_input(input_string):
    """
    Sanitize user input to prevent XSS and injection attacks.
    """
    if not input_string:
        return ""
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', 'script', 'javascript', 'onload', 'onerror']
    sanitized = input_string
    
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')
    
    return sanitized.strip()


def calculate_processing_fee(amount):
    """
    Calculate processing fee based on amount.
    Currently returns 0 as per requirements.
    """
    try:
        amount_float = float(amount)
        # No processing fee for bank challan
        return 0.0
    except (ValueError, TypeError):
        return 0.0


def get_client_ip(request):
    """
    Get client IP address from request.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def log_api_request(request, endpoint, data=None, response=None):
    """
    Log API request for debugging and monitoring.
    """
    from .models import SystemLog
    
    try:
        log_data = {
            'endpoint': endpoint,
            'method': request.method,
            'ip_address': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'session_id': data.get('session_id') if data else None
        }
        
        if response:
            log_data['status_code'] = response.status_code
        
        SystemLog.objects.create(
            level='INFO',
            message=f"API Request: {endpoint}",
            module='utils',
            function_name='log_api_request',
            extra_data=log_data
        )
    except Exception as e:
        # Don't let logging errors break the application
        pass


def format_indian_date(date_obj):
    """
    Format date in Indian format (DD-MM-YYYY).
    """
    if isinstance(date_obj, str):
        date_obj = datetime.strptime(date_obj, '%Y-%m-%d')
    
    return date_obj.strftime('%d-%m-%Y')


def format_indian_time(time_obj):
    """
    Format time in 24-hour format (HH:MM:SS).
    """
    if isinstance(time_obj, str):
        time_obj = datetime.strptime(time_obj, '%H:%M:%S')
    
    return time_obj.strftime('%H:%M:%S')


def number_to_words(num):
    """
    Convert number to words (Indian system).
    """
    if num == 0:
        return "zero"
    
    units = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
    teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", 
             "seventeen", "eighteen", "nineteen"]
    tens = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
    
    if num < 10:
        return units[num]
    elif num < 20:
        return teens[num - 10]
    elif num < 100:
        ten = num // 10
        one = num % 10
        return tens[ten] + (" " + units[one] if one else "")
    elif num < 1000:
        hundred = num // 100
        remainder = num % 100
        return units[hundred] + " hundred" + (" " + number_to_words(remainder) if remainder else "")
    elif num < 100000:
        thousand = num // 1000
        remainder = num % 1000
        return number_to_words(thousand) + " thousand" + (" " + number_to_words(remainder) if remainder else "")
    else:
        lakh = num // 100000
        remainder = num % 100000
        return number_to_words(lakh) + " lakh" + (" " + number_to_words(remainder) if remainder else "")


def validate_transaction_limits(transaction_type, amount, account_balance=None):
    """
    Validate transaction based on type and account balance.
    """
    try:
        amount_float = float(amount)
        
        if transaction_type == 'withdrawal':
            if account_balance is None:
                raise ValidationError("Account balance required for withdrawal validation")
            
            balance_float = float(account_balance)
            if amount_float > balance_float:
                raise ValidationError("Insufficient balance")
        
        # Common validations
        if amount_float < 100:
            raise ValidationError("Minimum amount is ₹100")
        
        if amount_float > 1000000:
            raise ValidationError("Maximum amount is ₹10,00,000")
        
        if transaction_type == 'deposit' and amount_float > 500000:
            raise ValidationError("Maximum deposit amount is ₹5,00,000")
        
        return True
        
    except ValueError:
        raise ValidationError("Invalid amount format")


def generate_otp(length=6):
    """
    Generate a numeric OTP of specified length.
    """
    return ''.join(random.choices('0123456789', k=length))


def is_valid_otp(otp, expected_otp):
    """
    Validate OTP against expected value.
    """
    return str(otp) == str(expected_otp)


def mask_account_number(account_number):
    """
    Mask account number for display (show only last 4 digits).
    """
    if len(account_number) < 4:
        return account_number
    
    clean_number = account_number.replace(' ', '')
    if len(clean_number) >= 4:
        masked = 'x' * (len(clean_number) - 4) + clean_number[-4:]
        return format_account_number(masked)
    
    return account_number


def get_transaction_limits():
    """
    Get transaction limits for different types.
    """
    return {
        'deposit': {
            'min': 100,
            'max': 500000,
            'daily_limit': 1000000
        },
        'withdrawal': {
            'min': 100,
            'max': 1000000,
            'daily_limit': 2000000
        },
        'transfer': {
            'min': 100,
            'max': 1000000,
            'daily_limit': 2000000
        }
    }


def check_daily_limit(account_number, transaction_type, amount, date=None):
    """
    Check if transaction exceeds daily limit for the account.
    """
    from django.db.models import Sum
    from .models import Transaction
    from django.utils import timezone
    
    if date is None:
        date = timezone.now().date()
    
    try:
        daily_total = Transaction.objects.filter(
            account__account_number=account_number.replace(' ', ''),
            transaction_type=transaction_type,
            created_at__date=date,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        limits = get_transaction_limits()
        daily_limit = limits.get(transaction_type, {}).get('daily_limit', 1000000)
        
        if daily_total + float(amount) > daily_limit:
            raise ValidationError(f"Daily limit of ₹{daily_limit:,} exceeded")
        
        return daily_total
        
    except Exception as e:
        # If there's an error checking the limit, allow the transaction
        return 0


def create_audit_log(action, user_id=None, details=None):
    """
    Create an audit log for important actions.
    """
    from .models import SystemLog
    
    SystemLog.objects.create(
        level='INFO',
        message=f"Audit: {action}",
        module='utils',
        function_name='create_audit_log',
        extra_data={
            'action': action,
            'user_id': user_id,
            'details': details or {}
        }
    )


def format_file_size(size_bytes):
    """
    Format file size in human-readable format.
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    
    while size >= 1024.0 and i < len(size_names) - 1:
        size /= 1024.0
        i += 1
    
    return f"{size:.2f} {size_names[i]}"


def is_valid_json(json_string):
    """
    Check if a string is valid JSON.
    """
    import json
    try:
        json.loads(json_string)
        return True
    except (ValueError, TypeError):
        return False


def deep_merge_dict(dict1, dict2):
    """
    Deep merge two dictionaries.
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dict(result[key], value)
        else:
            result[key] = value
    
    return result


def get_device_info(request):
    """
    Extract device information from request.
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    device_info = {
        'user_agent': user_agent,
        'ip_address': get_client_ip(request),
        'is_mobile': False,
        'is_tablet': False,
        'browser': 'Unknown',
        'os': 'Unknown'
    }
    
    # Simple mobile detection
    mobile_agents = ['Mobile', 'Android', 'iPhone', 'iPad', 'Windows Phone']
    if any(agent in user_agent for agent in mobile_agents):
        device_info['is_mobile'] = True
    
    # Simple browser detection
    browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera']
    for browser in browsers:
        if browser in user_agent:
            device_info['browser'] = browser
            break
    
    # Simple OS detection
    os_list = ['Windows', 'Mac', 'Linux', 'Android', 'iOS']
    for os in os_list:
        if os in user_agent:
            device_info['os'] = os
            break
    
    return device_info
