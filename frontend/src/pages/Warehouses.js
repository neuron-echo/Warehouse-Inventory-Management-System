import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CRUDForm from '../components/CRUDForm';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/warehouses`);
      setWarehouses(res.data);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(err.response?.data?.error || 'Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async (formData) => {
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/warehouses/${editingId}`, formData);
        setEditingId(null);
        setEditingData(null);
      } else {
        await axios.post(`${API_BASE}/warehouses`, formData);
      }
      fetchWarehouses();
    } catch (err) {
      alert('Error: ' + err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await axios.delete(`${API_BASE}/warehouses/${id}`);
        fetchWarehouses();
      } catch (err) {
        alert('Error: ' + err.response?.data?.error || err.message);
      }
    }
  };

  const handleEdit = (warehouse) => {
    setEditingId(warehouse.WarehouseID);
    setEditingData({
      Location: warehouse.Location,
      Capacity: warehouse.Capacity
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  if (loading) return <div className="loading">Loading warehouses...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Warehouses</h1>
      <CRUDForm
        onSubmit={handleAddWarehouse}
        initialData={editingData}
        fields={[
          { name: 'Location', label: 'Location', required: true },
          { name: 'Capacity', label: 'Capacity (units)', type: 'number', required: true }
        ]}
        buttonText={editingId ? 'Update Warehouse' : 'Add Warehouse'}
        onCancel={editingId ? handleCancel : undefined}
      />
      <table className="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map(warehouse => (
            <tr key={warehouse.WarehouseID}>
              <td>{warehouse.WarehouseID}</td>
              <td>{warehouse.Location}</td>
              <td>{warehouse.Capacity} units</td>
              <td>
                <div className="table-actions">
                  <button 
                    className="btn-sm btn-edit" 
                    onClick={() => handleEdit(warehouse)}
                    disabled={editingId === warehouse.WarehouseID}
                  >
                    {editingId === warehouse.WarehouseID ? 'Editing...' : 'Edit'}
                  </button>
                  <button 
                    className="btn-sm btn-danger" 
                    onClick={() => handleDelete(warehouse.WarehouseID)}
                    disabled={editingId === warehouse.WarehouseID}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Warehouses;