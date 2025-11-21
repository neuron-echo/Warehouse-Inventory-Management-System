import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const Procedures = () => {
  const [activeTab, setActiveTab] = useState('transfer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Form states
  const [transferData, setTransferData] = useState({
    ItemID: '',
    FromWarehouseID: '',
    ToWarehouseID: '',
    Quantity: '',
    EmployeeID: '',
    SupplierID: ''
  });

  const [priceData, setPriceData] = useState({
    Category: '',
    PriceChangePercent: ''
  });

  const [reportWarehouseId, setReportWarehouseId] = useState('');
  const [employeeSummaryId, setEmployeeSummaryId] = useState('');
  const [reportData, setReportData] = useState(null);

  // Dropdown data
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [itemsRes, warehousesRes, employeesRes, suppliersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/items'),
        axios.get('http://localhost:5000/api/warehouses'),
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/suppliers')
      ]);

      setItems(itemsRes.data);
      setWarehouses(warehousesRes.data);
      setEmployees(employeesRes.data);
      setSuppliers(suppliersRes.data);

      // Extract unique categories
      const uniqueCategories = [...new Set(itemsRes.data.map(item => item.Category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/procedures/transfer-stock', transferData);
      setMessage(response.data.message);
      setTransferData({
        ItemID: '',
        FromWarehouseID: '',
        ToWarehouseID: '',
        Quantity: '',
        EmployeeID: '',
        SupplierID: ''
      });
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrices = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/procedures/update-prices', priceData);
      setMessage(response.data.message);
      setPriceData({ Category: '', PriceChangePercent: '' });
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Price update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const url = reportWarehouseId 
        ? `http://localhost:5000/api/procedures/inventory-report/${reportWarehouseId}`
        : 'http://localhost:5000/api/procedures/inventory-report';
      
      const response = await axios.get(url);
      setReportData(response.data.report);
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSummary = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const url = employeeSummaryId 
        ? `http://localhost:5000/api/procedures/employee-summary/${employeeSummaryId}`
        : 'http://localhost:5000/api/procedures/employee-summary';
      
      const response = await axios.get(url);
      setReportData(response.data.summary);
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Summary generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h1>🔧 </h1>
      <p className="page-description">Execute warehouse operations using stored procedures</p>

      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '8px'
        }}>
          ✅ {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '8px'
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('transfer')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'transfer' ? '#667eea' : 'transparent',
              color: activeTab === 'transfer' ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0'
            }}
          >
            📦 Transfer Stock
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'prices' ? '#667eea' : 'transparent',
              color: activeTab === 'prices' ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0'
            }}
          >
            💰 Update Prices
          </button>
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'report' ? '#667eea' : 'transparent',
              color: activeTab === 'report' ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0'
            }}
          >
            📊 Inventory Report
          </button>
          <button
            onClick={() => setActiveTab('employee')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: activeTab === 'employee' ? '#667eea' : 'transparent',
              color: activeTab === 'employee' ? 'white' : '#333',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0'
            }}
          >
            👤 Employee Summary
          </button>
        </div>

        {/* Transfer Stock Tab */}
        {activeTab === 'transfer' && (
          <div className="card">
            <h2>Transfer Stock Between Warehouses</h2>
            <form onSubmit={handleTransferStock} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Item:</label>
                <select
                  value={transferData.ItemID}
                  onChange={(e) => setTransferData({ ...transferData, ItemID: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={`${item.ItemID}-${item.WarehouseID}`} value={item.ItemID}>
                      {item.Name} (ID: {item.ItemID})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>From Warehouse:</label>
                  <select
                    value={transferData.FromWarehouseID}
                    onChange={(e) => setTransferData({ ...transferData, FromWarehouseID: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.WarehouseID} value={wh.WarehouseID}>
                        {wh.Location} (ID: {wh.WarehouseID})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>To Warehouse:</label>
                  <select
                    value={transferData.ToWarehouseID}
                    onChange={(e) => setTransferData({ ...transferData, ToWarehouseID: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.WarehouseID} value={wh.WarehouseID}>
                        {wh.Location} (ID: {wh.WarehouseID})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Quantity:</label>
                <input
                  type="number"
                  value={transferData.Quantity}
                  onChange={(e) => setTransferData({ ...transferData, Quantity: e.target.value })}
                  required
                  min="1"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Employee:</label>
                  <select
                    value={transferData.EmployeeID}
                    onChange={(e) => setTransferData({ ...transferData, EmployeeID: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.EmployeeID} value={emp.EmployeeID}>
                        {emp.Name} ({emp.Role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Supplier:</label>
                  <select
                    value={transferData.SupplierID}
                    onChange={(e) => setTransferData({ ...transferData, SupplierID: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(sup => (
                      <option key={sup.SupplierID} value={sup.SupplierID}>
                        {sup.Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Transferring...' : 'Transfer Stock'}
              </button>
            </form>
          </div>
        )}

        {/* Update Prices Tab */}
        {activeTab === 'prices' && (
          <div className="card">
            <h2>Bulk Update Prices by Category</h2>
            <form onSubmit={handleUpdatePrices} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Category:</label>
                <select
                  value={priceData.Category}
                  onChange={(e) => setPriceData({ ...priceData, Category: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Price Change Percentage:
                  <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '0.5rem' }}>
                    (Use positive for increase, negative for decrease)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={priceData.PriceChangePercent}
                  onChange={(e) => setPriceData({ ...priceData, PriceChangePercent: e.target.value })}
                  required
                  placeholder="e.g., 10 for +10% or -5 for -5%"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Updating...' : 'Update Prices'}
              </button>
            </form>
          </div>
        )}

        {/* Inventory Report Tab */}
        {activeTab === 'report' && (
          <div className="card">
            <h2>Generate Inventory Report</h2>
            <div style={{ marginBottom: '1rem', maxWidth: '600px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Warehouse (optional - leave empty for all):
              </label>
              <select
                value={reportWarehouseId}
                onChange={(e) => setReportWarehouseId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Warehouses</option>
                {warehouses.map(wh => (
                  <option key={wh.WarehouseID} value={wh.WarehouseID}>
                    {wh.Location} (ID: {wh.WarehouseID})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: '1.5rem'
              }}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>

            {reportData && (
              <div style={{ overflowX: 'auto' }}>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Item ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Price</th>
                      <th>Total Value</th>
                      <th>Supplier</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.ItemID}</td>
                        <td>{item.ItemName}</td>
                        <td>{item.Category}</td>
                        <td>{item.StockQuantity}</td>
                        <td>${parseFloat(item.Price).toFixed(2)}</td>
                        <td>${parseFloat(item.TotalValue).toFixed(2)}</td>
                        <td>{item.SupplierName}</td>
                        <td>{item.WarehouseLocation}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            fontWeight: 'bold',
                            background: item.StockStatus === 'Good Stock' ? '#d4edda' :
                                       item.StockStatus === 'Medium Stock' ? '#fff3cd' : '#f8d7da',
                            color: item.StockStatus === 'Good Stock' ? '#155724' :
                                   item.StockStatus === 'Medium Stock' ? '#856404' : '#721c24'
                          }}>
                            {item.StockStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Employee Summary Tab */}
        {activeTab === 'employee' && (
          <div className="card">
            <h2>Employee Transaction Summary</h2>
            <div style={{ marginBottom: '1rem', maxWidth: '600px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Employee (optional - leave empty for all):
              </label>
              <select
                value={employeeSummaryId}
                onChange={(e) => setEmployeeSummaryId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.EmployeeID} value={emp.EmployeeID}>
                    {emp.Name} ({emp.Role})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleEmployeeSummary}
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: '1.5rem'
              }}
            >
              {loading ? 'Generating...' : 'Get Summary'}
            </button>

            {reportData && (
              <div style={{ overflowX: 'auto' }}>
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Total Trans.</th>
                      <th>Inbound</th>
                      <th>Outbound</th>
                      <th>Items Received</th>
                      <th>Items Shipped</th>
                      <th>First Trans.</th>
                      <th>Last Trans.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((emp, idx) => (
                      <tr key={idx}>
                        <td>{emp.EmployeeName}</td>
                        <td>{emp.Role}</td>
                        <td>{emp.TotalTransactions}</td>
                        <td>{emp.InboundTransactions}</td>
                        <td>{emp.OutboundTransactions}</td>
                        <td>{emp.TotalItemsReceived}</td>
                        <td>{emp.TotalItemsShipped}</td>
                        <td>{emp.FirstTransaction ? new Date(emp.FirstTransaction).toLocaleDateString() : 'N/A'}</td>
                        <td>{emp.LastTransaction ? new Date(emp.LastTransaction).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Procedures;
