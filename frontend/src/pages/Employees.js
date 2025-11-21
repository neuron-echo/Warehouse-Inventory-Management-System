import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CRUDForm from '../components/CRUDForm';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/employees`);
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch employees');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingId) {
        await axios.put(`${API_BASE}/employees/${editingId}`, formData);
        setEditingId(null);
        setEditingData(null);
      } else {
        await axios.post(`${API_BASE}/employees`, formData);
      }
      await fetchEmployees();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.EmployeeID);
    setEditingData({
      Name: employee.Name,
      Role: employee.Role,
      ContactNo: employee.ContactNo,
      Email: employee.Email,
      Password: employee.Password || ''
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API_BASE}/employees/${id}`);
        await fetchEmployees();
      } catch (err) {
        alert('Error: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  if (loading) return <div className="loading">Loading employees...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>Employees Management</h1>
      
      <CRUDForm
        onSubmit={handleSubmit}
        initialData={editingData}
        fields={[
          { name: 'Name', label: 'Employee Name', required: true, placeholder: 'Enter employee name' },
          { 
            name: 'Role', 
            label: 'Role', 
            type: 'select', 
            required: true,
            options: [
              { value: 'Manager', label: 'Manager' },
              { value: 'Staff', label: 'Staff' },
              { value: 'Admin', label: 'Admin' }
            ]
          },
          { name: 'ContactNo', label: 'Contact Number', required: true, placeholder: 'XXXXXXXXXX' },
          { name: 'Email', label: 'Email Address', type: 'email', required: true, placeholder: 'employee@warehouse.in' },
          { name: 'Password', label: 'Password', type: 'password', required: !editingId, placeholder: editingId ? 'Leave blank to keep current' : 'Enter password' }
        ]}
        buttonText={editingId ? 'Update Employee' : 'Add Employee'}
        onCancel={editingId ? handleCancel : undefined}
      />

      <table className="crud-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No employees found. Add your first employee above.
              </td>
            </tr>
          ) : (
            employees.map(employee => (
              <tr key={employee.EmployeeID}>
                <td>{employee.EmployeeID}</td>
                <td>{employee.Name}</td>
                <td>
                  <span className={`badge badge-${employee.Role.toLowerCase()}`}>
                    {employee.Role}
                  </span>
                </td>
                <td>{employee.ContactNo}</td>
                <td>{employee.Email}</td>
                <td>
                  <span className={`badge ${employee.Status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                    {employee.Status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-sm btn-edit"
                      onClick={() => handleEdit(employee)}
                      disabled={editingId === employee.EmployeeID}
                    >
                      {editingId === employee.EmployeeID ? 'Editing...' : 'Edit'}
                    </button>
                    <button 
                      className="btn-sm btn-danger" 
                      onClick={() => handleDelete(employee.EmployeeID)}
                      disabled={editingId === employee.EmployeeID}
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

export default Employees;