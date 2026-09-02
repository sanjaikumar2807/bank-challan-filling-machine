"""
Models for Bank Challan Machine Application.
"""

from django.db import models
from django.utils import timezone
import uuid


class Account(models.Model):
    """Account model for storing account information."""
    
    account_number = models.CharField(max_length=12, unique=True, db_index=True)
    account_holder_name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=20, choices=[
        ('savings', 'Savings'),
        ('current', 'Current'),
        ('fixed_deposit', 'Fixed Deposit'),
        ('recurring_deposit', 'Recurring Deposit'),
    ])
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.account_number} - {self.account_holder_name}"
    
    def get_formatted_account_number(self):
        """Return account number formatted with spaces."""
        clean_number = self.account_number.replace(' ', '')
        if len(clean_number) == 12:
            return f"{clean_number[:4]} {clean_number[4:8]} {clean_number[8:]}"
        return self.account_number


class Transaction(models.Model):
    """Transaction model for storing transaction records."""
    
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('transfer', 'Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.CharField(max_length=20, unique=True, db_index=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # For transfers
    to_account_number = models.CharField(max_length=12, blank=True, null=True)
    to_account_holder_name = models.CharField(max_length=100, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional fields
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['account', 'created_at']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_type']),
        ]
    
    def __str__(self):
        return f"{self.transaction_id} - {self.get_transaction_type_display()} - ₹{self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = self.generate_transaction_id()
        super().save(*args, **kwargs)
    
    def generate_transaction_id(self):
        """Generate unique transaction ID."""
        import random
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        return f"TXN{timestamp}{random_num}"
    
    def get_formatted_amount(self):
        """Return formatted amount with Indian rupee symbol."""
        return f"₹{self.amount:,.2f}"
    
    def get_formatted_date(self):
        """Return formatted date."""
        return self.created_at.strftime('%d-%m-%Y %H:%M:%S')


class Challan(models.Model):
    """Challan model for storing generated challan records."""
    
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='challan')
    challan_number = models.CharField(max_length=20, unique=True, db_index=True)
    pdf_file = models.FileField(upload_to='challans/pdf/', null=True, blank=True)
    printed = models.BooleanField(default=False)
    print_count = models.PositiveIntegerField(default=0)
    
    # Challan content
    content = models.TextField()
    
    # Timestamps
    generated_at = models.DateTimeField(auto_now_add=True)
    printed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'challans'
        verbose_name = 'Challan'
        verbose_name_plural = 'Challans'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['challan_number']),
            models.Index(fields=['generated_at']),
        ]
    
    def __str__(self):
        return f"{self.challan_number} - {self.transaction.transaction_id}"
    
    def save(self, *args, **kwargs):
        if not self.challan_number:
            self.challan_number = self.generate_challan_number()
        super().save(*args, **kwargs)
    
    def generate_challan_number(self):
        """Generate unique challan number."""
        import random
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        return f"CH{timestamp}{random_num}"
    
    def mark_printed(self):
        """Mark challan as printed and update print count."""
        self.printed = True
        self.printed_at = timezone.now()
        self.print_count += 1
        self.save(update_fields=['printed', 'printed_at', 'print_count'])


class Session(models.Model):
    """Session model for tracking user sessions."""
    
    session_id = models.CharField(max_length=100, unique=True, db_index=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Session data
    transaction_count = models.PositiveIntegerField(default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    class Meta:
        db_table = 'sessions'
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['session_id']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        return f"{self.session_id} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def end_session(self):
        """End the current session."""
        self.is_active = False
        self.ended_at = timezone.now()
        self.save(update_fields=['is_active', 'ended_at'])
    
    def update_activity(self):
        """Update last activity timestamp."""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def add_transaction(self, amount):
        """Add transaction to session statistics."""
        self.transaction_count += 1
        self.total_amount += amount
        self.save(update_fields=['transaction_count', 'total_amount'])


class SystemLog(models.Model):
    """System log for tracking application events."""
    
    LOG_LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    level = models.CharField(max_length=10, choices=LOG_LEVELS)
    message = models.TextField()
    module = models.CharField(max_length=50)
    function_name = models.CharField(max_length=100, blank=True)
    
    # Request information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    
    # Additional data
    extra_data = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_logs'
        verbose_name = 'System Log'
        verbose_name_plural = 'System Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['level']),
            models.Index(fields=['module']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.level} - {self.module} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class PrinterStatus(models.Model):
    """Printer status for tracking thermal printer availability."""
    
    printer_name = models.CharField(max_length=100)
    is_connected = models.BooleanField(default=False)
    has_paper = models.BooleanField(default=True)
    ink_level = models.PositiveIntegerField(default=100)  # Not applicable for thermal
    last_check = models.DateTimeField(auto_now=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'printer_status'
        verbose_name = 'Printer Status'
        verbose_name_plural = 'Printer Status'
    
    def __str__(self):
        return f"{self.printer_name} - {'Connected' if self.is_connected else 'Disconnected'}"
    
    def update_status(self, connected, has_paper=True, error_message=''):
        """Update printer status."""
        self.is_connected = connected
        self.has_paper = has_paper
        self.error_message = error_message
        self.save(update_fields=['is_connected', 'has_paper', 'error_message', 'last_check'])


class Configuration(models.Model):
    """Configuration model for storing system settings."""
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configurations'
        verbose_name = 'Configuration'
        verbose_name_plural = 'Configurations'
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    @classmethod
    def get_value(cls, key, default=None):
        """Get configuration value."""
        try:
            config = cls.objects.get(key=key, is_active=True)
            return config.value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_value(cls, key, value, description=''):
        """Set configuration value."""
        config, created = cls.objects.update_or_create(
            key=key,
            defaults={
                'value': value,
                'description': description,
                'is_active': True
            }
        )
        
        if not created:
            config.value = value
            config.description = description
            config.save(update_fields=['value', 'description', 'updated_at'])
