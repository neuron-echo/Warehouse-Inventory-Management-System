import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CRUDForm from '../components/CRUDForm';

const Items = ({ user }) => {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = 'http://localhost:5000/api';

  // Check if user is customer (read-only mode)
  const isCustomer = user?.role === 'customer';
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [itemsRes, warehousesRes, suppliersRes] = await Promise.all([
        axios.get(`${API_BASE}/items`),
        axios.get(`${API_BASE}/warehouses`),
        axios.get(`${API_BASE}/suppliers`)
      ]);

      setItems(itemsRes.data);
      setWarehouses(warehousesRes.data);
      setSuppliers(suppliersRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (formData) => {
    try {
      const processedData = {
        Name: formData.Name,
        Category: formData.Category,
        Price: parseFloat(formData.Price),
        StockQuantity: parseInt(formData.StockQuantity, 10),
        WarehouseID: parseInt(formData.WarehouseID, 10),
        SupplierID: parseInt(formData.SupplierID, 10)
      };

      console.log('Sending data:', processedData);

      if (editingItem) {
        // Update existing item
        await axios.put(
          `${API_BASE}/items/${editingItem.ItemID}/${editingItem.WarehouseID}`, 
          processedData
        );
        alert('Item updated successfully!');
        setEditingItem(null);
      } else {
        // Create new item
        const response = await axios.post(`${API_BASE}/items`, processedData);
        
        if (response.data.isNewItem) {
          alert(`✅ New item created!\n\nItem ID: ${response.data.item.ItemID}\nName: ${response.data.item.Name}\nCategory: ${response.data.item.Category}`);
        } else {
          alert(`✅ Item added to warehouse!\n\n${response.data.note}\n\nThis item now exists in multiple warehouses.`);
        }
      }
      
      fetchInitialData();
    } catch (err) {
      console.error('Error saving item:', err);
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (itemId, warehouseId) => {
    if (window.confirm('Are you sure you want to delete this item from this warehouse?')) {
      try {
        await axios.delete(`${API_BASE}/items/${itemId}/${warehouseId}`);
        alert('Item removed from warehouse successfully!');
        fetchInitialData();
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Error: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  // Group items by ItemID to show which warehouses have the same item
  const getItemCount = (itemId, itemName) => {
    return items.filter(i => i.ItemID === itemId).length;
  };

  // Get unique categories for filter
  const categories = ['all', ...new Set(items.map(item => item.Category))];

  // Filter items by category and search query
  let filteredItems = items;
  
  // Apply category filter
  if (categoryFilter !== 'all') {
    filteredItems = filteredItems.filter(item => item.Category === categoryFilter);
  }
  
  // Apply search filter
  if (searchQuery.trim() !== '') {
    filteredItems = filteredItems.filter(item => 
      item.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.Category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (loading) return <div className="loading">Loading items data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Items Management</h1>
      
      {isCustomer && (
        <>
          <div style={{ 
            padding: '1rem', 
            background: '#e3f2fd', 
            borderRadius: '8px', 
            marginBottom: '1rem',
            border: '1px solid #90caf9'
          }}>
            <strong>👀 Viewing Mode:</strong> Browse available items and their prices
          </div>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <label htmlFor="searchQuery" style={{ 
                fontWeight: '600', 
                marginRight: '0.5rem',
                fontSize: '1rem',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                🔍 Search Items:
              </label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or category..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
            </div>
            
            <div style={{ minWidth: '200px' }}>
              <label htmlFor="categoryFilter" style={{ 
                fontWeight: '600', 
                marginRight: '0.5rem',
                fontSize: '1rem',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Filter by Category:
              </label>
              <select 
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
      
      {!isCustomer && (
        <>
          {/* Search and Filter for Admin/Employee */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <label htmlFor="searchQueryAdmin" style={{ 
                fontWeight: '600', 
                marginRight: '0.5rem',
                fontSize: '1rem',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                🔍 Search Items:
              </label>
              <input
                id="searchQueryAdmin"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or category..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  fontSize: '1rem',
                  background: 'white'
                }}
              />
            </div>
            
            <div style={{ minWidth: '200px' }}>
              <label htmlFor="categoryFilterAdmin" style={{ 
                fontWeight: '600', 
                marginRight: '0.5rem',
                fontSize: '1rem',
                display: 'block',
                marginBottom: '0.5rem'
              }}>
                Filter by Category:
              </label>
              <select 
                id="categoryFilterAdmin"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="all">All Categories</option>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <CRUDForm
          onSubmit={handleAddItem}
          initialData={editingItem ? {
            Name: editingItem.Name,
            Category: editingItem.Category,
            Price: editingItem.Price,
            StockQuantity: editingItem.StockQuantity,
            WarehouseID: editingItem.WarehouseID,
            SupplierID: editingItem.SupplierID
          } : null}
          fields={[
            { 
              name: 'Name', 
              label: 'Item Name', 
              type: 'text',
              required: true,
              placeholder: 'Enter item name'
            },
          { 
            name: 'Category', 
            label: 'Category', 
            type: 'text',
            required: true,
            placeholder: 'Enter category (e.g., Electronics, Tools)'
          },
          { 
            name: 'Price', 
            label: 'Price ($)', 
            type: 'number', 
            step: '0.01',
            min: '0',
            required: true,
            placeholder: '0.00'
          },
          { 
            name: 'StockQuantity', 
            label: 'Stock Quantity', 
            type: 'number', 
            min: '0',
            required: true,
            placeholder: '0'
          },
          { 
            name: 'WarehouseID', 
            label: 'Warehouse', 
            type: 'select', 
            required: true,
            options: warehouses.map(w => ({ 
              value: w.WarehouseID, 
              label: `${w.Location} (Capacity: ${w.Capacity})` 
            }))
          },
          { 
            name: 'SupplierID', 
            label: 'Supplier', 
            type: 'select', 
            required: true,
            options: suppliers.map(s => ({ 
              value: s.SupplierID, 
              label: `${s.Name} (${s.Email})` 
            }))
          }
        ]}
        buttonText={editingItem ? 'Update Item' : 'Add Item'}
        onCancel={editingItem ? handleCancel : null}
      />
        </>
      )}

      <table className="crud-table">
        <thead>
          <tr>
            {!isCustomer && <th>Item ID</th>}
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            {!isCustomer && (
              <>
                <th>Stock</th>
                <th>Warehouse</th>
                <th>Supplier</th>
                <th>Locations</th>
                <th>Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(item => {
            const itemCount = getItemCount(item.ItemID, item.Name);
            return (
              <tr key={`${item.ItemID}-${item.WarehouseID}`}>
                {!isCustomer && <td>{item.ItemID}</td>}
                <td>{item.Name}</td>
                <td>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: '#e3f2fd',
                    color: '#1565c0',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    {item.Category}
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: '#2e7d32', fontSize: '1.1rem' }}>
                  ₹{parseFloat(item.Price || 0).toFixed(2)}
                </td>
                {!isCustomer && (
                  <>
                    <td>{item.StockQuantity}</td>
                    <td>{item.WarehouseLocation || 'N/A'}</td>
                    <td>{item.SupplierName || 'N/A'}</td>
                    <td>
                      {itemCount > 1 ? (
                        <span style={{ 
                          backgroundColor: '#fff3cd', 
                          padding: '4px 8px', 
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {itemCount} warehouses
                        </span>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>Single location</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-sm btn-edit" 
                          onClick={() => handleEdit(item)}
                          disabled={editingItem && editingItem.ItemID === item.ItemID && editingItem.WarehouseID === item.WarehouseID}
                        >
                          {editingItem && editingItem.ItemID === item.ItemID && editingItem.WarehouseID === item.WarehouseID ? 'Editing...' : 'Edit'}
                        </button>
                        <button 
                          className="btn-sm btn-danger" 
                          onClick={() => handleDelete(item.ItemID, item.WarehouseID)}
                          disabled={editingItem && editingItem.ItemID === item.ItemID && editingItem.WarehouseID === item.WarehouseID}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            );
          })}
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan={isCustomer ? "3" : "9"} style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
                {searchQuery.trim() !== '' 
                  ? `No items found matching "${searchQuery}"`
                  : categoryFilter === 'all' 
                    ? 'No items found.' 
                    : `No items found in "${categoryFilter}" category.`
                }
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Items;