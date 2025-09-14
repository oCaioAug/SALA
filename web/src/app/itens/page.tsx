'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/lib/hooks/useApp';
import { Item, User } from '@/lib/types';
import { Package, Search, Plus, Filter, Grid, List } from 'lucide-react';

// Dados mockados para demonstração
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'ADMIN'
};

const ItensPage: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('itens');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { showSuccess, showError } = useApp();

  // Carregar itens da API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/items');
        
        if (!response.ok) {
          throw new Error('Erro ao carregar itens');
        }
        
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error('Erro ao carregar itens:', error);
        setError('Erro ao carregar itens');
        showError('Erro ao carregar itens');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [showError]);

  // Filtrar itens
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleAddItem = () => {
    showInfo('Funcionalidade de adicionar item será implementada em breve');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={handleNotificationClick} />
        
        <main className="flex-1 p-6">
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Itens</h1>
                <p className="text-gray-400">Gerencie todos os itens disponíveis nas salas</p>
              </div>
              <Button onClick={handleAddItem} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900">
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            </div>

            {/* Barra de busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          {loading ? (
            <LoadingSpinner size="lg" text="Carregando itens..." className="h-64" />
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">❌ {error}</div>
              <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                Tentar Novamente
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={<Package className="w-8 h-8 text-gray-400" />}
              title={searchTerm ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
              description={
                searchTerm 
                  ? 'Tente ajustar os termos de busca para encontrar itens.'
                  : 'Comece adicionando itens para gerenciar o inventário das salas.'
              }
              action={
                searchTerm 
                  ? undefined
                  : { label: 'Adicionar Primeiro Item', onClick: handleAddItem }
              }
            />
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredItems.map((item) => (
                <Card key={item.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg mb-2">{item.name}</CardTitle>
                        <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span>Quantidade: {item.quantity}</span>
                          <span>•</span>
                          <span>Sala: {item.roomId}</span>
                        </div>
                      </div>
                    </div>
                    
                    {item.specifications && (
                      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Especificações:</h4>
                        <p className="text-xs text-gray-400">{item.specifications}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        Editar
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ItensPage;
