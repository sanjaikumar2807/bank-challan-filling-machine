# 🚀 Quick Start Guide - Bank Challan System

## ✅ **Current Status:**
- Backend setup: ✅ Complete
- Database: ✅ MySQL configured and connected
- Frontend: ✅ Multiple versions ready
- Server: ✅ Ready to start

## 🎯 **Quick Start Commands:**

### **Option 1: Start Server (Recommended)**
```bash
cd d:/challan
python manage.py runserver 0.0.0.0:8000
```

### **Option 2: Use SQLite (No MySQL needed)**
```bash
cd d:/challan
set DJANGO_SETTINGS_MODULE=bank_challan_system.settings_sqlite
python manage.py runserver
```

## 🌐 **Access Points:**

### **Frontend (Choose any):**
- `file:///d:/challan/index.html` - Full version
- `file:///d:/challan/index_simple.html` - Simple Tamil version
- `file:///d:/challan/index_minimal.html` - Minimal features
- `file:///d:/challan/index_atm.html` - ATM style
- `file:///d:/challan/index_7inch.html` - 7-inch LCD version

### **Backend API:**
- `http://127.0.0.1:8000/api/` - API endpoints
- `http://127.0.0.1:8000/admin/` - Django admin

## 🔧 **API Endpoints Available:**

### **Transaction:**
- `POST /api/transaction/create/` - Create transaction
- `GET /api/transaction/validate/?account_number=123456789012` - Validate account
- `GET /api/transaction/history/?account_number=123456789012` - Get history

### **Challan:**
- `POST /api/challan/generate/` - Generate challan
- `POST /api/challan/print/` - Print challan

### **Session:**
- `POST /api/session/create/` - Create session
- `POST /api/session/end/` - End session

### **System:**
- `GET /api/system/status/` - System health
- `GET /api/system/printer/` - Printer status

## 🎯 **Test API:**

### **Quick Test (curl):**
```bash
# Test system status
curl http://127.0.0.1:8000/api/system/status/

# Test account validation
curl "http://127.0.0.1:8000/api/transaction/validate/?account_number=123456789012"

# Create transaction
curl -X POST http://127.0.0.1:8000/api/transaction/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "deposit",
    "account_number": "123456789012",
    "account_holder_name": "Test User",
    "amount": "1000"
  }'
```

## 🛠️ **Troubleshooting:**

### **If MySQL fails:**
```bash
# Use SQLite instead
set DJANGO_SETTINGS_MODULE=bank_challan_system.settings_sqlite
python manage.py runserver
```

### **If port 8000 is busy:**
```bash
# Use different port
python manage.py runserver 0.0.0.0:8001
```

### **If migrations fail:**
```bash
# Reset migrations
python manage.py migrate --fake-initial
```

## 📱 **Frontend Testing:**

### **Open any HTML file in browser:**
1. Open Chrome/Firefox
2. Press `Ctrl+O` (Open File)
3. Navigate to `d:/challan/`
4. Choose any HTML file:
   - `index.html` - Full featured
   - `index_simple.html` - Tamil interface
   - `index_minimal.html` - Minimal features
   - `index_atm.html` - ATM style
   - `index_7inch.html` - 7-inch display

## 🎉 **Ready to Use:**

Your Bank Challan System is now fully operational! 🚀

### **Next Steps:**
1. Start the server
2. Open frontend in browser
3. Test transactions
4. Print challans
5. Monitor via admin panel

**All systems are GO!** 🎯
