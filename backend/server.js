// server.js - Express Backend
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'warehouse_inventory',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and user type are required'
      });
    }

    let user;
    let tableName;
    let idField;
    let role;

    // Determine which table to query based on user type
    if (userType === 'admin') {
      // Check for hardcoded admin account
      if (email === 'admin@gmail.com' && password === 'admin123') {
        return res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: 0,
            name: 'Administrator',
            email: 'admin@gmail.com',
            role: 'admin',
            userType: 'admin'
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }
    } else if (userType === 'customer') {
      tableName = 'Customer';
      idField = 'CustomerID';
    } else if (userType === 'employee') {
      tableName = 'Employee';
      idField = 'EmployeeID';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be admin, customer, or employee'
      });
    }

    // Query user from database (skip for admin since it's hardcoded)
    const [users] = await pool.query(
      `SELECT ${idField} as id, Name, Email, Password${userType === 'employee' ? ', Role' : ''} 
       FROM ${tableName} 
       WHERE Email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    user = users[0];

    // Simple password comparison (plain text for now as per your request)
    // In production, use bcrypt.compare(password, user.Password)
    if (password !== user.Password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // For employees, check their role
    if (userType === 'employee') {
      role = user.Role ? user.Role.toLowerCase() : 'staff';
    } else {
      role = 'customer';
    }

    // Return success with user info
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.Name,
        email: user.Email,
        role: role,
        userType: userType
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// CRUD operations for customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Customer ORDER BY CustomerID');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ 
      error: 'Failed to fetch customers',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { Name, ContactNo, Email, Password } = req.body;
    
    // Validation
    if (!Name || !ContactNo || !Email || !Password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'ContactNo', 'Email', 'Password']
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Customer (Name, ContactNo, Email, Password) VALUES (?, ?, ?, ?)',
      [Name, ContactNo, Email, Password]
    );

    res.status(201).json({
      message: 'Customer created successfully',
      customerId: result.insertId,
      customer: { Name, ContactNo, Email }
    });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ 
      error: 'Failed to create customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { Name, ContactNo, Email, Password } = req.body;
    const { id } = req.params;

    if (!Name || !ContactNo || !Email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'ContactNo', 'Email']
      });
    }

    // If Password is provided, update it; otherwise, keep the existing password
    let query, params;
    if (Password && Password.trim() !== '') {
      query = 'UPDATE Customer SET Name = ?, ContactNo = ?, Email = ?, Password = ? WHERE CustomerID = ?';
      params = [Name, ContactNo, Email, Password, id];
    } else {
      query = 'UPDATE Customer SET Name = ?, ContactNo = ?, Email = ? WHERE CustomerID = ?';
      params = [Name, ContactNo, Email, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      message: 'Customer updated successfully',
      customerId: id
    });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ 
      error: 'Failed to update customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM Customer WHERE CustomerID = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      message: 'Customer deleted successfully',
      customerId: id
    });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ 
      error: 'Failed to delete customer',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Warehouse routes
app.get('/api/warehouses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Warehouse ORDER BY WarehouseID');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching warehouses:', err);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { Location, Capacity } = req.body;
    if (!Location || !Capacity) {
      return res.status(400).json({ error: 'Location and Capacity are required' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO Warehouse (Location, Capacity) VALUES (?, ?)',
      [Location, Capacity]
    );
    
    res.status(201).json({ 
      message: 'Warehouse created successfully',
      warehouseId: result.insertId 
    });
  } catch (err) {
    console.error('Error creating warehouse:', err);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

app.put('/api/warehouses/:id', async (req, res) => {
  try {
    const { Location, Capacity } = req.body;
    const { id } = req.params;
    
    const [result] = await pool.query(
      'UPDATE Warehouse SET Location = ?, Capacity = ? WHERE WarehouseID = ?',
      [Location, Capacity, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json({ message: 'Warehouse updated successfully' });
  } catch (err) {
    console.error('Error updating warehouse:', err);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM Warehouse WHERE WarehouseID = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (err) {
    console.error('Error deleting warehouse:', err);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

// Employee routes
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Employee ORDER BY EmployeeID');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ 
      error: 'Failed to fetch employees',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { Name, Role, ContactNo, Email, Password } = req.body;
    
    if (!Name || !Role || !ContactNo || !Email || !Password) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'Role', 'ContactNo', 'Email', 'Password']
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Employee (Name, Role, ContactNo, Email, Password) VALUES (?, ?, ?, ?, ?)',
      [Name, Role, ContactNo, Email, Password]
    );

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId: result.insertId,
      employee: { Name, Role, ContactNo, Email }
    });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ 
      error: 'Failed to create employee',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const { Name, Role, ContactNo, Email, Password } = req.body;
    const { id } = req.params;
    
    if (!Name || !Role || !ContactNo || !Email) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'Role', 'ContactNo', 'Email']
      });
    }

    // Validate role
    if (!['Manager', 'Staff', 'Admin'].includes(Role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be Manager, Staff, or Admin'
      });
    }

    // Check if email is being changed to one that already exists
    const [existing] = await pool.query(
      'SELECT EmployeeID FROM Employee WHERE Email = ? AND EmployeeID != ?',
      [Email, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Email already exists for another employee' 
      });
    }

    // If Password is provided, update it; otherwise, keep the existing password
    let query, params;
    if (Password && Password.trim() !== '') {
      query = 'UPDATE Employee SET Name = ?, Role = ?, ContactNo = ?, Email = ?, Password = ? WHERE EmployeeID = ?';
      params = [Name, Role, ContactNo, Email, Password, id];
    } else {
      query = 'UPDATE Employee SET Name = ?, Role = ?, ContactNo = ?, Email = ? WHERE EmployeeID = ?';
      params = [Name, Role, ContactNo, Email, id];
    }

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ 
      message: 'Employee updated successfully',
      employeeId: id
    });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ 
      error: 'Failed to update employee',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM Employee WHERE EmployeeID = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ 
      message: 'Employee deleted successfully',
      employeeId: id
    });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ 
      error: 'Failed to delete employee',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Item routes
app.get('/api/items', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        i.*,
        CAST(i.Price AS DECIMAL(10,2)) as Price,
        w.Location as WarehouseLocation,
        s.Name as SupplierName
      FROM Item i
      LEFT JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
      LEFT JOIN Supplier s ON i.SupplierID = s.SupplierID
      ORDER BY i.ItemID DESC
    `);

    // Format the data
    const items = rows.map(item => ({
      ...item,
      Price: parseFloat(item.Price),
      StockQuantity: parseInt(item.StockQuantity)
    }));

    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ 
      error: 'Failed to fetch items',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { WarehouseID, SupplierID, Name, Category, Price, StockQuantity } = req.body;
    
    if (!WarehouseID || !SupplierID || !Name || !Category || !Price || StockQuantity === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['WarehouseID', 'SupplierID', 'Name', 'Category', 'Price', 'StockQuantity'],
        received: req.body
      });
    }

    // Check if warehouse exists
    const [warehouse] = await pool.query('SELECT * FROM Warehouse WHERE WarehouseID = ?', [WarehouseID]);
    if (warehouse.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Check if supplier exists
    const [supplier] = await pool.query('SELECT * FROM Supplier WHERE SupplierID = ?', [SupplierID]);
    if (supplier.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // FIRST: Check if this exact item NAME already exists in THIS SPECIFIC warehouse
    const [existingInWarehouse] = await pool.query(
      'SELECT ItemID, Name, Category FROM Item WHERE LOWER(TRIM(Name)) = LOWER(TRIM(?)) AND WarehouseID = ?',
      [Name, WarehouseID]
    );

    if (existingInWarehouse.length > 0) {
      return res.status(409).json({ 
        error: `Item "${Name}" already exists in this warehouse (ID: ${existingInWarehouse[0].ItemID}). Please update the existing item or choose a different warehouse.`
      });
    }

    // SECOND: Check if this item name exists in ANY other warehouse
    const [existingItem] = await pool.query(
      'SELECT ItemID, Category, WarehouseID FROM Item WHERE LOWER(TRIM(Name)) = LOWER(TRIM(?)) LIMIT 1',
      [Name]
    );

    let ItemID;
    let usedCategory;
    
    if (existingItem.length > 0) {
      // Item exists in another warehouse - reuse the ItemID and Category
      ItemID = existingItem[0].ItemID;
      usedCategory = existingItem[0].Category;
      
      console.log(`Reusing ItemID ${ItemID} for "${Name}" in warehouse ${WarehouseID}`);

      const [result] = await pool.query(
        'INSERT INTO Item (ItemID, WarehouseID, SupplierID, Name, Category, Price, StockQuantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ItemID, WarehouseID, SupplierID, Name, usedCategory, Price, StockQuantity]
      );

      res.status(201).json({
        message: 'Item added to warehouse successfully',
        item: { ItemID, WarehouseID, Name, Category: usedCategory },
        isNewItem: false,
        note: `Item "${Name}" added to new warehouse using existing Item ID ${ItemID}. Category: "${usedCategory}"`
      });
    } else {
      // Completely new item - create new ItemID
      const [maxItem] = await pool.query('SELECT COALESCE(MAX(ItemID), 0) + 1 as NextItemID FROM Item');
      ItemID = maxItem[0].NextItemID;
      usedCategory = Category;
      
      console.log(`Creating new ItemID ${ItemID} for "${Name}"`);

      const [result] = await pool.query(
        'INSERT INTO Item (ItemID, WarehouseID, SupplierID, Name, Category, Price, StockQuantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [ItemID, WarehouseID, SupplierID, Name, usedCategory, Price, StockQuantity]
      );

      res.status(201).json({
        message: 'New item created successfully',
        item: { ItemID, WarehouseID, Name, Category: usedCategory },
        isNewItem: true,
        note: `New item "${Name}" created with Item ID ${ItemID}`
      });
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This item already exists in this warehouse. Please update the existing item instead.' });
    }
    console.error('Error creating item:', err);
    res.status(500).json({ 
      error: 'Failed to create item',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.put('/api/items/:itemId/:warehouseId', async (req, res) => {
  try {
    const { itemId, warehouseId } = req.params;
    const { Name, Category, Price, StockQuantity, SupplierID } = req.body;
    
    if (!Name || !Category || Price === undefined || StockQuantity === undefined || !SupplierID) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'Category', 'Price', 'StockQuantity', 'SupplierID']
      });
    }

    const [result] = await pool.query(
      `UPDATE Item 
       SET Name = ?, Category = ?, Price = ?, StockQuantity = ?, SupplierID = ?
       WHERE ItemID = ? AND WarehouseID = ?`,
      [Name, Category, Price, StockQuantity, SupplierID, itemId, warehouseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ 
      message: 'Item updated successfully',
      itemId,
      warehouseId
    });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ 
      error: 'Failed to update item',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete('/api/items/:itemId/:warehouseId', async (req, res) => {
  try {
    const { itemId, warehouseId } = req.params;
    const [result] = await pool.query(
      'DELETE FROM Item WHERE ItemID = ? AND WarehouseID = ?', 
      [itemId, warehouseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ 
      message: 'Item deleted successfully',
      itemId,
      warehouseId
    });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ 
      error: 'Failed to delete item',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Supplier routes
app.get('/api/suppliers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Supplier ORDER BY SupplierID');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching suppliers:', err);
    res.status(500).json({ 
      error: 'Failed to fetch suppliers',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.post('/api/suppliers', async (req, res) => {
  try {
    const { Name, ContactNo, Email, Address } = req.body;
    
    if (!Name || !ContactNo || !Email || !Address) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'ContactNo', 'Email', 'Address']
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Supplier (Name, ContactNo, Email, Address) VALUES (?, ?, ?, ?)',
      [Name, ContactNo, Email, Address]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      supplierId: result.insertId
    });
  } catch (err) {
    console.error('Error creating supplier:', err);
    res.status(500).json({ 
      error: 'Failed to create supplier',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { Name, ContactNo, Email, Address } = req.body;
    const { id } = req.params;
    
    if (!Name || !ContactNo || !Email || !Address) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Name', 'ContactNo', 'Email', 'Address']
      });
    }

    const [result] = await pool.query(
      'UPDATE Supplier SET Name = ?, ContactNo = ?, Email = ?, Address = ? WHERE SupplierID = ?',
      [Name, ContactNo, Email, Address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    console.error('Error updating supplier:', err);
    res.status(500).json({ 
      error: 'Failed to update supplier',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM Supplier WHERE SupplierID = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Error deleting supplier:', err);
    res.status(500).json({ 
      error: 'Failed to delete supplier',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Transaction routes - UPDATED TO USE transactions_table
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.TransactionID,
        t.TransactionType,
        t.Quantity,
        t.Date,
        i.Name AS ItemName,
        w.Location AS WarehouseLocation,
        e.Name AS EmployeeName,
        c.Name AS CustomerName,
        s.Name AS SupplierName
      FROM transactions_table t
      JOIN Item i ON t.ItemID = i.ItemID AND t.WarehouseID = i.WarehouseID
      JOIN Warehouse w ON t.WarehouseID = w.WarehouseID
      JOIN Employee e ON t.EmployeeID = e.EmployeeID
      LEFT JOIN Customer c ON t.CustomerID = c.CustomerID
      LEFT JOIN Supplier s ON t.SupplierID = s.SupplierID
      ORDER BY t.Date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { TransactionType, ItemID, WarehouseID, Quantity, EmployeeID, CustomerID, SupplierID } = req.body;

    // Validate required fields
    if (!TransactionType || !ItemID || !WarehouseID || !Quantity || !EmployeeID) {
      await connection.rollback();
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['TransactionType', 'ItemID', 'WarehouseID', 'Quantity', 'EmployeeID']
      });
    }

    // Validate transaction type
    if (!['IN', 'OUT'].includes(TransactionType)) {
      await connection.rollback();
      return res.status(400).json({ error: 'TransactionType must be either IN or OUT' });
    }

    // Validate Customer/Supplier based on transaction type
    if (TransactionType === 'OUT' && (!CustomerID || CustomerID === '')) {
      await connection.rollback();
      return res.status(400).json({ error: 'CustomerID is required for OUT transactions' });
    }

    if (TransactionType === 'IN' && (!SupplierID || SupplierID === '')) {
      await connection.rollback();
      return res.status(400).json({ error: 'SupplierID is required for IN transactions' });
    }

    // Check if item exists in warehouse
    const [item] = await connection.query(
      'SELECT StockQuantity FROM Item WHERE ItemID = ? AND WarehouseID = ?',
      [ItemID, WarehouseID]
    );

    if (item.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item not found in specified warehouse' });
    }

    // For OUT transactions, check if enough stock is available
    if (TransactionType === 'OUT' && item[0].StockQuantity < Quantity) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Insufficient stock',
        available: item[0].StockQuantity,
        requested: Quantity
      });
    }

    // Prepare data - set null for unused ID
    const finalCustomerID = TransactionType === 'OUT' ? CustomerID : null;
    const finalSupplierID = TransactionType === 'IN' ? SupplierID : null;

    // Create transaction - USING transactions_table
    const [result] = await connection.query(
      `INSERT INTO transactions_table 
       (TransactionType, ItemID, WarehouseID, Quantity, EmployeeID, CustomerID, SupplierID) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [TransactionType, ItemID, WarehouseID, Quantity, EmployeeID, finalCustomerID, finalSupplierID]
    );

    // Update item stock
    const newQuantity = TransactionType === 'IN' 
      ? item[0].StockQuantity + parseInt(Quantity)
      : item[0].StockQuantity - parseInt(Quantity);

    await connection.query(
      'UPDATE Item SET StockQuantity = ? WHERE ItemID = ? AND WarehouseID = ?',
      [newQuantity, ItemID, WarehouseID]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Transaction created successfully',
      transactionId: result.insertId,
      stockUpdated: {
        previous: item[0].StockQuantity,
        current: newQuantity
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    connection.release();
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // USING transactions_table
    const [transaction] = await connection.query(
      'SELECT * FROM transactions_table WHERE TransactionID = ?',
      [id]
    );

    if (transaction.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const trans = transaction[0];

    // Get current stock
    const [item] = await connection.query(
      'SELECT StockQuantity FROM Item WHERE ItemID = ? AND WarehouseID = ?',
      [trans.ItemID, trans.WarehouseID]
    );

    if (item.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Item not found' });
    }

    // Reverse the stock change
    const newQuantity = trans.TransactionType === 'IN'
      ? item[0].StockQuantity - trans.Quantity
      : item[0].StockQuantity + trans.Quantity;

    // Check for negative stock after reversal
    if (newQuantity < 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete transaction: Would result in negative stock',
        currentStock: item[0].StockQuantity,
        transactionQuantity: trans.Quantity
      });
    }

    // Update stock
    await connection.query(
      'UPDATE Item SET StockQuantity = ? WHERE ItemID = ? AND WarehouseID = ?',
      [newQuantity, trans.ItemID, trans.WarehouseID]
    );

    // Delete transaction - USING transactions_table
    await connection.query('DELETE FROM transactions_table WHERE TransactionID = ?', [id]);

    await connection.commit();

    res.json({
      message: 'Transaction deleted and stock reversed',
      stockReverted: {
        previous: item[0].StockQuantity,
        current: newQuantity
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting transaction:', err);
    res.status(500).json({ 
      error: 'Failed to delete transaction',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    connection.release();
  }
});

// Analytics Routes
app.get('/api/analytics/inventory-value', async (req, res) => {
  try {
    console.log('Fetching inventory value...');
    const [rows] = await pool.query(`
      SELECT 
        w.WarehouseID,
        w.Location,
        CAST(COALESCE(SUM(i.Price * i.StockQuantity), 0) AS DECIMAL(10,2)) as TotalInventoryValue,
        COUNT(DISTINCT i.ItemID) as TotalItems,
        COALESCE(SUM(i.StockQuantity), 0) as TotalQuantity
      FROM Warehouse w
      LEFT JOIN Item i ON w.WarehouseID = i.WarehouseID
      GROUP BY w.WarehouseID, w.Location
      ORDER BY TotalInventoryValue DESC
    `);
    console.log('Inventory value response:', JSON.stringify(rows, null, 2));
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inventory value:', err);
    res.status(500).json({ error: 'Failed to fetch inventory value' });
  }
});

app.get('/api/analytics/supplier-performance', async (req, res) => {
  try {
    console.log('Fetching supplier performance...');
    const [rows] = await pool.query(`
      SELECT 
        s.SupplierID,
        s.Name,
        COUNT(DISTINCT CONCAT(i.ItemID, '-', i.WarehouseID)) as ItemsSupplied,
        CAST(AVG(i.Price) AS DECIMAL(10,2)) as AvgItemPrice,
        COALESCE(SUM(i.StockQuantity), 0) as TotalQuantitySupplied,
        CAST(COALESCE(SUM(i.Price * i.StockQuantity), 0) AS DECIMAL(10,2)) as TotalValue
      FROM Supplier s
      LEFT JOIN Item i ON s.SupplierID = i.SupplierID
      GROUP BY s.SupplierID, s.Name
      ORDER BY TotalValue DESC
    `);
    console.log('Supplier performance response:', JSON.stringify(rows, null, 2));
    res.json(rows);
  } catch (err) {
    console.error('Error fetching supplier performance:', err);
    res.status(500).json({ error: 'Failed to fetch supplier performance' });
  }
});

app.get('/api/analytics/top-supplier', async (req, res) => {
  try {
    console.log('Fetching top supplier...');
    const [rows] = await pool.query(`
      SELECT 
        s.SupplierID,
        s.Name as TopSupplier,
        COUNT(DISTINCT CONCAT(i.ItemID, '-', i.WarehouseID)) as ItemCount,
        CAST(COALESCE(SUM(i.Price * i.StockQuantity), 0) AS DECIMAL(10,2)) as TotalValue
      FROM Supplier s
      JOIN Item i ON s.SupplierID = i.SupplierID
      GROUP BY s.SupplierID, s.Name
      ORDER BY TotalValue DESC
      LIMIT 1
    `);
    const result = rows[0] || { TopSupplier: 'N/A', ItemCount: 0, TotalValue: 0 };
    console.log('Top supplier response:', JSON.stringify(result, null, 2));
    res.json(result);
  } catch (err) {
    console.error('Error fetching top supplier:', err);
    res.status(500).json({ error: 'Failed to fetch top supplier' });
  }
});

app.get('/api/analytics/low-stock/:threshold', async (req, res) => {
  try {
    const { threshold } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        i.ItemID,
        i.WarehouseID,
        i.Name,
        i.Category,
        i.StockQuantity,
        i.Price,
        w.Location,
        s.Name as SupplierName
      FROM Item i
      JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
      JOIN Supplier s ON i.SupplierID = s.SupplierID
      WHERE i.StockQuantity < ?
      ORDER BY i.StockQuantity ASC
    `, [threshold]);
    console.log('Low stock data:', rows);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching low stock items:', err);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// =====================================================
// STORED PROCEDURE ENDPOINTS
// =====================================================

// Add Item Using Stored Procedure
app.post('/api/procedures/add-item', async (req, res) => {
  try {
    const { ItemID, WarehouseID, SupplierID, Name, Category, Price, Quantity } = req.body;
    
    if (!ItemID || !WarehouseID || !SupplierID || !Name || !Category || !Price || !Quantity) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['ItemID', 'WarehouseID', 'SupplierID', 'Name', 'Category', 'Price', 'Quantity']
      });
    }

    await pool.query(
      'CALL AddItemAndUpdateStock(?, ?, ?, ?, ?, ?, ?)',
      [ItemID, WarehouseID, SupplierID, Name, Category, Price, Quantity]
    );

    res.json({
      success: true,
      message: 'Item added/updated successfully using stored procedure',
      item: { ItemID, WarehouseID, Name, Quantity }
    });
  } catch (err) {
    console.error('Error calling AddItemAndUpdateStock procedure:', err);
    res.status(500).json({ 
      error: 'Failed to add item',
      details: err.sqlMessage || err.message
    });
  }
});

// Transfer Stock Between Warehouses Using Stored Procedure
app.post('/api/procedures/transfer-stock', async (req, res) => {
  try {
    const { ItemID, FromWarehouseID, ToWarehouseID, Quantity, EmployeeID, SupplierID } = req.body;
    
    if (!ItemID || !FromWarehouseID || !ToWarehouseID || !Quantity || !EmployeeID || !SupplierID) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['ItemID', 'FromWarehouseID', 'ToWarehouseID', 'Quantity', 'EmployeeID', 'SupplierID']
      });
    }

    const [result] = await pool.query(
      'CALL TransferStock(?, ?, ?, ?, ?, ?)',
      [ItemID, FromWarehouseID, ToWarehouseID, Quantity, EmployeeID, SupplierID]
    );

    res.json({
      success: true,
      message: result[0][0].Message,
      transfer: { ItemID, FromWarehouseID, ToWarehouseID, Quantity }
    });
  } catch (err) {
    console.error('Error calling TransferStock procedure:', err);
    res.status(500).json({ 
      error: 'Failed to transfer stock',
      details: err.sqlMessage || err.message
    });
  }
});

// Update Prices by Category Using Stored Procedure
app.post('/api/procedures/update-prices', async (req, res) => {
  try {
    const { Category, PriceChangePercent } = req.body;
    
    if (!Category || PriceChangePercent === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['Category', 'PriceChangePercent']
      });
    }

    const [result] = await pool.query(
      'CALL UpdatePricesByCategory(?, ?)',
      [Category, PriceChangePercent]
    );

    res.json({
      success: true,
      message: result[0][0].Message,
      update: { Category, PriceChangePercent }
    });
  } catch (err) {
    console.error('Error calling UpdatePricesByCategory procedure:', err);
    res.status(500).json({ 
      error: 'Failed to update prices',
      details: err.sqlMessage || err.message
    });
  }
});

