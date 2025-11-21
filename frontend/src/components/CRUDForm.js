import React, { useState, useEffect } from 'react';

const CRUDForm = ({ onSubmit, initialData, fields, buttonText, onCancel }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const emptyData = {};
      fields.forEach(field => {
        emptyData[field.name] = '';
      });
      setFormData(emptyData);
    }
  }, [initialData, fields]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      const emptyData = {};
      fields.forEach(field => {
        emptyData[field.name] = '';
      });
      setFormData(emptyData);
    }
  };

  const handleCancel = () => {
    const emptyData = {};
    fields.forEach(field => {
      emptyData[field.name] = '';
    });
    setFormData(emptyData);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="crud-form">
      {fields.map(field => (
        <div key={field.name} className="form-group" style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
          <label>{field.label}</label>
          {field.type === 'select' ? (
            <select
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              rows="3"
              className="form-textarea"
            />
          ) : (
            <input
              type={field.type || 'text'}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              required={field.required}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              step={field.step}
              min={field.min}
            />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: '1rem', gridColumn: '1 / -1' }}>
        <button type="submit" className="btn-primary">
          {buttonText || 'Submit'}
        </button>
        {onCancel && (
          <button 
            type="button" 
            onClick={handleCancel} 
            className="btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CRUDForm;