import React from 'react';
import { motion } from 'framer-motion';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxValue?: string;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = "0.0",
  disabled = false,
  maxValue = "0",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Only allow numbers and decimal point
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleMaxClick = () => {
    if (maxValue && parseFloat(maxValue) > 0) {
      onChange(maxValue);
    }
  };

  return (
    <div className="flex-1 flex items-center">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-transparent text-right text-base sm:text-lg font-semibold outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white disabled:cursor-not-allowed transition-colors duration-300"
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMaxClick}
        className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-all duration-200"
      >
        MAX
      </motion.button>
    </div>
  );
};

export default AmountInput;



