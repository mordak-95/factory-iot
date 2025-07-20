import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sun,
  Moon,
  Server,
  Heart
} from 'lucide-react';

const Sidebar = ({ isDarkMode, setIsDarkMode }) => {
  const location = useLocation();
  
  const menuItems = [
    { 
      icon: Server, 
      label: 'Devices', 
      path: '/',
      active: location.pathname === '/'
    },
    { 
      icon: Heart, 
      label: 'Health Check', 
      path: '/health',
      active: location.pathname === '/health'
    }
  ];

  return (
    <div className={`w-16 border-r flex flex-col items-center py-4 space-y-6 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Dark/Light Mode Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col space-y-2">
        {menuItems.map((item, index) => (
          item.path ? (
            <Link
              key={index}
              to={item.path}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                item.active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ) : (
            <button
              key={index}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                item.active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </button>
          )
        ))}
      </div>


    </div>
  );
};

export default Sidebar; 