// Generate Inventory Report Using Stored Procedure (with warehouseId)
app.get('/api/procedures/inventory-report/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouseParam = parseInt(warehouseId);

    const [rows] = await pool.query(
      'CALL GenerateInventoryReport(?)',
      [warehouseParam]
    );

    res.json({
      success: true,
      warehouseId: warehouseParam,
      report: rows[0]
    });
  } catch (err) {
    console.error('Error calling GenerateInventoryReport procedure:', err);
    res.status(500).json({ 
      error: 'Failed to generate inventory report',
      details: err.sqlMessage || err.message
    });
  }
});

// Generate Inventory Report Using Stored Procedure (all warehouses)
app.get('/api/procedures/inventory-report', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'CALL GenerateInventoryReport(?)',
      [null]
    );

    res.json({
      success: true,
      warehouseId: 'All Warehouses',
      report: rows[0]
    });
  } catch (err) {
    console.error('Error calling GenerateInventoryReport procedure:', err);
    res.status(500).json({ 
      error: 'Failed to generate inventory report',
      details: err.sqlMessage || err.message
    });
  }
});

// Get Employee Transaction Summary Using Stored Procedure (with employeeId)
app.get('/api/procedures/employee-summary/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employeeParam = parseInt(employeeId);

    const [rows] = await pool.query(
      'CALL GetEmployeeTransactionSummary(?)',
      [employeeParam]
    );

    res.json({
      success: true,
      employeeId: employeeParam,
      summary: rows[0]
    });
  } catch (err) {
    console.error('Error calling GetEmployeeTransactionSummary procedure:', err);
    res.status(500).json({ 
      error: 'Failed to get employee summary',
      details: err.sqlMessage || err.message
    });
  }
});

