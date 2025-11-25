import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: '日记生成' },
  { path: '/reports', label: '周报/月报' },
  { path: '/growth', label: '成长记录' },
  { path: '/treehole', label: '情绪树洞' }
];

export default function Sidebar({ onDeleteClick }) {
  const location = useLocation();
  
  return (
    <aside className="w-full md:w-48 bg-amber-100 p-4 md:p-6 shadow-lg flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible">
      <h1 className="text-xl md:text-2xl font-bold text-amber-800 mb-0 md:mb-6 md:mb-8 mr-4 md:mr-0 whitespace-nowrap">我的日记</h1>
      <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 md:space-y-4 flex-1">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`block py-2 md:py-3 px-3 md:px-4 rounded-lg transition-colors text-sm md:text-base whitespace-nowrap ${
              location.pathname === item.path
                ? 'bg-amber-200 text-amber-900 font-semibold'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={onDeleteClick}
        className="ml-2 md:ml-0 mt-0 md:mt-4 py-2 px-3 md:px-4 text-xs md:text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
      >
        清除所有数据
      </button>
    </aside>
  );
}

