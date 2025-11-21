# Warehouse Inventory Management System

A comprehensive full-stack web application for managing warehouse inventory operations with role-based access control, real-time analytics, and advanced database features.


## ✨ Features

### Core Functionality
- **Multi-Warehouse Management** - Track inventory across multiple warehouse locations
- **Role-Based Access Control** - Admin, Employee, and Customer roles with different permissions
- **Real-Time Inventory Tracking** - Monitor stock quantities with automatic updates
- **Transaction Management** - Record IN/OUT transactions with full audit trail
- **Search & Filter** - Quick item search by name and category across all user roles
- **Stock Transfer** - Move inventory between warehouses with automated logging
- **Low Stock Alerts** - Automatic alerts when items fall below threshold

### Analytics & Reporting
- **Warehouse Inventory Value** - Calculate total value per warehouse
- **Supplier Performance** - Track supplier metrics and total supplied value
- **Employee Transaction Summary** - View employee performance statistics
- **Custom Inventory Reports** - Generate detailed reports with stock status indicators

### Advanced Database Features
- **5 Stored Procedures** - Automated business logic for complex operations
- **3 Custom Functions** - Reusable calculations for warehouse value, stock totals, and low stock checks
- **1 Trigger** - Automatic validation to prevent negative stock
- **Complex Joins** - Multi-table queries for comprehensive data retrieval
- **Aggregate Queries** - SUM, COUNT, AVG, MAX functions for analytics

## 🛠 Tech Stack

### Frontend
- **React.js** - Component-based UI library
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API requests
- **CSS3** - Custom styling with responsive design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **mysql2** - MySQL client with Promise support
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management

### Database
- **MySQL 8.0+** - Relational database management system

## 🗄 Database Schema

### Tables (6)
1. **Customer** - Customer information and credentials
2. **Supplier** - Supplier details with contact information
3. **Employee** - Employee data with role-based access
4. **Warehouse** - Warehouse locations and capacity
5. **Item** - Inventory items with composite key (ItemID + WarehouseID)
6. **transactions_table** - Transaction history with IN/OUT types

### Relationships
- Supplier → Item (1:N)
- Warehouse → Item (1:N)
- Employee → Transaction (1:N)
- Customer → Transaction (1:N, optional)
- Supplier → Transaction (1:N, optional)

## 📦 Installation

