"""
Test cases for Bank Challan Machine Application.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import json

from .models import Account, Transaction, Challan, Session, SystemLog
from .utils import validate_account_number, validate_amount, format_currency


class AccountModelTests(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            account_number='123456789012',
            account_holder_name='John Doe',
            account_type='savings',
            balance=Decimal('10000.00')
        )
    
    def test_account_creation(self):
        self.assertEqual(self.account.account_number, '123456789012')
        self.assertEqual(self.account.account_holder_name, 'John Doe')
        self.assertEqual(self.account.account_type, 'savings')
        self.assertEqual(self.account.balance, Decimal('10000.00'))
        self.assertTrue(self.account.is_active)
    
    def test_formatted_account_number(self):
        formatted = self.account.get_formatted_account_number()
        self.assertEqual(formatted, '1234 5678 9012')
    
    def test_account_str(self):
        expected = '123456789012 - John Doe'
        self.assertEqual(str(self.account), expected)


class TransactionModelTests(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            account_number='123456789012',
            account_holder_name='John Doe',
            account_type='savings',
            balance=Decimal('10000.00')
        )
        
        self.transaction = Transaction.objects.create(
            account=self.account,
            transaction_type='deposit',
            amount=Decimal('5000.00'),
            description='Test deposit'
        )
    
    def test_transaction_creation(self):
        self.assertEqual(self.transaction.account, self.account)
        self.assertEqual(self.transaction.transaction_type, 'deposit')
        self.assertEqual(self.transaction.amount, Decimal('5000.00'))
        self.assertEqual(self.transaction.status, 'pending')
    
    def test_transaction_id_generation(self):
        self.assertTrue(self.transaction.transaction_id.startswith('TXN'))
        self.assertEqual(len(self.transaction.transaction_id), 20)
    
    def test_formatted_amount(self):
        formatted = self.transaction.get_formatted_amount()
        self.assertEqual(formatted, '₹5,000.00')
    
    def test_formatted_date(self):
        formatted = self.transaction.get_formatted_date()
        self.assertIsInstance(formatted, str)
    
    def test_transaction_str(self):
        expected = f'{self.transaction.transaction_id} - Deposit - ₹5,000.00'
        self.assertEqual(str(self.transaction), expected)


class ChallanModelTests(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            account_number='123456789012',
            account_holder_name='John Doe',
            account_type='savings',
            balance=Decimal('10000.00')
        )
        
        self.transaction = Transaction.objects.create(
            account=self.account,
            transaction_type='deposit',
            amount=Decimal('5000.00'),
            description='Test deposit'
        )
        
        self.challan = Challan.objects.create(
            transaction=self.transaction,
            content='Test challan content'
        )
    
    def test_challan_creation(self):
        self.assertEqual(self.challan.transaction, self.transaction)
        self.assertEqual(self.challan.content, 'Test challan content')
        self.assertFalse(self.challan.printed)
        self.assertEqual(self.challan.print_count, 0)
    
    def test_challan_number_generation(self):
        self.assertTrue(self.challan.challan_number.startswith('CH'))
        self.assertEqual(len(self.challan.challan_number), 20)
    
    def test_mark_printed(self):
        self.challan.mark_printed()
        self.assertTrue(self.challan.printed)
        self.assertEqual(self.challan.print_count, 1)
        self.assertIsNotNone(self.challan.printed_at)
    
    def test_challan_str(self):
        expected = f'{self.challan.challan_number} - {self.transaction.transaction_id}'
        self.assertEqual(str(self.challan), expected)


class SessionModelTests(TestCase):
    def setUp(self):
        self.session = Session.objects.create(
            session_id='TEST_SESSION_123',
            ip_address='127.0.0.1',
            user_agent='Test Browser'
        )
    
    def test_session_creation(self):
        self.assertEqual(self.session.session_id, 'TEST_SESSION_123')
        self.assertEqual(self.session.ip_address, '127.0.0.1')
        self.assertEqual(self.session.user_agent, 'Test Browser')
        self.assertTrue(self.session.is_active)
        self.assertEqual(self.session.transaction_count, 0)
        self.assertEqual(self.session.total_amount, Decimal('0.00'))
    
    def test_end_session(self):
        self.session.end_session()
        self.assertFalse(self.session.is_active)
        self.assertIsNotNone(self.session.ended_at)
    
    def test_add_transaction(self):
        self.session.add_transaction(Decimal('1000.00'))
        self.assertEqual(self.session.transaction_count, 1)
        self.assertEqual(self.session.total_amount, Decimal('1000.00'))
    
    def test_session_str(self):
        expected = 'TEST_SESSION_123 - ' + self.session.started_at.strftime('%Y-%m-%d %H:%M')
        self.assertEqual(str(self.session), expected)


class UtilsTests(TestCase):
    def test_validate_account_number_valid(self):
        self.assertTrue(validate_account_number('123456789012'))
        self.assertTrue(validate_account_number('1234 5678 9012'))
    
    def test_validate_account_number_invalid(self):
        self.assertFalse(validate_account_number('12345678901'))  # 11 digits
        self.assertFalse(validate_account_number('1234567890123'))  # 13 digits
        self.assertFalse(validate_account_number('abcd1234efgh'))  # contains letters
    
    def test_validate_amount_valid(self):
        self.assertTrue(validate_amount('100'))
        self.assertTrue(validate_amount('1000.50'))
        self.assertTrue(validate_amount('500000'))
    
    def test_validate_amount_invalid(self):
        self.assertFalse(validate_amount('0'))
        self.assertFalse(validate_amount('-100'))
        self.assertFalse(validate_amount('abc'))
        self.assertFalse(validate_amount('1000001'))  # Over limit
    
    def test_format_currency(self):
        self.assertEqual(format_currency(1000), '₹1,000.00')
        self.assertEqual(format_currency(1000.50), '₹1,000.50')
        self.assertEqual(format_currency(100000), '₹100,000.00')


class ViewTests(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            account_number='123456789012',
            account_holder_name='John Doe',
            account_type='savings',
            balance=Decimal('10000.00')
        )
    
    def test_validate_account_view_valid(self):
        response = self.client.get('/api/transaction/validate/?account_number=123456789012')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['account_number'], '123456789012')
    
    def test_validate_account_view_invalid(self):
        response = self.client.get('/api/transaction/validate/?account_number=123456789013')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
    
    def test_validate_account_view_invalid_format(self):
        response = self.client.get('/api/transaction/validate/?account_number=12345678901')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertFalse(data['success'])
    
    def test_create_transaction_view_valid(self):
        data = {
            'transaction_type': 'deposit',
            'account_number': '123456789012',
            'account_holder_name': 'John Doe',
            'amount': '1000.00',
            'description': 'Test deposit'
        }
        response = self.client.post('/api/transaction/create/', 
                                 data=json.dumps(data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(response_data['success'])
        self.assertIn('transaction_id', response_data['data'])
    
    def test_create_transaction_view_invalid_amount(self):
        data = {
            'transaction_type': 'deposit',
            'account_number': '123456789012',
            'account_holder_name': 'John Doe',
            'amount': '-1000.00'
        }
        response = self.client.post('/api/transaction/create/', 
                                 data=json.dumps(data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertFalse(response_data['success'])
    
    def test_system_status_view(self):
        response = self.client.get('/api/system/status/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertIn('database_status', data['data'])
        self.assertIn('total_transactions', data['data'])


class IntegrationTests(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            account_number='123456789012',
            account_holder_name='John Doe',
            account_type='savings',
            balance=Decimal('10000.00')
        )
    
    def test_complete_transaction_flow(self):
        # 1. Create session
        response = self.client.post('/api/session/create/')
        self.assertEqual(response.status_code, 200)
        session_data = json.loads(response.content)
        session_id = session_data['data']['session_id']
        
        # 2. Create transaction
        transaction_data = {
            'transaction_type': 'deposit',
            'account_number': '123456789012',
            'account_holder_name': 'John Doe',
            'amount': '5000.00',
            'description': 'Test deposit',
            'session_id': session_id
        }
        response = self.client.post('/api/transaction/create/', 
                                 data=json.dumps(transaction_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        transaction_data = json.loads(response.content)
        transaction_id = transaction_data['data']['transaction_id']
        
        # 3. Generate challan
        challan_data = {'transaction_id': transaction_id}
        response = self.client.post('/api/challan/generate/', 
                                 data=json.dumps(challan_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        challan_data = json.loads(response.content)
        challan_number = challan_data['data']['challan_number']
        
        # 4. Print challan
        print_data = {'challan_number': challan_number}
        response = self.client.post('/api/challan/print/', 
                                 data=json.dumps(print_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # 5. End session
        end_data = {'session_id': session_id}
        response = self.client.post('/api/session/end/', 
                                 data=json.dumps(end_data),
                                 content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        # Verify everything was created correctly
        self.assertTrue(Transaction.objects.filter(transaction_id=transaction_id).exists())
        self.assertTrue(Challan.objects.filter(challan_number=challan_number).exists())
        
        transaction = Transaction.objects.get(transaction_id=transaction_id)
        self.assertEqual(transaction.status, 'completed')
        
        challan = Challan.objects.get(challan_number=challan_number)
        self.assertTrue(challan.printed)
        self.assertEqual(challan.print_count, 1)


class PerformanceTests(TestCase):
    def test_account_creation_performance(self):
        import time
        start_time = time.time()
        
        for i in range(100):
            Account.objects.create(
                account_number=f'{i:012d}',
                account_holder_name=f'Test User {i}',
                account_type='savings',
                balance=Decimal('1000.00')
            )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should create 100 accounts in less than 1 second
        self.assertLess(duration, 1.0)
    
    def test_transaction_creation_performance(self):
        account = Account.objects.create(
            account_number='123456789012',
            account_holder_name='Test User',
            account_type='savings',
            balance=Decimal('10000.00')
        )
        
        import time
        start_time = time.time()
        
        for i in range(100):
            Transaction.objects.create(
                account=account,
                transaction_type='deposit',
                amount=Decimal('100.00'),
                description=f'Test transaction {i}'
            )
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should create 100 transactions in less than 1 second
        self.assertLess(duration, 1.0)