// Get Employee Transaction Summary Using Stored Procedure (all employees)
app.get('/api/procedures/employee-summary', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'CALL GetEmployeeTransactionSummary(?)',
      [null]
    );

    res.json({
      success: true,
      employeeId: 'All Employees',
      summary: rows[0]
    });
  } catch (err) {
    console.error('Error calling GetEmployeeTransactionSummary procedure:', err);
    res.status(500).json({ 
      error: 'Failed to get employee summary',
      details: err.sqlMessage || err.message
    });
  }
});

// =====================================================
// FUNCTION ENDPOINTS
// =====================================================

// Get Warehouse Total Value Using Function
app.get('/api/functions/warehouse-value/:warehouseId', async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const [rows] = await pool.query(
      'SELECT GetWarehouseValue(?) as TotalValue',
      [warehouseId]
    );

    res.json({
      success: true,
      warehouseId: parseInt(warehouseId),
      totalValue: parseFloat(rows[0].TotalValue)
    });
  } catch (err) {
    console.error('Error calling GetWarehouseValue function:', err);
    res.status(500).json({ 
      error: 'Failed to get warehouse value',
      details: err.sqlMessage || err.message
    });
  }
});

// Get Total Stock for an Item Using Function
app.get('/api/functions/total-stock/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const [rows] = await pool.query(
      'SELECT GetTotalItemStock(?) as TotalStock',
      [itemId]
    );

    res.json({
      success: true,
      itemId: parseInt(itemId),
      totalStock: parseInt(rows[0].TotalStock)
    });
  } catch (err) {
    console.error('Error calling GetTotalItemStock function:', err);
    res.status(500).json({ 
      error: 'Failed to get total stock',
      details: err.sqlMessage || err.message
    });
  }
});