### Prerequisites
- Node.js (v20.18.0 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn package manager

### Step 1: Clone the Repository
```bash
git clone https://github.com/vinod-45-vinod/Warehouse-Inventory-Management-System.git
cd Warehouse-Inventory-Management-System
```

### Step 2: Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Execute schema file
mysql -u root -p < database/schema_new.sql

# Install stored procedures and functions
mysql -u root -p warehouse_inventory < database/procedures.sql
```

**Alternative (PowerShell):**
```powershell
Get-Content database\schema_new.sql | mysql -u root -p
Get-Content database\procedures.sql | mysql -u root -p warehouse_inventory
```

### Step 3: Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=warehouse_inventory
PORT=5000
```

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install
```

## ⚙ Configuration

### Backend Configuration
Edit `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=warehouse_inventory
PORT=5000
```

### Frontend Configuration
API base URL is set in component files. Update if backend runs on different port:
```javascript
const API_URL = 'http://localhost:5000/api';
```

## 🚀 Usage

### Start Backend Server
```bash
cd backend
node server.js
```
Server runs on `http://localhost:5000`

### Start Frontend Application
```bash
cd frontend
npm start
```
Application opens at `http://localhost:3000`

### Access the Application
1. Open browser to `http://localhost:3000`
2. Login with default credentials (see below)
3. Navigate using sidebar menu based on role

## 🔌 API Endpoints

### Authentication
- `POST /api/login` - User login

### CRUD Operations
- **Customers:** GET, POST, PUT, DELETE `/api/customers`
- **Suppliers:** GET, POST, PUT, DELETE `/api/suppliers`
- **Employees:** GET, POST, PUT, DELETE `/api/employees`
- **Warehouses:** GET, POST, PUT, DELETE `/api/warehouses`
- **Items:** GET, POST, PUT, DELETE `/api/items`
- **Transactions:** GET, POST, DELETE `/api/transactions`

### Analytics
- `GET /api/analytics/inventory-value` - Warehouse inventory values
- `GET /api/analytics/supplier-performance` - Supplier metrics
- `GET /api/analytics/low-stock/:threshold` - Low stock alerts
- `GET /api/analytics/top-supplier` - Best performing supplier

### Stored Procedures
- `POST /api/procedures/add-item` - Add/update item with stock
- `POST /api/procedures/transfer-stock` - Transfer between warehouses
- `POST /api/procedures/update-prices` - Bulk price update by category
- `GET /api/procedures/inventory-report/:warehouseId?` - Generate inventory report
- `GET /api/procedures/employee-summary/:employeeId?` - Employee transaction summary

### Functions
- `GET /api/functions/warehouse-value/:warehouseId` - Get warehouse total value
- `GET /api/functions/total-stock/:itemId` - Get item stock across all warehouses
- `GET /api/functions/check-low-stock/:itemId/:warehouseId/:threshold` - Check if stock is low

## 🎯 Database Features

### Stored Procedures
1. **AddItemAndUpdateStock** - Insert new item or update existing stock with validation
2. **TransferStock** - Move inventory between warehouses with automatic transaction logging
3. **UpdatePricesByCategory** - Bulk update prices by percentage for specific category
4. **GenerateInventoryReport** - Detailed report with stock status (Low/Medium/Good)
5. **GetEmployeeTransactionSummary** - Performance metrics with IN/OUT counts

### Functions
1. **GetWarehouseValue(warehouseId)** - Calculate total inventory value
2. **GetTotalItemStock(itemId)** - Sum stock across all warehouses
3. **IsLowStock(itemId, warehouseId, threshold)** - Boolean check for restock

### Trigger
1. **prevent_negative_stock** - BEFORE INSERT validation to prevent OUT transactions when stock is insufficient

### Query Types Implemented
- ✅ CREATE - All 6 tables with constraints
- ✅ INSERT - Sample data for all entities
- ✅ TRIGGERS - Stock validation
- ✅ PROCEDURES/FUNCTIONS - 5 procedures + 3 functions
- ✅ NESTED QUERIES - 4 nested queries for validation and lookups
- ✅ JOIN QUERIES - 6 complex joins with multiple tables
- ✅ AGGREGATE QUERIES - SUM, COUNT, AVG, MAX operations

## 🔐 Default Credentials

### Admin Access
```
Email: admin@gmail.com
Password: admin123
```

### Employee Access
```
Email: rajesh.kumar@warehouse.in
Password: rajesh123
```

### Customer Access
```
Email: hello@bigbasket.com
Password: bigbasket123
```

## 📁 Project Structure

```
dbms/
├── backend/
│   ├── server.js           # Express server with all API endpoints
│   ├── index.js            # Server entry point
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables (create this)
├── database/
│   ├── schema.sql          # Original database schema
│   ├── schema_new.sql      # Complete schema with Indian sample data
│   ├── procedures.sql      # All stored procedures and functions
│   └── schema_backup.sql   # Backup schema
├── frontend/
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components (CRUDForm, Sidebar, etc.)
│   │   ├── pages/          # Page components (Dashboard, Items, etc.)
│   │   ├── styles/         # CSS stylesheets
│   │   ├── context/        # React context (Theme)
│   │   ├── App.js          # Main application component
│   │   └── index.js        # React entry point
│   └── package.json        # Frontend dependencies
├── API_DOCUMENTATION.md    # Complete REST API documentation
├── QUERY_LIST.md          # Query usage documentation
├── PROJECT_REPORT.md      # Comprehensive project report
└── README.md              # This file
```

## 📸 Screenshots

### Login Page
User authentication with role selection (Admin/Employee/Customer)

### Admin Dashboard
- Warehouse inventory value summary
- Low stock alerts with threshold filtering
- Supplier performance metrics
- Inventory report generation with warehouse selection
- Employee transaction summary

### Items Management
- CRUD operations for items
- Search functionality by name
- Category filter dropdown
- Real-time stock updates
- Composite key handling (ItemID + WarehouseID)

### Procedures Page (Admin Only)
- Transfer stock between warehouses
- Bulk price updates by category
- Generate custom inventory reports
- View employee performance summaries

### Responsive Design
Mobile and tablet friendly interface with collapsible sidebar

## 👥 Contributors

- **Vinod G R** 
- **Vikas S** 


## 📄 License

This project is created for educational purposes as part of Database Management System (DBMS) course.

## 🤝 Support

For questions or issues, please contact:
- Email: vinodgr2005@gmail.com
- GitHub Issues: https://github.com/vinod-45-vinod/Warehouse-Inventory-Management-System/issues

---

**Built with ❤️ using React, Node.js, and MySQL**
