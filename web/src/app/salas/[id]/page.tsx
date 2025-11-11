"use client";

import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Edit,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { ImageUpload } from "@/components/forms/ImageUpload";
import { RoomForm } from "@/components/forms/RoomForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { Item, Room, RoomWithItems } from "@/lib/types";

const RoomDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [room, setRoom] = useState<RoomWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Carregar dados da sala
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error("Sala não encontrada");
        }
        const data = await response.json();
        setRoom(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  const handleUpdateRoom = async (
    roomData: Omit<Room, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar sala");
      }

      const updatedRoom = await response.json();
      setRoom(updatedRoom);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar sala");
    }
  };

  const handleAddItem = async (
    itemData: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => {
    try {
      const response = await fetch("/api/rooms/" + roomId + "/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...itemData,
          roomId: roomId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar item");
      }

      const newItem = await response.json();

      // Se há imagem, fazer upload e associar ao item
      if (imageData && imageData.hasImage && imageData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageData.imageFile);
        uploadFormData.append("itemName", newItem.name);
        uploadFormData.append("itemId", newItem.id);

        await fetch("/api/items/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
      }

      // Recarregar dados da sala para pegar a imagem associada
      const roomResponse = await fetch(`/api/rooms/${roomId}`);
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        setRoom(roomData);
      } else {
        setRoom(prev =>
          prev
            ? {
                ...prev,
                items: [...prev.items, newItem],
              }
            : null
        );
      }

      setIsAddItemModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir item");
      }

      setRoom(prev =>
        prev
          ? {
              ...prev,
              items: prev.items.filter(item => item.id !== itemId),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir item");
    }
  };

  if (loading) {
    return <LoadingPage message="Carregando sala..." />;
  }

  if (error || !room) {
    return (
      <ErrorPage
        error={error || "Sala não encontrada"}
        onRetry={() => router.push("/dashboard")}
        retryLabel="Voltar ao Dashboard"
      />
    );
  }

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
    >
      {/* Header da sala */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {room.name}
            </h1>
            <div className="flex items-center gap-4">
              <StatusBadge status={room.status} />
              {room.capacity && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <div className="w-4 h-4 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-xs">👥</span>
                  </div>
                  <span>Capacidade: {room.capacity} pessoas</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/salas/${roomId}/agendamentos`)}
              className="gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Ver Agendamentos
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar Sala
            </Button>
            <Button
              onClick={() => setIsAddItemModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Item
            </Button>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {room.description && (
        <Card className="mb-6">
          <CardTitle className="text-lg mb-2">Descrição</CardTitle>
          <p className="text-slate-700 dark:text-gray-300">
            {room.description}
          </p>
        </Card>
      )}

      {/* Itens da sala */}
      <Card variant="elevated">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Itens da Sala</CardTitle>
              <CardDescription>
                {room.items.length} itens cadastrados
              </CardDescription>
            </div>
          </div>
        </div>

        {room.items.length === 0 ? (
          <div className="text-center py-12 bg-slate-100 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600/50">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Nenhum item cadastrado
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Comece adicionando itens para esta sala
            </p>
            <Button
              onClick={() => setIsAddItemModalOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Item
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {room.items.map((item: any) => {
              const itemImage =
                item.images && item.images.length > 0
                  ? item.images[0].path.replace(
                      "/api/uploads/items/images/original_",
                      "/api/uploads/items/images/thumb_"
                    )
                  : null;

              return (
                <Card
                  key={item.id}
                  variant="default"
                  hover
                  className="group overflow-hidden"
                >
                  {/* Imagem do item */}
                  {itemImage ? (
                    <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-4xl">{item.icon || "📦"}</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors duration-300">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Qtd: {item.quantity}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {item.specifications && item.specifications.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-500">
                          Especificações:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.specifications
                            .slice(0, 2)
                            .map((spec: string, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-100 dark:bg-slate-700 text-blue-700 dark:text-slate-300 px-2 py-1 rounded"
                              >
                                {spec}
                              </span>
                            ))}
                          {item.specifications.length > 2 && (
                            <span className="text-xs text-slate-600 dark:text-slate-500">
                              +{item.specifications.length - 2} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal para editar sala */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Sala"
      >
        <RoomForm
          room={room}
          onSubmit={handleUpdateRoom}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Modal para adicionar item */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Adicionar Item"
      >
        <ItemForm
          onSubmit={handleAddItem}
          onCancel={() => setIsAddItemModalOpen(false)}
        />
      </Modal>
    </PageLayout>
  );
};

// Componente temporário para formulário de item
const ItemForm: React.FC<{
  onSubmit: (
    item: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    specifications: "",
    quantity: "1",
    icon: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Criar item primeiro
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        specifications: formData.specifications
          ? formData.specifications.split(",").map(s => s.trim())
          : [],
        quantity: parseInt(formData.quantity),
        icon: formData.icon || null,
        roomId: null,
      };

      // Se há nova imagem selecionada, fazer upload após criar item
      if (selectedImage) {
        onSubmit(itemData, { hasImage: true, imageFile: selectedImage });
      } else {
        onSubmit(itemData);
      }
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar item");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
          Nome do Item
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e =>
            setFormData(prev => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Computador"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descreva o item..."
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
          Especificações (separadas por vírgula)
        </label>
        <input
          type="text"
          value={formData.specifications}
          onChange={e =>
            setFormData(prev => ({ ...prev, specifications: e.target.value }))
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Windows 11, 16GB RAM, Core i7"
        />
      </div>

      <ImageUpload
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        previewUrl={imagePreview}
        itemName={formData.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
            Quantidade
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={e =>
              setFormData(prev => ({ ...prev, quantity: e.target.value }))
            }
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
            Ícone (emoji)
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={e =>
              setFormData(prev => ({ ...prev, icon: e.target.value }))
            }
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="💻"
          />
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Opcional - usado como fallback se não houver imagem
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={uploading}>
          {uploading ? "Salvando..." : "Adicionar Item"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default RoomDetailPage;
