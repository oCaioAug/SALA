import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Room, RoomStatus } from '@/lib/types';

interface RoomFormProps {
  room?: Room;
  onSubmit: (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({ room, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: room?.name || '',
    description: room?.description || '',
    capacity: room?.capacity?.toString() || '',
    status: (room?.status || 'LIVRE') as RoomStatus
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      status: formData.status
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome da Sala"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        placeholder="Ex: Laboratório de Robótica"
        error={errors.name}
        required
      />
      
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Descrição
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Descreva a sala e seus equipamentos..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <Input
        label="Capacidade"
        name="capacity"
        type="number"
        value={formData.capacity}
        onChange={handleInputChange}
        placeholder="Ex: 30"
        min="1"
      />
      
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="LIVRE">Livre</option>
          <option value="EM_USO">Em Uso</option>
          <option value="RESERVADO">Reservado</option>
        </select>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {room ? 'Atualizar Sala' : 'Criar Sala'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export { RoomForm };
