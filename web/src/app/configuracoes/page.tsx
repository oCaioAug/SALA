'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/hooks/useApp';
import { User } from '@/lib/types';
import { Settings, User as UserIcon, Bell, Shield, Database, Palette } from 'lucide-react';

// Dados mockados para demonstração
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'ADMIN'
};

const ConfiguracoesPage: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('configuracoes');
  const { showInfo } = useApp();

  // Função de navegação
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    switch (page) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'itens':
        router.push('/itens');
        break;
      case 'configuracoes':
        router.push('/configuracoes');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const handleNotificationClick = () => {
    console.log('Notificação clicada');
  };

  const configuracoesItems = [
    {
      id: 'perfil',
      title: 'Perfil do Usuário',
      description: 'Gerencie suas informações pessoais e preferências',
      icon: <UserIcon className="w-6 h-6" />,
      action: () => showInfo('Configurações de perfil serão implementadas em breve')
    },
    {
      id: 'notificacoes',
      title: 'Notificações',
      description: 'Configure como e quando receber notificações',
      icon: <Bell className="w-6 h-6" />,
      action: () => showInfo('Configurações de notificações serão implementadas em breve')
    },
    {
      id: 'seguranca',
      title: 'Segurança',
      description: 'Gerencie senhas e configurações de segurança',
      icon: <Shield className="w-6 h-6" />,
      action: () => showInfo('Configurações de segurança serão implementadas em breve')
    },
    {
      id: 'banco-dados',
      title: 'Banco de Dados',
      description: 'Configurações do banco de dados e backup',
      icon: <Database className="w-6 h-6" />,
      action: () => showInfo('Configurações de banco de dados serão implementadas em breve')
    },
    {
      id: 'aparencia',
      title: 'Aparência',
      description: 'Personalize o tema e visual da aplicação',
      icon: <Palette className="w-6 h-6" />,
      action: () => showInfo('Configurações de aparência serão implementadas em breve')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={handleNotificationClick} />
        
        <main className="flex-1 p-6">
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">Configurações</h1>
                <p className="text-gray-400">Gerencie as configurações do sistema</p>
              </div>
            </div>
          </div>

          {/* Grid de configurações */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configuracoesItems.map((item) => (
              <Card 
                key={item.id} 
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={item.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">{item.title}</CardTitle>
                      <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                        }}
                      >
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informações do sistema */}
          <div className="mt-12">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Versão:</span>
                    <span className="text-white ml-2">1.0.0</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Última atualização:</span>
                    <span className="text-white ml-2">Hoje</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status do banco:</span>
                    <span className="text-green-500 ml-2">Conectado</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Usuário atual:</span>
                    <span className="text-white ml-2">{mockUser.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
