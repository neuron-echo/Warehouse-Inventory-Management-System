import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState({
    inventoryValue: [],
    supplierPerf: [],
    lowStock: [],
    inventoryReport: [],
    employeeSummary: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportWarehouseId, setReportWarehouseId] = useState('');
  const [employeeSummaryId, setEmployeeSummaryId] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchAnalytics();
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [warehousesRes, employeesRes] = await Promise.all([
        axios.get(`${API_BASE}/warehouses`),
        axios.get(`${API_BASE}/employees`)
      ]);
      setWarehouses(warehousesRes.data);
      setEmployees(employeesRes.data);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [invRes, perfRes, lowRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/inventory-value`),
        axios.get(`${API_BASE}/analytics/supplier-performance`),
        axios.get(`${API_BASE}/analytics/low-stock/100`)
      ]);

      setData(prev => ({
        ...prev,
        inventoryValue: invRes.data || [],
        supplierPerf: perfRes.data || [],
        lowStock: lowRes.data || []
      }));
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => 
    `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handleGenerateReport = async () => {
    try {
      const url = reportWarehouseId 
        ? `${API_BASE}/procedures/inventory-report/${reportWarehouseId}`
        : `${API_BASE}/procedures/inventory-report`;
      
      const response = await axios.get(url);
      setData(prev => ({ ...prev, inventoryReport: response.data.report }));
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate inventory report');
    }
  };

  const handleEmployeeSummary = async () => {
    try {
      const url = employeeSummaryId 
        ? `${API_BASE}/procedures/employee-summary/${employeeSummaryId}`
        : `${API_BASE}/procedures/employee-summary`;
      
      const response = await axios.get(url);
      setData(prev => ({ ...prev, employeeSummary: response.data.summary }));
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Failed to generate employee summary');
    }
  };

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Dashboard</h1>

      <div className="dashboard-grid">
        {/* Inventory Value Cards */}
        <div className="dashboard-card">
          <h2>💰 Warehouse Inventory Value</h2>
          <div className="table-container">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Warehouse</th>
                  <th>Total Value</th>
                  <th>Items</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {data.inventoryValue && data.inventoryValue.length > 0 ? (
                  data.inventoryValue.map((warehouse, index) => (
                    <tr key={index}>
                      <td><strong>{warehouse.Location}</strong></td>
                      <td className="currency">{formatCurrency(warehouse.TotalInventoryValue)}</td>
                      <td>{warehouse.TotalItems}</td>
                      <td>{warehouse.TotalQuantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#666' }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="dashboard-card">
          <h2>⚠️ Low Stock Alert</h2>
          <div className="table-container">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Stock</th>
                  <th>Location</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock && data.lowStock.length > 0 ? (
                  data.lowStock.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.Name}</strong></td>
                      <td>
                        <span className="badge badge-red">{item.StockQuantity}</span>
                      </td>
                      <td>{item.Location}</td>
                      <td className="currency">{formatCurrency(item.Price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#28a745' }}>
                      ✓ All items are well stocked!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Performance */}
        <div className="dashboard-card full-width">
          <h2>📦 Supplier Performance</h2>
          <div className="table-container">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Items Supplied</th>
                  <th>Total Quantity</th>
                  <th>Total Value</th>
                  <th>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {data.supplierPerf && data.supplierPerf.length > 0 ? (
                  data.supplierPerf.map((supplier, index) => (
                    <tr key={index}>
                      <td><strong>{supplier.Name}</strong></td>
                      <td>{supplier.ItemsSupplied}</td>
                      <td>{supplier.TotalQuantitySupplied}</td>
                      <td className="currency">{formatCurrency(supplier.TotalValue)}</td>
                      <td className="currency">{formatCurrency(supplier.AvgItemPrice)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Report using Stored Procedure */}
        <div className="dashboard-card full-width">
          <h2>📊 Inventory Report (Stored Procedure)</h2>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Warehouse :
              </label>
              <select
                value={reportWarehouseId}
                onChange={(e) => setReportWarehouseId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
              >
                <option value="">All Warehouses</option>
                {warehouses.map(wh => (
                  <option key={wh.WarehouseID} value={wh.WarehouseID}>
                    {wh.Location}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateReport}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Generate Report
            </button>
          </div>
          {data.inventoryReport && data.inventoryReport.length > 0 && (
            <div className="table-container">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Total Value</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inventoryReport.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.ItemName}</strong></td>
                      <td>{item.Category}</td>
                      <td>{item.StockQuantity}</td>
                      <td className="currency">{formatCurrency(item.Price)}</td>
                      <td className="currency">{formatCurrency(item.TotalValue)}</td>
                      <td>{item.WarehouseLocation}</td>
                      <td>
                        <span className={`badge ${
                          item.StockStatus === 'Good Stock' ? 'badge-green' :
                          item.StockStatus === 'Medium Stock' ? 'badge-yellow' : 'badge-red'
                        }`}>
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

        {/* Employee Summary using Stored Procedure */}
        <div className="dashboard-card full-width">
          <h2>👤 Employee Transaction Summary (Stored Procedure)</h2>
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Employee :
              </label>
              <select
                value={employeeSummaryId}
                onChange={(e) => setEmployeeSummaryId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', minWidth: '200px' }}
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
              style={{
                padding: '0.5rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Get Summary
            </button>
          </div>
          {data.employeeSummary && data.employeeSummary.length > 0 && (
            <div className="table-container">
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
                  </tr>
                </thead>
                <tbody>
                  {data.employeeSummary.map((emp, idx) => (
                    <tr key={idx}>
                      <td><strong>{emp.EmployeeName}</strong></td>
                      <td>{emp.Role}</td>
                      <td>{emp.TotalTransactions}</td>
                      <td>{emp.InboundTransactions}</td>
                      <td>{emp.OutboundTransactions}</td>
                      <td>{emp.TotalItemsReceived}</td>
                      <td>{emp.TotalItemsShipped}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;