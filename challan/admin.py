"""
Admin configuration for Bank Challan Machine Application.
"""

from django.contrib import admin
from .models import Account, Transaction, Challan, Session, SystemLog, PrinterStatus, Configuration


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'account_holder_name', 'account_type', 'balance', 'is_active', 'created_at']
    list_filter = ['account_type', 'is_active', 'created_at']
    search_fields = ['account_number', 'account_holder_name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Account Information', {
            'fields': ('account_number', 'account_holder_name', 'account_type', 'balance')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'account', 'transaction_type', 'amount', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['transaction_id', 'account__account_number', 'account__account_holder_name']
    readonly_fields = ['transaction_id', 'created_at', 'updated_at', 'completed_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Transaction Information', {
            'fields': ('transaction_id', 'account', 'transaction_type', 'amount', 'description')
        }),
        ('Transfer Details', {
            'fields': ('to_account_number', 'to_account_holder_name'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'session_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Challan)
class ChallanAdmin(admin.ModelAdmin):
    list_display = ['challan_number', 'transaction', 'printed', 'print_count', 'generated_at']
    list_filter = ['printed', 'generated_at']
    search_fields = ['challan_number', 'transaction__transaction_id']
    readonly_fields = ['challan_number', 'generated_at', 'printed_at']
    ordering = ['-generated_at']
    
    fieldsets = (
        ('Challan Information', {
            'fields': ('challan_number', 'transaction', 'content')
        }),
        ('Print Status', {
            'fields': ('printed', 'print_count', 'pdf_file')
        }),
        ('Timestamps', {
            'fields': ('generated_at', 'printed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'ip_address', 'transaction_count', 'total_amount', 'is_active', 'started_at']
    list_filter = ['is_active', 'started_at']
    search_fields = ['session_id', 'ip_address']
    readonly_fields = ['session_id', 'started_at', 'last_activity', 'ended_at']
    ordering = ['-started_at']
    
    fieldsets = (
        ('Session Information', {
            'fields': ('session_id', 'ip_address', 'user_agent')
        }),
        ('Activity', {
            'fields': ('transaction_count', 'total_amount')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('started_at', 'last_activity', 'ended_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ['level', 'module', 'message', 'created_at']
    list_filter = ['level', 'module', 'created_at']
    search_fields = ['message', 'module', 'function_name']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Log Information', {
            'fields': ('level', 'module', 'function_name', 'message')
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent', 'session_id'),
            'classes': ('collapse',)
        }),
        ('Additional Data', {
            'fields': ('extra_data',),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(PrinterStatus)
class PrinterStatusAdmin(admin.ModelAdmin):
    list_display = ['printer_name', 'is_connected', 'has_paper', 'ink_level', 'last_check']
    list_filter = ['is_connected', 'has_paper', 'last_check']
    search_fields = ['printer_name']
    readonly_fields = ['last_check']
    ordering = ['-last_check']
    
    fieldsets = (
        ('Printer Information', {
            'fields': ('printer_name', 'is_connected', 'has_paper', 'ink_level')
        }),
        ('Status', {
            'fields': ('error_message',)
        }),
        ('Last Check', {
            'fields': ('last_check',)
        }),
    )


@admin.register(Configuration)
class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ['key_name', 'value', 'is_active', 'updated_at']
    list_filter = ['is_active', 'updated_at']
    search_fields = ['key_name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['key_name']
    
    fieldsets = (
        ('Configuration', {
            'fields': ('key_name', 'value', 'description')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# Customize admin site
admin.site.site_header = 'Bank Challan Machine Administration'
admin.site.site_title = 'Bank Challan Admin'
admin.site.index_title = 'Welcome to Bank Challan Machine Administration'
