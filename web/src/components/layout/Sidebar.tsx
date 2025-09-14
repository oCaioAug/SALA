import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: '📁',
      active: currentPage === 'dashboard'
    },
    {
      id: 'itens',
      label: 'Itens',
      icon: '💻',
      active: currentPage === 'itens'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: '⚙️',
      active: currentPage === 'configuracoes'
    }
  ];

  return (
    <div className="w-64 bg-gray-900 h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">S.A.L.A</h1>
        <p className="text-sm text-gray-400">Sistema de Gerenciamento de Salas</p>
      </div>
      
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                  item.active
                    ? 'bg-yellow-500 text-gray-900 font-medium'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export { Sidebar };
