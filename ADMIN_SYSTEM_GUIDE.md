# 🏆 Estocks Admin System Guide

## 🎯 **Overview**

The Estocks Admin System provides comprehensive contest management capabilities, allowing administrators to create, schedule, and manage trading contests with automatic lifecycle handling and prize distribution.

## 🔐 **Admin Access**

### **Admin Credentials**
- **Email**: `admin@estocks.com`
- **Password**: `admin123`

### **Admin Access Control**
- Admin access is controlled by email whitelist in `server/adminRoutes.ts`
- Current admin emails: `admin@estocks.com`, `capshiv@example.com`
- To add more admins, update the `adminEmails` array in the `requireAdmin` middleware

## 🚀 **Getting Started**

### **1. Setup Admin Data**
```bash
npm run admin:setup
```
This command creates:
- Admin user account
- Sample contests with different schedules
- Popular stocks for trading
- Database structure

### **2. Access Admin Panel**
1. Login with admin credentials
2. Go to Profile page
3. Click "Admin Panel" button
4. Or navigate directly to `/admin`

## 🎮 **Admin Panel Features**

### **Dashboard Overview**
- **Total Contests**: Count of all contests
- **Active Contests**: Currently running contests
- **Upcoming Contests**: Scheduled future contests
- **Completed Contests**: Finished contests
- **Total Prize Pool**: Sum of all contest prizes
- **Recent Contests**: Latest 5 contests

### **Contest Management**

#### **Create New Contest**
1. Click "Create Contest" button
2. Fill in contest details:
   - **Name**: Contest title
   - **Description**: Contest details
   - **Entry Fee**: Coins required to join
   - **Prize Pool**: Total coins to distribute
   - **Max Participants**: Maximum players allowed
   - **Start Time**: When contest begins
   - **End Time**: When contest ends
   - **Featured**: Highlight this contest
3. Click "Create Contest"

#### **Edit Contest**
1. Click edit button (pencil icon) on any contest
2. Modify contest details
3. Click "Update Contest"

#### **Delete Contest**
1. Click delete button (trash icon) on any contest
2. Confirm deletion
3. Note: Cannot delete contests with participants

#### **Contest Status Management**
- **Upcoming**: Contest is scheduled but not started
- **Active**: Contest is currently running
- **Completed**: Contest has ended
- **Cancelled**: Contest was cancelled

#### **Manual Contest Control**
- **Start Contest**: Manually start an upcoming contest
- **End Contest**: Manually end an active contest
- **Calculate Results**: Recalculate final results and rankings

### **Prize Distribution**
1. Ensure contest status is "Completed"
2. Click "Distribute Prizes" button
3. System automatically:
   - Calculates final rankings based on ROI
   - Distributes prizes to top 3 players:
     - 1st place: 50% of prize pool
     - 2nd place: 30% of prize pool
     - 3rd place: 20% of prize pool
   - Updates user coin balances
   - Shows distribution results

## ⏰ **Contest Scheduling System**

### **Automatic Scheduling**
- Contests are automatically scheduled when created
- System checks every minute for contests to start/end
- Automatic lifecycle management:
  - **Start**: Upcoming → Active
  - **End**: Active → Completed
  - **Results**: Automatic ROI calculation and ranking

### **Manual Scheduling**
- Admins can manually start/end contests
- Useful for testing or emergency situations
- Results can be recalculated manually

### **Contest Lifecycle**
```
Created → Upcoming → Active → Completed
    ↓         ↓         ↓         ↓
 Scheduled  Waiting  Running  Finished
```

## 🏆 **Contest Types Created**

### **1. Daily Tech Titans** (Featured)
- **Entry Fee**: 50 coins
- **Prize Pool**: 500 coins
- **Duration**: 24 hours
- **Focus**: Technology stocks

### **2. Flash Trading Challenge**
- **Entry Fee**: 25 coins
- **Prize Pool**: 250 coins
- **Duration**: 2 hours
- **Focus**: Quick trading

### **3. Weekly Market Masters** (Featured)
- **Entry Fee**: 100 coins
- **Prize Pool**: 1000 coins
- **Duration**: 7 days
- **Focus**: Diverse sectors

### **4. Crypto Kings**
- **Entry Fee**: 75 coins
- **Prize Pool**: 750 coins
- **Duration**: 2 days
- **Focus**: Cryptocurrency

### **5. Beginner Friendly**
- **Entry Fee**: 10 coins
- **Prize Pool**: 100 coins
- **Duration**: 24 hours
- **Focus**: Learning

## 📈 **Sample Stocks Available**

