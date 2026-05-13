import React from 'react';
import './Button.css';

export const Button = ({ children, onClick, variant = 'primary', className = '' }) => {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
