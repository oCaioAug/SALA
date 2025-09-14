import React from 'react';
import { User } from '@/lib/types';

interface HeaderProps {
  user: User;
  onNotificationClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNotificationClick }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">S.A.L.A</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={onNotificationClick}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 13h6V7H4v6zM4 1h6v6H4V1z" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user.name}</p>
              <p className="text-gray-400 text-sm capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export { Header };
