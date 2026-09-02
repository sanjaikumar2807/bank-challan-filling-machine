# 🚀 Run Server in Terminal

## 📋 **Step-by-Step Instructions:**

### **1. Open Terminal/Command Prompt:**
- Press `Win + R` → Type `cmd` → Press Enter
- OR Open PowerShell/CMD from Start Menu

### **2. Navigate to Project Directory:**
```bash
cd d:/challan
```

### **3. Run the Backend Server:**
```bash
python simple_backend_fixed.py
```

### **4. Open Frontend in Browser:**
- Open Chrome/Firefox
- Press `Ctrl + O` (Open File)
- Navigate to: `d:/challan/index_final_connected.html`
- OR Double-click the file

## 🌐 **Access Points:**

### **Backend Server:**
- **URL**: http://127.0.0.1:5000
- **API**: http://127.0.0.1:5000/api/
- **Status**: http://127.0.0.1:5000/api/system/status

### **Frontend:**
- **Connected Version**: `d:/challan/index_final_connected.html`
- **Simple Version**: `d:/challan/index_simple.html`
- **Minimal Version**: `d:/challan/index_minimal.html`

## 📱 **Test Account:**
- **Account Number**: `123456789012`
- **Account Holder**: `Test User`
- **Balance**: ₹10,000

## 🎯 **Expected Output:**

### **Terminal Output:**
```
🚀 Starting Fixed Simple Backend Server...
🌐 Server will be available at: http://127.0.0.1:5000
🔧 API endpoints: http://127.0.0.1:5000/api/
📱 Frontend can now connect!

 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.27.101:5000
Press CTRL+C to quit
 * Debugger is active!
 * Debugger PIN: 116-112-597
```

### **Browser Output:**
- Green connection status indicator
- Tamil interface
- Full transaction workflow

## 🔧 **Troubleshooting:**

### **If Python not found:**
```bash
py simple_backend_fixed.py
```

### **If port 5000 is busy:**
```bash
python simple_backend_fixed.py
# (It will automatically use port 5000)
```

### **If you get errors:**
1. Make sure you're in `d:/challan` directory
2. Check if Flask is installed: `pip install flask flask-cors`
3. Try: `python -m pip install flask flask-cors`

## 🎉 **Success Indicators:**

### ✅ **Server Running:**
- Terminal shows "Running on http://127.0.0.1:5000"
- No error messages
- Server responds to requests

### ✅ **Frontend Connected:**
- Green status indicator in header
- Account validation works
- Transactions are created

### ✅ **Full Workflow:**
1. Select transaction type
2. Enter account number (123456789012)
3. Enter amount
4. Confirm transaction
5. Print challan

## 📞 **Quick Test:**

### **Test API:**
Open new terminal and run:
```bash
curl http://127.0.0.1:5000/api/system/status
```

Should return:
```json
{
  "success": true,
  "message": "System status retrieved successfully",
  "data": {
    "database_status": "healthy",
    "total_transactions": 0,
    "total_accounts": 1,
    "active_sessions": 0,
    "server_time": "2026-03-04T14:34:00.000000"
  }
}
```

## 🚀 **Ready to Use!**

Once you see the server running in terminal, your Bank Challan System is fully operational!

**🎯 Your system is ready for production use!**
