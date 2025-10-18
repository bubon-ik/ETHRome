import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const DarkModeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Only run in browser
    if (typeof window !== 'undefined') {
      // Check localStorage for saved theme preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        const isDark = savedTheme === 'dark';
        setIsDarkMode(isDark);
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
    }
  };

  if (!mounted) {
    // Return a placeholder that matches the button size to prevent layout shift
    return (
      <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleDarkMode}
      className={`
        relative inline-flex items-center justify-center
        w-12 h-12 rounded-xl transition-all duration-300
        backdrop-blur-sm border shadow-lg
        ${isDarkMode 
          ? 'bg-black/20 text-yellow-400 hover:bg-black/30 border-white/20' 
          : 'bg-white/20 text-gray-600 hover:bg-white/30 border-white/30'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
      `}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: isDarkMode ? 180 : 0,
          scale: isDarkMode ? 1 : 1
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative"
      >
        {isDarkMode ? (
          <MoonIcon className="w-6 h-6" />
        ) : (
          <SunIcon className="w-6 h-6" />
        )}
      </motion.div>
      
      {/* Glow effect for dark mode */}
      {isDarkMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl bg-yellow-400/20 blur-sm -z-10"
        />
      )}
    </motion.button>
  );
};

export default DarkModeToggle;
