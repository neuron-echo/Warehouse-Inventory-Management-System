-- =====================================================
-- WAREHOUSE INVENTORY MANAGEMENT SYSTEM
-- Complete Database Setup Script with Indian Data
-- =====================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS warehouse_inventory;
CREATE DATABASE warehouse_inventory;
USE warehouse_inventory;

-- =====================================================
-- TABLE CREATION
-- =====================================================

-- Customer Table
CREATE TABLE Customer (
  CustomerID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  ContactNo VARCHAR(20) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_email (Email),
  INDEX idx_customer_name (Name)
);

-- Supplier Table
CREATE TABLE Supplier (
  SupplierID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  ContactNo VARCHAR(20) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Address TEXT NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_supplier_email (Email),
  INDEX idx_supplier_name (Name)
);

-- Employee Table
CREATE TABLE Employee (
  EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Role ENUM('Manager', 'Staff', 'Admin') NOT NULL,
  ContactNo VARCHAR(20) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  LastLogin TIMESTAMP NULL,
  Status ENUM('Active', 'Inactive') DEFAULT 'Active',
  INDEX idx_employee_email (Email),
  INDEX idx_employee_role (Role),
  INDEX idx_employee_status (Status)
);

-- Warehouse Table
CREATE TABLE Warehouse (
  WarehouseID INT AUTO_INCREMENT PRIMARY KEY,
  Location VARCHAR(100) NOT NULL UNIQUE,
  Capacity INT NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_warehouse_location (Location)
);

-- Item Table (with composite key)
CREATE TABLE Item (
  ItemID INT NOT NULL,
  WarehouseID INT NOT NULL,
  SupplierID INT NOT NULL,
  Name VARCHAR(100) NOT NULL,
  Category VARCHAR(50) NOT NULL,
  Price DECIMAL(10, 2) NOT NULL,
  StockQuantity INT DEFAULT 0,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ItemID, WarehouseID),
  FOREIGN KEY (WarehouseID) REFERENCES Warehouse(WarehouseID) ON DELETE CASCADE,
  FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID) ON DELETE RESTRICT,
  INDEX idx_item_name (Name),
  INDEX idx_item_category (Category),
  INDEX idx_item_supplier (SupplierID)
);

-- Transaction Table
CREATE TABLE transactions_table (
  TransactionID INT AUTO_INCREMENT PRIMARY KEY,
  TransactionType ENUM('IN', 'OUT') NOT NULL,
  ItemID INT NOT NULL,
  WarehouseID INT NOT NULL,
  Quantity INT NOT NULL,
  Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  EmployeeID INT NOT NULL,
  CustomerID INT NULL,
  SupplierID INT NULL,
  FOREIGN KEY (ItemID, WarehouseID) REFERENCES Item(ItemID, WarehouseID) ON DELETE RESTRICT,
  FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID) ON DELETE RESTRICT,
  FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID) ON DELETE SET NULL,
  FOREIGN KEY (SupplierID) REFERENCES Supplier(SupplierID) ON DELETE SET NULL,
  INDEX idx_transaction_type (TransactionType),
  INDEX idx_transaction_date (Date),
  INDEX idx_transaction_employee (EmployeeID)
);

SELECT 'Tables created successfully!' as Status;
SHOW TABLES;

-- =====================================================
-- SAMPLE DATA INSERTION - INDIAN CONTEXT
-- =====================================================

-- Sample Customers (Indian Companies)
INSERT INTO Customer (Name, ContactNo, Email, Password) VALUES
('Reliance Retail', '+91-9876543210', 'contact@relianceretail.in', 'reliance123'),
('Tata Digital', '+91-9876543211', 'sales@tatadigital.in', 'tata123'),
('Flipkart India', '+91-9876543212', 'procurement@flipkart.com', 'flipkart123'),
('Amazon India', '+91-9876543213', 'vendor@amazon.in', 'amazon123'),
('BigBasket', '+91-9876543214', 'hello@bigbasket.com', 'bigbasket123');

-- Sample Suppliers (Indian Suppliers)
INSERT INTO Supplier (Name, ContactNo, Email, Address) VALUES
('Mumbai Electronics Ltd', '+91-9123456780', 'vendor@mumbaielectronics.in', 'Andheri East, Mumbai, Maharashtra 400069'),
('Delhi Industrial Parts', '+91-9123456781', 'sales@delhiparts.in', 'Okhla Industrial Area, New Delhi 110020'),
('Bangalore Components', '+91-9123456782', 'support@blrcomponents.in', 'Whitefield, Bangalore, Karnataka 560066'),
('Pune Premium Materials', '+91-9123456783', 'orders@punematerials.in', 'Hinjewadi, Pune, Maharashtra 411057'),
('Chennai Distributors', '+91-9123456784', 'vendor@chennaidistr.in', 'Guindy, Chennai, Tamil Nadu 600032');

