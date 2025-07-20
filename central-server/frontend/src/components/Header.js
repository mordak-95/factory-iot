import React, { useState, useEffect } from 'react';

const Header = ({ serverIp, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
    // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatPersianDateTime = (date) => {
    if (!date) return '';
    
    // Persian calendar options
    const persianOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      calendar: 'persian'
    };
    
    try {
      return date.toLocaleDateString('fa-IR', persianOptions);
    } catch (error) {
      // Fallback to English if Persian calendar is not supported
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  };

  const handleCopy = () => {
    if (serverIp && serverIp !== 'Error') {
      const urlToCopy = `http://${serverIp}:5000`;
      
      // Fallback method for older browsers or when clipboard API is not available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(urlToCopy)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => {
            // Fallback to document.execCommand
            fallbackCopyTextToClipboard(urlToCopy);
          });
      } else {
        // Fallback to document.execCommand
        fallbackCopyTextToClipboard(urlToCopy);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <header className={`px-6 py-4 border-b transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className={`text-xl font-bold transition-colors duration-200 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Central IoT Server</h1>
            <p className={`text-sm transition-colors duration-200 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Device Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <span className={`font-medium text-sm transition-colors duration-200 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`} dir="rtl">{formatPersianDateTime(currentTime)}</span>
          </div>
          
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <span className={`text-xs transition-colors duration-200 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Server IP: {serverIp || '...'}</span>
            <button
              className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
              onClick={handleCopy}
              disabled={!serverIp || serverIp === 'Error'}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 