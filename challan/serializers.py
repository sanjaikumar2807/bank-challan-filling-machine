"""
Serializers for Bank Challan Machine Application.
"""

from rest_framework import serializers
from .models import Transaction, Challan, Account, Session


class AccountSerializer(serializers.ModelSerializer):
    """Serializer for Account model."""
    
    formatted_account_number = serializers.ReadOnlyField()
    
    class Meta:
        model = Account
        fields = [
            'account_number',
            'formatted_account_number',
            'account_holder_name',
            'account_type',
            'balance',
            'is_active',
            'created_at',
            'updated_at'
        ]


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model."""
    
    account_details = AccountSerializer(source='account', read_only=True)
    formatted_amount = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = [
            'id',
            'transaction_id',
            'account',
            'account_details',
            'transaction_type',
            'amount',
            'formatted_amount',
            'description',
            'status',
            'to_account_number',
            'to_account_holder_name',
            'created_at',
            'formatted_date',
            'updated_at',
            'completed_at',
            'ip_address',
            'session_id'
        ]
        read_only_fields = [
            'id',
            'transaction_id',
            'created_at',
            'updated_at',
            'completed_at'
        ]
    
    def get_formatted_amount(self, obj):
        return f"₹{obj.amount:,.2f}"
    
    def get_formatted_date(self, obj):
        return obj.created_at.strftime('%d-%m-%Y %H:%M:%S')


class ChallanSerializer(serializers.ModelSerializer):
    """Serializer for Challan model."""
    
    transaction_details = TransactionSerializer(source='transaction', read_only=True)
    
    class Meta:
        model = Challan
        fields = [
            'id',
            'challan_number',
            'transaction',
            'transaction_details',
            'content',
            'printed',
            'print_count',
            'generated_at',
            'printed_at'
        ]
        read_only_fields = [
            'id',
            'challan_number',
            'generated_at',
            'printed_at'
        ]


class SessionSerializer(serializers.ModelSerializer):
    """Serializer for Session model."""
    
    class Meta:
        model = Session
        fields = [
            'session_id',
            'ip_address',
            'started_at',
            'last_activity',
            'ended_at',
            'is_active',
            'transaction_count',
            'total_amount'
        ]
        read_only_fields = [
            'session_id',
            'started_at',
            'last_activity',
            'ended_at'
        ]
