"""
Views for Bank Challan Machine Application.
"""

from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from django.conf import settings
import json
import logging
import uuid

from .models import Account, Transaction, Challan, Session, SystemLog, PrinterStatus
from .serializers import TransactionSerializer, ChallanSerializer
from .utils import validate_account_number, validate_amount, generate_session_id

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def create_transaction(request):
    """Create a new transaction."""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['transaction_type', 'account_number', 'account_holder_name', 'amount']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'{field} is required'
                }, status=400)
        
        # Validate data
        if not validate_account_number(data['account_number']):
            return JsonResponse({
                'success': False,
                'error': 'Invalid account number format'
            }, status=400)
        
        if not validate_amount(data['amount']):
            return JsonResponse({
                'success': False,
                'error': 'Invalid amount'
            }, status=400)
        
        # Get or create account
        account, created = Account.objects.get_or_create(
            account_number=data['account_number'].replace(' ', ''),
            defaults={
                'account_holder_name': data['account_holder_name'],
                'account_type': 'savings'  # Default type
            }
        )
        
        if not created:
            # Update account holder name if different
            if account.account_holder_name != data['account_holder_name']:
                account.account_holder_name = data['account_holder_name']
                account.save()
        
        # Create transaction
        with transaction.atomic():
            transaction_obj = Transaction.objects.create(
                account=account,
                transaction_type=data['transaction_type'],
                amount=data['amount'],
                description=data.get('description', ''),
                to_account_number=data.get('to_account_number', ''),
                to_account_holder_name=data.get('to_account_holder_name', ''),
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                session_id=data.get('session_id', '')
            )
            
            # Update account balance for deposits and withdrawals
            if data['transaction_type'] == 'deposit':
                account.balance += data['amount']
            elif data['transaction_type'] == 'withdrawal':
                if account.balance >= data['amount']:
                    account.balance -= data['amount']
                else:
                    return JsonResponse({
                        'success': False,
                        'error': 'Insufficient balance'
                    }, status=400)
            
            account.save()
            
            # Update session
            if data.get('session_id'):
                session_obj, _ = Session.objects.get_or_create(
                    session_id=data['session_id'],
                    defaults={
                        'ip_address': get_client_ip(request),
                        'user_agent': request.META.get('HTTP_USER_AGENT', '')
                    }
                )
                session_obj.add_transaction(data['amount'])
            
            # Log transaction
            SystemLog.objects.create(
                level='INFO',
                message=f'Transaction created: {transaction_obj.transaction_id}',
                module='views',
                function_name='create_transaction',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                session_id=data.get('session_id', ''),
                extra_data={
                    'transaction_id': str(transaction_obj.id),
                    'amount': str(data['amount']),
                    'type': data['transaction_type']
                }
            )
            
            return JsonResponse({
                'success': True,
                'data': {
                    'transaction_id': transaction_obj.transaction_id,
                    'id': str(transaction_obj.id),
                    'status': transaction_obj.status,
                    'created_at': transaction_obj.created_at.isoformat(),
                    'account_balance': float(account.balance)
                }
            })
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
        SystemLog.objects.create(
            level='ERROR',
            message=f'Error creating transaction: {str(e)}',
            module='views',
            function_name='create_transaction',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            extra_data={'error': str(e)}
        )
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def generate_challan(request):
    """Generate challan for a transaction."""
    try:
        data = json.loads(request.body)
        
        transaction_id = data.get('transaction_id')
        if not transaction_id:
            return JsonResponse({
                'success': False,
                'error': 'Transaction ID is required'
            }, status=400)
        
        # Get transaction
        try:
            transaction_obj = Transaction.objects.get(transaction_id=transaction_id)
        except Transaction.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Transaction not found'
            }, status=404)
        
        # Check if challan already exists
        if hasattr(transaction_obj, 'challan'):
            return JsonResponse({
                'success': False,
                'error': 'Challan already generated for this transaction'
            }, status=400)
        
        # Generate challan content
        challan_content = generate_challan_content(transaction_obj)
        
        # Create challan
        with transaction.atomic():
            challan_obj = Challan.objects.create(
                transaction=transaction_obj,
                content=challan_content
            )
            
            # Update transaction status
            transaction_obj.status = 'completed'
            transaction_obj.completed_at = timezone.now()
            transaction_obj.save(update_fields=['status', 'completed_at'])
            
            # Log challan generation
            SystemLog.objects.create(
                level='INFO',
                message=f'Challan generated: {challan_obj.challan_number}',
                module='views',
                function_name='generate_challan',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                session_id=data.get('session_id', ''),
                extra_data={
                    'challan_number': challan_obj.challan_number,
                    'transaction_id': transaction_id
                }
            )
            
            return JsonResponse({
                'success': True,
                'data': {
                    'challan_number': challan_obj.challan_number,
                    'content': challan_content,
                    'generated_at': challan_obj.generated_at.isoformat()
                }
            })
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error generating challan: {str(e)}")
        SystemLog.objects.create(
            level='ERROR',
            message=f'Error generating challan: {str(e)}',
            module='views',
            function_name='generate_challan',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            extra_data={'error': str(e)}
        )
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def print_challan(request):
    """Mark challan as printed."""
    try:
        data = json.loads(request.body)
        
        challan_number = data.get('challan_number')
        if not challan_number:
            return JsonResponse({
                'success': False,
                'error': 'Challan number is required'
            }, status=400)
        
        # Get challan
        try:
            challan_obj = Challan.objects.get(challan_number=challan_number)
        except Challan.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Challan not found'
            }, status=404)
        
        # Mark as printed
        challan_obj.mark_printed()
        
        # Update printer status
        printer_status, _ = PrinterStatus.objects.get_or_create(
            printer_name='Thermal Printer',
            defaults={
                'is_connected': True,
                'has_paper': True
            }
        )
        
        # Log print action
        SystemLog.objects.create(
            level='INFO',
            message=f'Challan printed: {challan_obj.challan_number}',
            module='views',
            function_name='print_challan',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            session_id=data.get('session_id', ''),
            extra_data={
                'challan_number': challan_number,
                'print_count': challan_obj.print_count
            }
        )
        
        return JsonResponse({
            'success': True,
            'data': {
                'challan_number': challan_obj.challan_number,
                'print_count': challan_obj.print_count,
                'printed_at': challan_obj.printed_at.isoformat() if challan_obj.printed_at else None
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error printing challan: {str(e)}")
        SystemLog.objects.create(
            level='ERROR',
            message=f'Error printing challan: {str(e)}',
            module='views',
            function_name='print_challan',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            extra_data={'error': str(e)}
        )
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["GET"])
def validate_account(request):
    """Validate account number and return account details."""
    try:
        account_number = request.GET.get('account_number')
        if not account_number:
            return JsonResponse({
                'success': False,
                'error': 'Account number is required'
            }, status=400)
        
        # Clean account number
        clean_number = account_number.replace(' ', '')
        
        if not validate_account_number(clean_number):
            return JsonResponse({
                'success': False,
                'error': 'Invalid account number format'
            }, status=400)
        
        # Check if account exists
        try:
            account = Account.objects.get(account_number=clean_number)
            
            return JsonResponse({
                'success': True,
                'data': {
                    'account_number': account.account_number,
                    'account_holder_name': account.account_holder_name,
                    'account_type': account.account_type,
                    'balance': float(account.balance),
                    'is_active': account.is_active
                }
            })
            
        except Account.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Account not found'
            }, status=404)
            
    except Exception as e:
        logger.error(f"Error validating account: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["GET"])
def get_transaction_history(request):
    """Get transaction history for an account."""
    try:
        account_number = request.GET.get('account_number')
        if not account_number:
            return JsonResponse({
                'success': False,
                'error': 'Account number is required'
            }, status=400)
        
        # Clean account number
        clean_number = account_number.replace(' ', '')
        
        # Get transactions
        transactions = Transaction.objects.filter(
            account__account_number=clean_number
        ).order_by('-created_at')[:10]  # Last 10 transactions
        
        serializer = TransactionSerializer(transactions, many=True)
        
        return JsonResponse({
            'success': True,
            'data': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error getting transaction history: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["POST"])
def create_session(request):
    """Create a new user session."""
    try:
        session_id = generate_session_id()
        
        session_obj = Session.objects.create(
            session_id=session_id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return JsonResponse({
            'success': True,
            'data': {
                'session_id': session_id,
                'started_at': session_obj.started_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["POST"])
def end_session(request):
    """End a user session."""
    try:
        data = json.loads(request.body)
        session_id = data.get('session_id')
        
        if not session_id:
            return JsonResponse({
                'success': False,
                'error': 'Session ID is required'
            }, status=400)
        
        try:
            session_obj = Session.objects.get(session_id=session_id)
            session_obj.end_session()
            
            return JsonResponse({
                'success': True,
                'data': {
                    'session_id': session_id,
                    'ended_at': session_obj.ended_at.isoformat(),
                    'transaction_count': session_obj.transaction_count,
                    'total_amount': float(session_obj.total_amount)
                }
            })
            
        except Session.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Session not found'
            }, status=404)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["GET"])
def get_printer_status(request):
    """Get current printer status."""
    try:
        printer_status, created = PrinterStatus.objects.get_or_create(
            printer_name='Thermal Printer',
            defaults={
                'is_connected': True,
                'has_paper': True
            }
        )
        
        return JsonResponse({
            'success': True,
            'data': {
                'printer_name': printer_status.printer_name,
                'is_connected': printer_status.is_connected,
                'has_paper': printer_status.has_paper,
                'ink_level': printer_status.ink_level,
                'last_check': printer_status.last_check.isoformat(),
                'error_message': printer_status.error_message
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting printer status: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


@require_http_methods(["GET"])
def system_status(request):
    """Get system status and health check."""
    try:
        from django.db import connection
        
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = cursor.fetchone() is not None
        
        # Get system stats
        total_transactions = Transaction.objects.count()
        active_sessions = Session.objects.filter(is_active=True).count()
        
        return JsonResponse({
            'success': True,
            'data': {
                'database_status': db_status,
                'total_transactions': total_transactions,
                'active_sessions': active_sessions,
                'server_time': timezone.now().isoformat(),
                'version': '1.0.0'
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)


# Utility functions
def get_client_ip(request):
    """Get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def generate_challan_content(transaction):
    """Generate challan content."""
    date = transaction.created_at
    formatted_date = date.strftime('%d-%m-%Y')
    formatted_time = date.strftime('%H:%M:%S')
    formatted_account = transaction.account.get_formatted_account_number()
    
    content = f"""
BANK CHALLAN RECEIPT
Official Bank Document
Challan No: {transaction.challan.challan_number if hasattr(transaction, 'challan') else 'TEMP'}

TRANSACTION DETAILS
Type: {transaction.get_transaction_type_display()}
Date: {formatted_date}
Time: {formatted_time}

ACCOUNT INFORMATION
Account No: {formatted_account}
Account Holder: {transaction.account.account_holder_name}

AMOUNT DETAILS
Principal: ₹{transaction.amount:,.2f}
Processing Fee: ₹0.00
TOTAL AMOUNT: ₹{transaction.amount:,.2f}

Transaction ID: {transaction.transaction_id}

This is a computer-generated challan
No signature required
For queries: 1800-123-4567
    """.strip()
    
    return content


# Error handlers
def handler404(request, exception):
    return JsonResponse({
        'success': False,
        'error': 'API endpoint not found'
    }, status=404)


def handler500(request):
    return JsonResponse({
        'success': False,
        'error': 'Internal server error'
    }, status=500)
