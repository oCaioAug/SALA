import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Settings, 
  Building2,
  ChevronRight,
  Calendar,
  ClipboardList,
  Bell
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isNavigating?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isNavigating = false }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      description: 'Dashboard principal',
      active: currentPage === 'dashboard'
    },
    {
      id: 'solicitacoes',
      label: 'Solicitações',
      icon: ClipboardList,
      description: 'Aprovar reservas pendentes',
      active: currentPage === 'solicitacoes'
    },
    {
      id: 'agendamentos',
      label: 'Agendamentos',
      icon: Calendar,
      description: 'Calendário de reservas',
      active: currentPage === 'agendamentos'
    },
    // {
    //   id: 'notificacoes',
    //   label: 'Notificações',
    //   icon: Bell,
    //   description: 'Central de notificações',
    //   active: currentPage === 'notificacoes'
    // },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      description: 'Configurações do sistema',
      active: currentPage === 'configuracoes'
    }
  ];

  return (
    <div className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 h-full flex flex-col border-r border-slate-700/50 shadow-2xl">
      {/* Header com logo melhorado */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">S.A.L.A</h1>
            <p className="text-xs text-slate-400 font-medium">Sistema de Gerenciamento</p>
          </div>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mt-4"></div>
      </div>
      
      {/* Navegação melhorada */}
      <nav className="flex-1 px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Navegação
          </h2>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    disabled={isNavigating}
                    className={cn(
                      'group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-300 relative overflow-hidden',
                      item.active
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-lg border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md',
                      isNavigating && !item.active && 'opacity-50 cursor-not-allowed',
                      isNavigating && item.active && 'animate-pulse'
                    )}
                  >
                    {/* Efeito de hover */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300',
                      !item.active && 'group-hover:opacity-100'
                    )}></div>
                    
                    {/* Ícone */}
                    <div className={cn(
                      'relative z-10 p-2 rounded-lg transition-all duration-300',
                      item.active 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-600 group-hover:text-white'
                    )}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.label}</div>
                      <div className={cn(
                        'text-xs truncate transition-colors duration-300',
                        item.active ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-300'
                      )}>
                        {item.description}
                      </div>
                    </div>
                    
                    {/* Indicador de ativo */}
                    {item.active && (
                      <div className="relative z-10 w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                    )}
                    
                    {/* Loading spinner */}
                    {isNavigating && item.active && (
                      <div className="relative z-10 ml-auto w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    )}
                    
                    {/* Seta de navegação */}
                    {!item.active && (
                      <ChevronRight className="relative z-10 w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors duration-300" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Status do sistema */}
        <div className="mt-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-slate-300">Sistema Online</span>
          </div>
          <p className="text-xs text-slate-500">Última atualização: agora</p>
        </div>
      </nav>
    </div>
  );
};

export { Sidebar };
