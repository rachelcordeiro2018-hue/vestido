import React from 'react';

const BrandIcon = ({ className = "w-6 h-6", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9 2L7 8L3 22H21L17 8L15 2H9Z" />
      <path d="M9 2Q12 3.5 15 2" />
      <path d="M7 8Q12 10 17 8" />
    </svg>
  );
};

export default BrandIcon;
