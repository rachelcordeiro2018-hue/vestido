import React from 'react';

const BrandIcon = ({ className = "w-6 h-6" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="Vitrine da Moda Logo" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default BrandIcon;
