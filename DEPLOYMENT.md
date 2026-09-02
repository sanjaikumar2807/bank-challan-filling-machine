# Bank Challan Machine - Deployment Guide

This guide provides step-by-step instructions for deploying the Bank Challan Machine application in various environments.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL 5.7+ or MariaDB 10.2+
- Modern web browser
- Camera and microphone access (for scanner and voice features)

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd bank-challan-machine
   ```

2. **Set Up Python Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set Up Database**
   ```bash
   mysql -u root -p < database_setup.sql
   ```

4. **Configure Django Settings**
   ```bash
   cp bank_challan/settings.py.example bank_challan/settings.py
   # Edit database credentials in settings.py
   ```

5. **Run Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create Superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start Development Server**
   ```bash
   python manage.py runserver
   ```

8. **Access Application**
   - Frontend: http://localhost:8000
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and Start Services**
   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

3. **Create Superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

4. **Access Application**
   - Frontend: http://localhost
   - API: http://localhost/api/
   - Admin: http://localhost/admin/

### Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute commands in backend
docker-compose exec backend bash

# Restart services
docker-compose restart
```

## 🌐 Production Deployment

### Ubuntu/Debian Server Setup

1. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx mysql-server
   ```

2. **Set Up MySQL**
   ```bash
   sudo mysql_secure_installation
   mysql -u root -p < database_setup.sql
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <repository-url> /var/www/bank-challan
   cd /var/www/bank-challan
   
   # Set up virtual environment
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Configure settings
   cp bank_challan/settings.py.example bank_challan/settings.py
   # Edit database credentials and production settings
   
   # Run migrations
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   ```

4. **Configure Gunicorn**
   ```bash
   # Create gunicorn service file
   sudo nano /etc/systemd/system/bank-challan.service
   ```

   ```ini
   [Unit]
   Description=Bank Challan Machine
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/bank-challan
   Environment="PATH=/var/www/bank-challan/venv/bin"
   ExecStart=/var/www/bank-challan/venv/bin/gunicorn --workers 3 --bind unix:/var/www/bank-challan/bank-challan.sock bank_challan.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   # Enable and start service
   sudo systemctl enable bank-challan
   sudo systemctl start bank-challan
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/bank-challan
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /var/www/bank-challan;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://unix:/var/www/bank-challan/bank-challan.sock;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       location /static/ {
           alias /var/www/bank-challan/static/;
       }

       location /media/ {
           alias /var/www/bank-challan/media/;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/bank-challan /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_NAME=bank_challan
DATABASE_USER=challan_user
DATABASE_PASSWORD=secure_password
DATABASE_HOST=localhost
DATABASE_PORT=3306

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,your-domain.com

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```

### Database Configuration

```python
# bank_challan/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DATABASE_NAME', 'bank_challan'),
        'USER': os.getenv('DATABASE_USER', 'root'),
        'PASSWORD': os.getenv('DATABASE_PASSWORD', 'password'),
        'HOST': os.getenv('DATABASE_HOST', 'localhost'),
        'PORT': os.getenv('DATABASE_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}
```

### Security Settings

```python
# Production security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'DENY'
```

## 🔍 Monitoring and Logging

### Application Logs

```bash
# View Django logs
tail -f /var/log/bank-challan/django.log

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Application health check
curl http://localhost/api/system/status/

# Service status
sudo systemctl status bank-challan
sudo systemctl status nginx
```

### Performance Monitoring

```bash
# Monitor resource usage
htop
iostat -x 1
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup
mysqldump -u root -p bank_challan > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p bank_challan < backup_20231201_120000.sql
```

### Application Backup

```bash
# Backup application files
tar -czf bank_challan_backup_$(date +%Y%m%d).tar.gz /var/www/bank-challan

# Backup media files
tar -czf media_backup_$(date +%Y%m%d).tar.gz /var/www/bank-challan/media
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   
   # Check database exists
   mysql -u root -p -e "SHOW DATABASES;"
   ```

2. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R www-data:www-data /var/www/bank-challan
   sudo chmod -R 755 /var/www/bank-challan
   ```

3. **Static Files Not Loading**
   ```bash
   # Collect static files
   python manage.py collectstatic --noinput
   
   # Check Nginx configuration
   sudo nginx -t
   ```

4. **Service Not Starting**
   ```bash
   # Check service logs
   sudo journalctl -u bank-challan -f
   
   # Restart service
   sudo systemctl restart bank-challan
   ```

### Debug Mode

Enable debug mode for troubleshooting:

```python
# bank_challan/settings.py
DEBUG = True
ALLOWED_HOSTS = ['*']
```

## 📱 Kiosk Mode Setup

### Chrome Kiosk Mode

```bash
# Launch Chrome in kiosk mode
google-chrome --kiosk --disable-infobars --no-first-run http://localhost
```

### Firefox Kiosk Mode

```bash
# Launch Firefox in kiosk mode
firefox --kiosk http://localhost
```

### Auto-start Configuration

```bash
# Create auto-start script
sudo nano /etc/xdg/autostart/bank-challan.desktop
```

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=Bank Challan Machine
Exec=google-chrome --kiosk --disable-infobars http://localhost
```

## 🔒 SSL/TLS Setup

### Let's Encrypt Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Configuration

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/bank-challan.key \
    -out /etc/ssl/certs/bank-challan.crt
```

## 📊 Performance Optimization

### Database Optimization

```sql
-- Optimize MySQL
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL innodb_log_file_size = 256M;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
```

### Application Optimization

```python
# Enable caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### Nginx Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🎯 Production Checklist

- [ ] Database configured and secured
- [ ] Environment variables set
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured
- [ ] Backup procedures implemented
- [ ] Monitoring and logging set up
- [ ] Performance optimization applied
- [ ] Security hardening completed
- [ ] User testing performed
- [ ] Documentation updated

## 📞 Support

For deployment issues and support:
- Check application logs for errors
- Review configuration files
- Test database connectivity
- Verify service status
- Consult troubleshooting section

---

**Note**: Always test deployments in a staging environment before production deployment.
