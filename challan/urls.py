"""
URL configuration for challan application.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Transaction endpoints
    path('transaction/create/', views.create_transaction, name='create_transaction'),
    path('transaction/validate/', views.validate_account, name='validate_account'),
    path('transaction/history/', views.get_transaction_history, name='get_transaction_history'),
    
    # Challan endpoints
    path('challan/generate/', views.generate_challan, name='generate_challan'),
    path('challan/print/', views.print_challan, name='print_challan'),
    
    # Session endpoints
    path('session/create/', views.create_session, name='create_session'),
    path('session/end/', views.end_session, name='end_session'),
    
    # System endpoints
    path('system/printer/', views.get_printer_status, name='get_printer_status'),
    path('system/status/', views.system_status, name='system_status'),
]