-- Sample Employees (Indian Names)
INSERT INTO Employee (Name, Role, ContactNo, Email, Password, Status) VALUES
('Rajesh Kumar', 'Manager', '+91-9988776655', 'rajesh.kumar@warehouse.in', 'rajesh123', 'Active'),
('Priya Sharma', 'Staff', '+91-9988776656', 'priya.sharma@warehouse.in', 'priya123', 'Active'),
('Amit Patel', 'Admin', '+91-9988776657', 'amit.patel@warehouse.in', 'amit123', 'Active'),
('Sneha Reddy', 'Staff', '+91-9988776658', 'sneha.reddy@warehouse.in', 'sneha123', 'Active'),
('Vikram Singh', 'Manager', '+91-9988776659', 'vikram.singh@warehouse.in', 'vikram123', 'Active');

-- Sample Warehouses (Indian Cities)
INSERT INTO Warehouse (Location, Capacity) VALUES
('Mumbai Central Warehouse', 10000),
('Delhi NCR Hub', 8000),
('Bangalore Tech Park', 6000),
('Hyderabad Distribution Center', 7000),
('Chennai Port Facility', 5000);

-- Sample Items (Indian context with INR pricing)
INSERT INTO Item (ItemID, WarehouseID, SupplierID, Name, Category, Price, StockQuantity) VALUES
(1, 1, 1, 'Samsung Laptop', 'Electronics', 45999.00, 50),
(1, 2, 1, 'Samsung Laptop', 'Electronics', 45999.00, 35),
(1, 3, 1, 'Samsung Laptop', 'Electronics', 45999.00, 40),
(2, 1, 1, 'LED Monitor', 'Electronics', 12999.00, 120),
(2, 2, 1, 'LED Monitor', 'Electronics', 12999.00, 85),
(3, 1, 2, 'Steel Rod', 'Materials', 850.00, 500),
(3, 4, 2, 'Steel Rod', 'Materials', 850.00, 300),
(4, 1, 3, 'Circuit Board', 'Components', 2500.00, 400),
(4, 5, 3, 'Circuit Board', 'Components', 2500.00, 250),
(5, 1, 4, 'Cardboard Box', 'Supplies', 35.00, 3000),
(6, 2, 2, 'Aluminum Sheet', 'Materials', 650.00, 200),
(7, 2, 5, 'Shipping Labels', 'Supplies', 5.00, 8000),
(8, 3, 3, 'LED Bulb', 'Electronics', 199.00, 500),
(9, 3, 4, 'Safety Helmet', 'Equipment', 450.00, 300),
(10, 3, 5, 'Packing Tape', 'Supplies', 75.00, 1500),
(11, 4, 2, 'Bolt Set', 'Components', 120.00, 1000),
(12, 4, 3, 'Copper Wire', 'Components', 850.00, 600),
(13, 5, 4, 'Work Gloves', 'Equipment', 150.00, 800),
(14, 5, 5, 'Plastic Container', 'Equipment', 280.00, 400);

-- Sample Transactions
INSERT INTO transactions_table (TransactionType, ItemID, WarehouseID, Quantity, EmployeeID, CustomerID, SupplierID) VALUES
('IN', 1, 1, 30, 1, NULL, 1),
('OUT', 1, 1, 8, 2, 1, NULL),
('IN', 3, 1, 100, 3, NULL, 2),
('OUT', 2, 1, 15, 2, 2, NULL),
('IN', 4, 1, 150, 1, NULL, 3),
('OUT', 1, 2, 5, 4, 3, NULL),
('IN', 7, 2, 2000, 3, NULL, 5),
('OUT', 8, 3, 75, 2, 1, NULL),
('IN', 9, 3, 50, 1, NULL, 4),
('OUT', 1, 3, 3, 2, 4, NULL),
('IN', 11, 4, 300, 3, NULL, 2),
('OUT', 13, 5, 25, 4, 5, NULL),
('IN', 2, 1, 100, 1, NULL, 1),
('OUT', 4, 5, 12, 2, 2, NULL),
('IN', 5, 1, 1000, 3, NULL, 4);

SELECT 'Sample data inserted successfully!' as Status;

-- =====================================================
-- ESSENTIAL TRIGGER
-- =====================================================

DELIMITER $$
CREATE TRIGGER prevent_negative_stock
BEFORE INSERT ON transactions_table
FOR EACH ROW
BEGIN
  DECLARE current_stock INT;
  
  IF NEW.TransactionType = 'OUT' THEN
    SELECT StockQuantity INTO current_stock
    FROM Item
    WHERE ItemID = NEW.ItemID AND WarehouseID = NEW.WarehouseID;
    
    IF current_stock < NEW.Quantity THEN
      SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Insufficient stock for OUT transaction';
    END IF;
  END IF;
END$$
DELIMITER ;

SELECT 'Trigger created successfully!' as Status;
SELECT 'Database setup complete!' as Status;
