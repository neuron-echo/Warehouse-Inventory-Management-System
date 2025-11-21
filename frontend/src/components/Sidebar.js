// Sidebar.js - Professional Sidebar Navigation Component
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ userType, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  // Define navigation items based on user type
  const getNavItems = () => {
    if (userType === 'customer') {
      return [
        { path: '/items', icon: '📦', label: 'Items' }
      ];
    }

    if (userType === 'employee' || userType === 'staff' || userType === 'manager') {
      return [
        { path: '/items', icon: '📦', label: 'Items' },
        { path: '/transactions', icon: '💰', label: 'Transactions' }
      ];
    }

    // Admin has access to everything
    return [
      { path: '/dashboard', icon: '📊', label: 'Dashboard' },
      { path: '/items', icon: '📦', label: 'Items' },
      { path: '/warehouses', icon: '🏭', label: 'Warehouses' },
      { path: '/suppliers', icon: '🚚', label: 'Suppliers' },
      { path: '/employees', icon: '👔', label: 'Employees' },
      { path: '/customers', icon: '👥', label: 'Customers' },
      { path: '/transactions', icon: '💰', label: 'Transactions' },
      { path: '/procedures', icon: '🔧', label: 'Procedures' }
    ];
  };

  const navItems = getNavItems();

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle Sidebar">
        {isCollapsed ? '☰' : '✕'}
      </button>

      <div className="sidebar-content">
        

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
