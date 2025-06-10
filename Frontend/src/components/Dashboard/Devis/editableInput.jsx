import React from 'react';

const EditableInput = ({ 
  name, 
  value = '', 
  placeholder, 
  type = 'text', 
  onChange, 
  index = null, 
  className = '',
  min,
  max,
  step
}) => (
  <input
    type={type}
    className={`editable-input ${className}`}
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(name, e.target.value, index)}
    min={min}
    max={max}
    step={step}
  />
);

export default React.memo(EditableInput);