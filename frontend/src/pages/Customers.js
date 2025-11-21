import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CRUDForm from '../components/CRUDForm';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.error || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (formData) => {
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/customers/${editingId}`, formData);
        setEditingId(null);
        setEditingData(null);
      } else {
        await axios.post(`${API_BASE}/customers`, formData);
      }
      fetchCustomers();
    } catch (err) {
      alert('Error: ' + err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_BASE}/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        alert('Error: ' + err.response?.data?.error || err.message);
      }
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.CustomerID);
    setEditingData({
      Name: customer.Name,
      ContactNo: customer.ContactNo,
      Email: customer.Email,
      Password: customer.Password || ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  if (loading) return <div className="loading">Loading customers...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Customers</h1>
      <CRUDForm
        onSubmit={handleAddCustomer}
        initialData={editingData}
        fields={[
          { name: 'Name', label: 'Customer Name', required: true, placeholder: 'Enter customer name' },
          { name: 'ContactNo', label: 'Contact Number', required: true, placeholder: 'XXXXXXXXXX' },
          { name: 'Email', label: 'Email Address', type: 'email', required: true, placeholder: 'customer@example.com' },
          { name: 'Password', label: 'Password', type: 'password', required: !editingId, placeholder: editingId ? 'Leave blank to keep current' : 'Enter password' }
        ]}
        buttonText={editingId ? 'Update Customer' : 'Add Customer'}
        onCancel={editingId ? handleCancel : undefined}
      />
      <table className="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer.CustomerID}>
              <td>{customer.CustomerID}</td>
              <td>{customer.Name}</td>
              <td>{customer.ContactNo}</td>
              <td>{customer.Email}</td>
              <td>
                <div className="table-actions">
                  <button 
                    className="btn-sm btn-edit" 
                    onClick={() => handleEdit(customer)}
                    disabled={editingId === customer.CustomerID}
                  >
                    {editingId === customer.CustomerID ? 'Editing...' : 'Edit'}
                  </button>
                  <button 
                    className="btn-sm btn-danger" 
                    onClick={() => handleDelete(customer.CustomerID)}
                    disabled={editingId === customer.CustomerID}
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

export default Customers;