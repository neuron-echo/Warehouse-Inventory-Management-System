import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    TransactionType: 'IN',
    ItemID: '',
    WarehouseID: '',
    Quantity: '',
    EmployeeID: '',
    CustomerID: '',
    SupplierID: '',
    Notes: ''
  });

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transRes, itemsRes, empRes, custRes, suppRes, wareRes] = await Promise.all([
        axios.get(`${API_BASE}/transactions`),
        axios.get(`${API_BASE}/items`),
        axios.get(`${API_BASE}/employees`),
        axios.get(`${API_BASE}/customers`),
        axios.get(`${API_BASE}/suppliers`),
        axios.get(`${API_BASE}/warehouses`)
      ]);

      setTransactions(transRes.data);
      setItems(itemsRes.data);
      setEmployees(empRes.data);
      setCustomers(custRes.data);
      setSuppliers(suppRes.data);
      setWarehouses(wareRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'TransactionType') {
      setFormData({
        ...formData,
        [name]: value,
        CustomerID: '',
        SupplierID: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.TransactionType || !formData.ItemID || !formData.WarehouseID || 
        !formData.Quantity || !formData.EmployeeID) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.TransactionType === 'OUT' && !formData.CustomerID) {
      alert('Customer is required for OUT transactions');
      return;
    }

    if (formData.TransactionType === 'IN' && !formData.SupplierID) {
      alert('Supplier is required for IN transactions');
      return;
    }

    try {
      const dataToSend = {
        TransactionType: formData.TransactionType,
        ItemID: parseInt(formData.ItemID),
        WarehouseID: parseInt(formData.WarehouseID),
        Quantity: parseInt(formData.Quantity),
        EmployeeID: parseInt(formData.EmployeeID),
        CustomerID: formData.TransactionType === 'OUT' ? parseInt(formData.CustomerID) : null,
        SupplierID: formData.TransactionType === 'IN' ? parseInt(formData.SupplierID) : null,
        Notes: formData.Notes
      };

      await axios.post(`${API_BASE}/transactions`, dataToSend);
      alert('✅ Transaction created successfully!');
      
      setFormData({
        TransactionType: 'IN',
        ItemID: '',
        WarehouseID: '',
        Quantity: '',
        EmployeeID: '',
        CustomerID: '',
        SupplierID: '',
        Notes: ''
      });
      
      fetchInitialData();
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert(err.response?.data?.error || 'Failed to create transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Delete this transaction? Stock will be reversed.')) {
      try {
        await axios.delete(`${API_BASE}/transactions/${id}`);
        alert('✅ Transaction deleted successfully!');
        fetchInitialData();
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert(err.response?.data?.error || 'Failed to delete transaction');
      }
    }
  };

  if (loading) return <div className="loading">Loading transaction data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Transactions Management</h1>

      <form onSubmit={handleSubmit} className="crud-form">
        <div className="form-group">
          <label>
            Transaction Type <span style={{ color: 'red' }}>*</span>
          </label>
          <select 
            name="TransactionType" 
            value={formData.TransactionType} 
            onChange={handleInputChange}
            required
          >
            <option value="IN">Stock IN (from Supplier)</option>
            <option value="OUT">Stock OUT (to Customer)</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            Warehouse <span style={{ color: 'red' }}>*</span>
          </label>
          <select 
            name="WarehouseID" 
            value={formData.WarehouseID} 
            onChange={handleInputChange}
            required
          >
            <option value="">Select Warehouse</option>
            {warehouses.map(w => (
              <option key={w.WarehouseID} value={w.WarehouseID}>
                {w.Location} (Capacity: {w.Capacity})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            Item <span style={{ color: 'red' }}>*</span>
          </label>
          <select 
            name="ItemID" 
            value={formData.ItemID} 
            onChange={handleInputChange}
            required
          >
            <option value="">Select Item</option>
            {items
              .filter(i => !formData.WarehouseID || i.WarehouseID === parseInt(formData.WarehouseID))
              .map(i => (
                <option key={`${i.ItemID}-${i.WarehouseID}`} value={i.ItemID}>
                  {i.Name} (Stock: {i.StockQuantity}, Price: ${i.Price})
                </option>
              ))
            }
          </select>
        </div>

        <div className="form-group">
          <label>
            Quantity <span style={{ color: 'red' }}>*</span>
          </label>
          <input 
            type="number" 
            name="Quantity" 
            value={formData.Quantity} 
            onChange={handleInputChange}
            min="1"
            required
            placeholder="Enter quantity"
          />
        </div>

        <div className="form-group">
          <label>
            Employee <span style={{ color: 'red' }}>*</span>
          </label>
          <select 
            name="EmployeeID" 
            value={formData.EmployeeID} 
            onChange={handleInputChange}
            required
          >
            <option value="">Select Employee</option>
            {employees.map(e => (
              <option key={e.EmployeeID} value={e.EmployeeID}>
                {e.Name} ({e.Role})
              </option>
            ))}
          </select>
        </div>

        {formData.TransactionType === 'OUT' && (
          <div className="form-group">
            <label>
              Customer <span style={{ color: 'red' }}>*</span>
            </label>
            <select 
              name="CustomerID" 
              value={formData.CustomerID} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.CustomerID} value={c.CustomerID}>
                  {c.Name} ({c.Email})
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.TransactionType === 'IN' && (
          <div className="form-group">
            <label>
              Supplier <span style={{ color: 'red' }}>*</span>
            </label>
            <select 
              name="SupplierID" 
              value={formData.SupplierID} 
              onChange={handleInputChange}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.SupplierID} value={s.SupplierID}>
                  {s.Name} ({s.Email})
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>
           Create Transaction
        </button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>
          Transaction History ({transactions.length})
        </h2>
        
        <table className="crud-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Qty</th>
              <th>Employee</th>
              <th>Customer/Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#666', fontStyle: 'italic' }}>
                  📭 No transactions found. Create your first transaction above.
                </td>
              </tr>
            ) : (
              transactions.map(t => (
                <tr key={t.TransactionID}>
                  <td>{t.TransactionID}</td>
                  <td>{new Date(t.Date).toLocaleString()}</td>
                  <td>
                    <span className={t.TransactionType === 'IN' ? 'badge badge-green' : 'badge badge-red'}>
                      {t.TransactionType === 'IN' ? ' IN' : 'OUT'}
                    </span>
                  </td>
                  <td><strong>{t.ItemName}</strong></td>
                  <td>{t.WarehouseLocation}</td>
                  <td><strong>{t.Quantity}</strong></td>
                  <td>{t.EmployeeName}</td>
                  <td>
                    {t.TransactionType === 'IN' ? (
                      <span title="Supplier">🏭 {t.SupplierName}</span>
                    ) : (
                      <span title="Customer">👤 {t.CustomerName}</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(t.TransactionID)}
                      className="btn-sm btn-danger"
                      title="Delete and reverse stock"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;