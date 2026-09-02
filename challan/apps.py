"""
Django app configuration for challan application.
"""

from django.apps import AppConfig


class ChallanConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'challan'
    verbose_name = 'Bank Challan Machine'
    
    def ready(self):
        """
        App initialization code.
        """
        import logging
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        logger = logging.getLogger(__name__)
        logger.info('Bank Challan Machine app is ready')
