-- =====================================================
-- WAREHOUSE INVENTORY MANAGEMENT SYSTEM
-- Stored Procedures and Functions
-- =====================================================

USE warehouse_inventory;

-- =====================================================
-- PROCEDURE 1: Add Item with Stock Update
-- =====================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS AddItemAndUpdateStock$$
CREATE PROCEDURE AddItemAndUpdateStock(
  IN p_ItemID INT,
  IN p_WarehouseID INT,
  IN p_SupplierID INT,
  IN p_Name VARCHAR(100),
  IN p_Category VARCHAR(50),
  IN p_Price DECIMAL(10,2),
  IN p_Quantity INT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error adding item';
  END;
  
  START TRANSACTION;
  
  -- Check if warehouse exists
  IF NOT EXISTS (SELECT 1 FROM Warehouse WHERE WarehouseID = p_WarehouseID) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Warehouse does not exist';
  END IF;
  
  -- Check if supplier exists
  IF NOT EXISTS (SELECT 1 FROM Supplier WHERE SupplierID = p_SupplierID) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Supplier does not exist';
  END IF;
  
  -- Insert or update item
  INSERT INTO Item (ItemID, WarehouseID, SupplierID, Name, Category, Price, StockQuantity)
  VALUES (p_ItemID, p_WarehouseID, p_SupplierID, p_Name, p_Category, p_Price, p_Quantity)
  ON DUPLICATE KEY UPDATE
    StockQuantity = StockQuantity + p_Quantity,
    Price = p_Price;
  
  COMMIT;
END$$
DELIMITER ;

-- =====================================================
-- PROCEDURE 2: Transfer Stock Between Warehouses
-- =====================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS TransferStock$$
CREATE PROCEDURE TransferStock(
  IN p_ItemID INT,
  IN p_FromWarehouseID INT,
  IN p_ToWarehouseID INT,
  IN p_Quantity INT,
  IN p_EmployeeID INT,
  IN p_SupplierID INT
)
BEGIN
  DECLARE v_CurrentStock INT;
  DECLARE v_ItemName VARCHAR(100);
  DECLARE v_Category VARCHAR(50);
  DECLARE v_Price DECIMAL(10,2);
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error transferring stock';
  END;
  
  START TRANSACTION;
  
  -- Get current stock and item details from source warehouse
  SELECT StockQuantity, Name, Category, Price 
  INTO v_CurrentStock, v_ItemName, v_Category, v_Price
  FROM Item
  WHERE ItemID = p_ItemID AND WarehouseID = p_FromWarehouseID;
  
  -- Check if sufficient stock is available
  IF v_CurrentStock IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Item not found in source warehouse';
  END IF;
  
  IF v_CurrentStock < p_Quantity THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Insufficient stock for transfer';
  END IF;
  
  -- Decrease stock in source warehouse
  UPDATE Item 
  SET StockQuantity = StockQuantity - p_Quantity
  WHERE ItemID = p_ItemID AND WarehouseID = p_FromWarehouseID;
  
  -- Check if item exists in destination warehouse
  IF EXISTS (SELECT 1 FROM Item WHERE ItemID = p_ItemID AND WarehouseID = p_ToWarehouseID) THEN
    -- Item exists, just increase stock
    UPDATE Item 
    SET StockQuantity = StockQuantity + p_Quantity
    WHERE ItemID = p_ItemID AND WarehouseID = p_ToWarehouseID;
  ELSE
    -- Item doesn't exist, create new entry
    INSERT INTO Item (ItemID, WarehouseID, SupplierID, Name, Category, Price, StockQuantity)
    VALUES (p_ItemID, p_ToWarehouseID, p_SupplierID, v_ItemName, v_Category, v_Price, p_Quantity);
  END IF;
  
  -- Record OUT transaction from source warehouse
  INSERT INTO transactions_table (TransactionType, ItemID, WarehouseID, Quantity, EmployeeID, CustomerID, SupplierID)
  VALUES ('OUT', p_ItemID, p_FromWarehouseID, p_Quantity, p_EmployeeID, NULL, NULL);
  
  -- Record IN transaction to destination warehouse
  INSERT INTO transactions_table (TransactionType, ItemID, WarehouseID, Quantity, EmployeeID, CustomerID, SupplierID)
  VALUES ('IN', p_ItemID, p_ToWarehouseID, p_Quantity, p_EmployeeID, NULL, p_SupplierID);
  
  COMMIT;
  
  SELECT CONCAT('Successfully transferred ', p_Quantity, ' units of ', v_ItemName, 
                ' from warehouse ', p_FromWarehouseID, ' to warehouse ', p_ToWarehouseID) AS Message;
END$$
DELIMITER ;

-- =====================================================
-- FUNCTION 1: Calculate Warehouse Total Value
-- =====================================================

DELIMITER $$
DROP FUNCTION IF EXISTS GetWarehouseValue$$
CREATE FUNCTION GetWarehouseValue(p_WarehouseID INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total_value DECIMAL(10,2);
  
  SELECT COALESCE(SUM(Price * StockQuantity), 0) INTO total_value
  FROM Item
  WHERE WarehouseID = p_WarehouseID;
  
  RETURN total_value;
END$$
DELIMITER ;

-- =====================================================
-- FUNCTION 2: Get Total Stock Quantity for an Item
-- =====================================================

DELIMITER $$
DROP FUNCTION IF EXISTS GetTotalItemStock$$
CREATE FUNCTION GetTotalItemStock(p_ItemID INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total_stock INT;
  
  SELECT COALESCE(SUM(StockQuantity), 0) INTO total_stock
  FROM Item
  WHERE ItemID = p_ItemID;
  
  RETURN total_stock;
END$$
DELIMITER ;

-- =====================================================
-- FUNCTION 3: Check Low Stock Alert
-- =====================================================

DELIMITER $$
DROP FUNCTION IF EXISTS IsLowStock$$
CREATE FUNCTION IsLowStock(p_ItemID INT, p_WarehouseID INT, p_Threshold INT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE current_stock INT;
  
  SELECT StockQuantity INTO current_stock
  FROM Item
  WHERE ItemID = p_ItemID AND WarehouseID = p_WarehouseID;
  
  IF current_stock IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN current_stock < p_Threshold;
END$$
DELIMITER ;

-- =====================================================
-- PROCEDURE 3: Bulk Update Item Prices by Category
-- =====================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS UpdatePricesByCategory$$
CREATE PROCEDURE UpdatePricesByCategory(
  IN p_Category VARCHAR(50),
  IN p_PriceChangePercent DECIMAL(5,2)
)
BEGIN
  DECLARE rows_affected INT;
  
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Error updating prices';
  END;
  
  START TRANSACTION;
  
  -- Update prices by percentage
  UPDATE Item
  SET Price = Price * (1 + (p_PriceChangePercent / 100))
  WHERE Category = p_Category;
  
  SET rows_affected = ROW_COUNT();
  
  COMMIT;
  
  SELECT CONCAT('Updated prices for ', rows_affected, ' items in category: ', p_Category,
                ' by ', p_PriceChangePercent, '%') AS Message;
END$$
DELIMITER ;

-- =====================================================
-- PROCEDURE 4: Generate Inventory Report
-- =====================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS GenerateInventoryReport$$
CREATE PROCEDURE GenerateInventoryReport(IN p_WarehouseID INT)
BEGIN
  SELECT 
    i.ItemID,
    i.Name AS ItemName,
    i.Category,
    i.StockQuantity,
    i.Price,
    (i.Price * i.StockQuantity) AS TotalValue,
    s.Name AS SupplierName,
    w.Location AS WarehouseLocation,
    CASE 
      WHEN i.StockQuantity < 50 THEN 'Low Stock'
      WHEN i.StockQuantity < 100 THEN 'Medium Stock'
      ELSE 'Good Stock'
    END AS StockStatus
  FROM Item i
  JOIN Warehouse w ON i.WarehouseID = w.WarehouseID
  JOIN Supplier s ON i.SupplierID = s.SupplierID
  WHERE i.WarehouseID = p_WarehouseID OR p_WarehouseID IS NULL
  ORDER BY i.Category, i.Name;
END$$
DELIMITER ;

-- =====================================================
-- PROCEDURE 5: Get Employee Transaction Summary
-- =====================================================

DELIMITER $$
DROP PROCEDURE IF EXISTS GetEmployeeTransactionSummary$$
CREATE PROCEDURE GetEmployeeTransactionSummary(IN p_EmployeeID INT)
BEGIN
  SELECT 
    e.Name AS EmployeeName,
    e.Role,
    COUNT(t.TransactionID) AS TotalTransactions,
    SUM(CASE WHEN t.TransactionType = 'IN' THEN 1 ELSE 0 END) AS InboundTransactions,
    SUM(CASE WHEN t.TransactionType = 'OUT' THEN 1 ELSE 0 END) AS OutboundTransactions,
    SUM(CASE WHEN t.TransactionType = 'IN' THEN t.Quantity ELSE 0 END) AS TotalItemsReceived,
    SUM(CASE WHEN t.TransactionType = 'OUT' THEN t.Quantity ELSE 0 END) AS TotalItemsShipped,
    MIN(t.Date) AS FirstTransaction,
    MAX(t.Date) AS LastTransaction
  FROM Employee e
  LEFT JOIN transactions_table t ON e.EmployeeID = t.EmployeeID
  WHERE e.EmployeeID = p_EmployeeID OR p_EmployeeID IS NULL
  GROUP BY e.EmployeeID, e.Name, e.Role
  ORDER BY TotalTransactions DESC;
END$$
DELIMITER ;

-- =====================================================
-- Test the procedures and functions
-- =====================================================

SELECT '✅ Procedures and Functions created successfully!' as Status;

-- Show all procedures
SELECT 
  ROUTINE_NAME,
  ROUTINE_TYPE,
  CREATED
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'warehouse_inventory'
ORDER BY ROUTINE_TYPE, ROUTINE_NAME;