| Symbol | Company | Sector | Current Price |
|--------|---------|--------|---------------|
| AAPL | Apple Inc. | Technology | $175.50 |
| GOOGL | Alphabet Inc. | Technology | $142.80 |
| MSFT | Microsoft Corporation | Technology | $378.90 |
| TSLA | Tesla, Inc. | Automotive | $245.20 |
| AMZN | Amazon.com, Inc. | E-commerce | $155.30 |
| META | Meta Platforms, Inc. | Social Media | $485.60 |
| NVDA | NVIDIA Corporation | Semiconductors | $875.40 |
| NFLX | Netflix, Inc. | Streaming | $485.20 |

## 🔧 **API Endpoints**

### **Admin Routes** (All require admin authentication)
- `GET /api/admin/contests` - Get all contests
- `POST /api/admin/contests` - Create new contest
- `PUT /api/admin/contests/:id` - Update contest
- `DELETE /api/admin/contests/:id` - Delete contest
- `PATCH /api/admin/contests/:id/status` - Update contest status
- `GET /api/admin/contests/:id/participants` - Get contest participants
- `POST /api/admin/contests/:id/distribute-prizes` - Distribute prizes
- `GET /api/admin/dashboard` - Get dashboard stats
- `POST /api/admin/contests/:id/start` - Manually start contest
- `POST /api/admin/contests/:id/end` - Manually end contest
- `POST /api/admin/contests/:id/calculate-results` - Calculate results
- `GET /api/admin/scheduled-contests` - Get scheduled contests

## 🛠️ **Technical Implementation**

### **Contest Scheduler**
- **File**: `server/scheduler.ts`
- **Features**:
  - Automatic contest lifecycle management
  - Manual contest control
  - Result calculation and ranking
  - Prize distribution

### **Admin Routes**
- **File**: `server/adminRoutes.ts`
- **Features**:
  - CRUD operations for contests
  - Admin authentication middleware
  - Prize distribution logic
  - Dashboard statistics

### **Admin Panel UI**
- **File**: `client/src/pages/Admin.tsx`
- **Features**:
  - Contest creation and editing
  - Status management
  - Prize distribution
  - Dashboard overview

## 🎯 **Best Practices**

### **Contest Creation**
1. **Start Time**: Always set start time in the future
2. **Duration**: Consider contest length (2 hours to 7 days)
3. **Entry Fee**: Balance accessibility with engagement
4. **Prize Pool**: Make prizes attractive but sustainable
5. **Max Participants**: Set reasonable limits

### **Contest Management**
1. **Monitor Active Contests**: Check regularly for issues
2. **Timely Prize Distribution**: Distribute prizes after completion
3. **Contest Variety**: Create different types of contests
4. **Featured Contests**: Highlight important contests

### **User Experience**
1. **Clear Descriptions**: Explain contest rules clearly
2. **Reasonable Schedules**: Don't overlap too many contests
3. **Fair Prizes**: Ensure prize distribution is transparent
4. **Regular Updates**: Keep contests fresh and engaging

## 🚨 **Troubleshooting**

### **Common Issues**
1. **Contest Not Starting**: Check start time and status
2. **Prize Distribution Failed**: Ensure contest is completed
3. **Admin Access Denied**: Verify email is in admin list
4. **Contest Creation Failed**: Check validation requirements

### **Debug Commands**
```bash
# Check database tables
npm run db:check

# Verify admin data
npm run admin:setup

# Check server logs
npm run dev
```

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
- Contest participation rates
- Prize distribution success
- User engagement levels
- Contest completion rates
- Admin panel usage

### **Logs to Monitor**
- Contest lifecycle events
- Prize distribution results
- Admin actions
- Error messages

## 🔮 **Future Enhancements**

### **Planned Features**
1. **Bulk Contest Creation**: Create multiple contests at once
2. **Contest Templates**: Save and reuse contest configurations
3. **Advanced Analytics**: Detailed contest performance metrics
4. **Automated Notifications**: Email/SMS alerts for contest events
5. **Contest Categories**: Organize contests by type/sector
6. **User Management**: Admin tools for user management
7. **Stock Management**: Add/edit/remove stocks from admin panel

---

## 🎉 **Ready to Go!**

Your Estocks admin system is now fully set up and ready to manage contests! The system provides:

✅ **Complete contest lifecycle management**  
✅ **Automatic scheduling and execution**  
✅ **Prize distribution system**  
✅ **Admin panel with full CRUD operations**  
✅ **Sample data for immediate testing**  
✅ **Comprehensive API endpoints**  

Start by logging in with the admin credentials and exploring the admin panel to create your first contest!