// Check Low Stock Using Function
app.get('/api/functions/check-low-stock/:itemId/:warehouseId/:threshold', async (req, res) => {
  try {
    const { itemId, warehouseId, threshold } = req.params;

    const [rows] = await pool.query(
      'SELECT IsLowStock(?, ?, ?) as IsLow',
      [itemId, warehouseId, threshold]
    );

    res.json({
      success: true,
      itemId: parseInt(itemId),
      warehouseId: parseInt(warehouseId),
      threshold: parseInt(threshold),
      isLowStock: rows[0].IsLow === 1
    });
  } catch (err) {
    console.error('Error calling IsLowStock function:', err);
    res.status(500).json({ 
      error: 'Failed to check low stock',
      details: err.sqlMessage || err.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✨ Server running on http://localhost:${PORT}`);
  console.log(`\n📚 STANDARD API ENDPOINTS:`);
  console.log(`GET    /api/customers      - List all customers`);
  console.log(`POST   /api/customers      - Create new customer`);
  console.log(`PUT    /api/customers/:id  - Update customer`);
  console.log(`DELETE /api/customers/:id  - Delete customer`);
  console.log(`GET    /api/warehouses     - List all warehouses`);
  console.log(`POST   /api/warehouses     - Create new warehouse`);
  console.log(`PUT    /api/warehouses/:id - Update warehouse`);
  console.log(`DELETE /api/warehouses/:id - Delete warehouse`);
  console.log(`GET    /api/employees      - List all employees`);
  console.log(`POST   /api/employees      - Create new employee`);
  console.log(`PUT    /api/employees/:id  - Update employee`);
  console.log(`DELETE /api/employees/:id  - Delete employee`);
  console.log(`GET    /api/items         - List all items`);
  console.log(`POST   /api/items         - Create new item`);
  console.log(`PUT    /api/items/:itemId/:warehouseId - Update item`);
  console.log(`DELETE /api/items/:itemId/:warehouseId - Delete item`);
  console.log(`GET    /api/suppliers      - List all suppliers`);
  console.log(`POST   /api/suppliers      - Create new supplier`);
  console.log(`PUT    /api/suppliers/:id  - Update supplier`);
  console.log(`DELETE /api/suppliers/:id  - Delete supplier`);
  console.log(`GET    /api/transactions   - List all transactions`);
  console.log(`POST   /api/transactions   - Create new transaction`);
  console.log(`DELETE /api/transactions/:id  - Delete transaction`);
  
  console.log(`\n📊 ANALYTICS ENDPOINTS:`);
  console.log(`GET    /api/analytics/inventory-value - Get inventory value by warehouse`);
  console.log(`GET    /api/analytics/supplier-performance - Get supplier performance`);
  console.log(`GET    /api/analytics/top-supplier - Get top supplier`);
  console.log(`GET    /api/analytics/low-stock/:threshold - Get low stock items`);
  
  console.log(`\n🔧 STORED PROCEDURE ENDPOINTS:`);
  console.log(`POST   /api/procedures/add-item - Add/update item using stored procedure`);
  console.log(`POST   /api/procedures/transfer-stock - Transfer stock between warehouses`);
  console.log(`POST   /api/procedures/update-prices - Bulk update prices by category`);
  console.log(`GET    /api/procedures/inventory-report/:warehouseId? - Generate inventory report`);
  console.log(`GET    /api/procedures/employee-summary/:employeeId? - Get employee transaction summary`);
  
  console.log(`\n⚙️  FUNCTION ENDPOINTS:`);
  console.log(`GET    /api/functions/warehouse-value/:warehouseId - Get total warehouse value`);
  console.log(`GET    /api/functions/total-stock/:itemId - Get total stock across warehouses`);
  console.log(`GET    /api/functions/check-low-stock/:itemId/:warehouseId/:threshold - Check if stock is low`);
});