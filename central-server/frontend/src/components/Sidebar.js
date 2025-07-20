import React from 'react';
import { 
  Search, 
  Plus, 
  List, 
  Zap, 
  Settings, 
  User, 
  Sun,
  Moon,
  Server,
  Activity
} from 'lucide-react';

const Sidebar = ({ isDarkMode, setIsDarkMode }) => {
  const menuItems = [
    { icon: Search, label: 'Search', active: false },
    { icon: Plus, label: 'Add Device', active: false },
    { icon: Server, label: 'Devices', active: true },
    { icon: Activity, label: 'Activity', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-6">
      {/* Dark/Light Mode Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col space-y-2">
        {menuItems.map((item, index) => (
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
        ))}
      </div>

      {/* User Profile */}
      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
        <User className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};

export default Sidebar; 