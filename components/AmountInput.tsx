import React from 'react';
import { motion } from 'framer-motion';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = "0.0",
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Only allow numbers and decimal point
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleMaxClick = () => {
    // TODO: Implement max balance functionality
    onChange('100');
  };

  return (
    <div className="flex-1 flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent text-right text-lg font-semibold outline-none placeholder-gray-400 disabled:cursor-not-allowed"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMaxClick}
        className="ml-2 px-2 py-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
      >
        MAX
      </motion.button>
    </div>
  );
};

export default AmountInput;
