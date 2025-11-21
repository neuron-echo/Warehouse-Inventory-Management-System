import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CRUDForm from '../components/CRUDForm';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/suppliers`);
      setSuppliers(res.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err.response?.data?.error || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (formData) => {
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/suppliers/${editingId}`, formData);
        setEditingId(null);
        setEditingData(null);
      } else {
        await axios.post(`${API_BASE}/suppliers`, formData);
      }
      fetchSuppliers();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`${API_BASE}/suppliers/${id}`);
        fetchSuppliers();
      } catch (err) {
        alert('Error: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.SupplierID);
    setEditingData({
      Name: supplier.Name,
      ContactNo: supplier.ContactNo,
      Email: supplier.Email,
      Address: supplier.Address
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  if (loading) return <div className="loading">Loading suppliers...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Suppliers</h1>
      <CRUDForm
        onSubmit={handleAddSupplier}
        initialData={editingData}
        fields={[
          { name: 'Name', label: 'Supplier Name', required: true },
          { name: 'ContactNo', label: 'Contact No', required: true },
          { name: 'Email', label: 'Email', type: 'email', required: true },
          { name: 'Address', label: 'Address', type: 'textarea', required: true }
        ]}
        buttonText={editingId ? 'Update Supplier' : 'Add Supplier'}
        onCancel={editingId ? handleCancel : undefined}
      />
      <table className="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No suppliers found. Add your first supplier above.
              </td>
            </tr>
          ) : (
            suppliers.map(supplier => (
              <tr key={supplier.SupplierID}>
                <td>{supplier.SupplierID}</td>
                <td>{supplier.Name}</td>
                <td>{supplier.ContactNo}</td>
                <td>{supplier.Email}</td>
                <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {supplier.Address}
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-sm btn-edit" 
                      onClick={() => handleEdit(supplier)}
                      disabled={editingId === supplier.SupplierID}
                    >
                      {editingId === supplier.SupplierID ? 'Editing...' : 'Edit'}
                    </button>
                    <button 
                      className="btn-sm btn-danger" 
                      onClick={() => handleDelete(supplier.SupplierID)}
                      disabled={editingId === supplier.SupplierID}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Suppliers;