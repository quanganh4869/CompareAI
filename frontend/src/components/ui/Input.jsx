import React from 'react';
import './Input.css';

export const Input = ({ label, type = 'text', placeholder = '', value, onChange, className = '' }) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input
        className="input-field"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};
