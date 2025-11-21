// App.js - Main React Application
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import Warehouses from './pages/Warehouses';
import Items from './pages/Items';
import Transactions from './pages/Transactions';
import Procedures from './pages/Procedures';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';

const API_BASE = 'http://localhost:5000/api';

// Protected Route Component
function ProtectedRoute({ children, user, allowedRoles }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || 'customer';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/items" replace />;
    }
  }

  return children;
}

// Navigation Component
function Navigation({ user, onLogout }) {
  const navigate = useNavigate();
  
  if (!user) return null;

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Define which links are visible based on user role
  const canViewCustomers = user.role === 'admin' || user.role === 'manager' || user.role === 'staff';
  const canViewSuppliers = user.role === 'admin';
  const canViewEmployees = user.role === 'admin';
  const canViewWarehouses = user.role === 'admin';
  const canViewItems = true; // All users can view items
  const canViewTransactions = user.role === 'admin' || user.role === 'manager' || user.role === 'staff';
  const canViewDashboard = user.role === 'admin';

  return (
    <nav className="navbar">
      <div className="nav-brand">📦 Warehouse Inventory System</div>
      <ul className="nav-links">
        {canViewDashboard && <li><Link to="/">Dashboard</Link></li>}
        <li><Link to="/items">Items</Link></li>
        {canViewTransactions && <li><Link to="/transactions">Transactions</Link></li>}
        {canViewCustomers && <li><Link to="/customers">Customers</Link></li>}
        {canViewSuppliers && <li><Link to="/suppliers">Suppliers</Link></li>}
        {canViewEmployees && <li><Link to="/employees">Employees</Link></li>}
        {canViewWarehouses && <li><Link to="/warehouses">Warehouses</Link></li>}
      </ul>
      <div className="nav-user">
        <span className="user-info">
          👤 {user.name} ({user.role})
        </span>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navigation user={user} onLogout={handleLogout} />
        {user && <Sidebar userType={user.role} onToggle={setSidebarCollapsed} />}
        <div className={`main-content ${user && !sidebarCollapsed ? 'with-sidebar' : ''} ${user && sidebarCollapsed ? 'with-sidebar-collapsed' : ''}`}>
          <ErrorBoundary>
            <Routes>
              {/* Login Route */}
              <Route 
                path="/login" 
                element={
                  user ? <Navigate to="/items" replace /> : <Login onLogin={handleLogin} />
                } 
              />

              {/* Sign Up Route - Customer Only */}
              <Route 
                path="/signup" 
                element={
                  user ? <Navigate to="/items" replace /> : <SignUp />
                } 
              />

              {/* Dashboard - Admin Only */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Dashboard Route - Admin Only */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Items - All authenticated users */}
              <Route 
                path="/items" 
                element={
                  <ProtectedRoute user={user}>
                    <Items user={user} />
                  </ProtectedRoute>
                } 
              />

              {/* Transactions - Employees (Staff, Manager, Admin) */}
              <Route 
                path="/transactions" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['staff', 'manager', 'admin']}>
                    <Transactions />
                  </ProtectedRoute>
                } 
              />

              {/* Customers - Admin Only (Removed from Employee Access) */}
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Customers />
                  </ProtectedRoute>
                } 
              />

              {/* Suppliers - Admin Only */}
              <Route 
                path="/suppliers" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Suppliers />
                  </ProtectedRoute>
                } 
              />

              {/* Employees - Admin Only */}
              <Route 
                path="/employees" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Employees />
                  </ProtectedRoute>
                } 
              />

              {/* Warehouses - Admin Only */}
              <Route 
                path="/warehouses" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Warehouses />
                  </ProtectedRoute>
                } 
              />

              {/* Procedures - Admin Only */}
              <Route 
                path="/procedures" 
                element={
                  <ProtectedRoute user={user} allowedRoles={['admin']}>
                    <Procedures />
                  </ProtectedRoute>
                } 
              />

              {/* Redirect to login if not authenticated */}
              <Route path="*" element={<Navigate to={user ? "/items" : "/login"} replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </div>
    </Router>
  );
}

export default App;