"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { Room, User, Item, Image } from "@/lib/types";

const RoomItemsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [currentPage, setCurrentPage] = useState("salas");
  const [room, setRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Hook de navegação
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Carregar dados da sala e itens
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Carregar dados da sala
        const roomResponse = await fetch(`/api/rooms/${roomId}`);
        if (!roomResponse.ok) {
          throw new Error("Sala não encontrada");
        }
        const roomData = await roomResponse.json();
        setRoom(roomData);

        // Carregar itens da sala
        const itemsResponse = await fetch(`/api/rooms/${roomId}/items`);
        if (!itemsResponse.ok) {
          throw new Error("Erro ao carregar itens");
        }
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchData();
    }
  }, [roomId]);

  const handleAddItem = async (
    itemData: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
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

      // Recarregar itens para pegar a imagem associada
      const itemsResponse = await fetch(`/api/rooms/${roomId}/items`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      } else {
        setItems((prev) => [...prev, newItem]);
      }

      setIsAddItemModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar item");
    }
  };

  const handleUpdateItem = async (
    itemData: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar item");
      }

      const updatedItem = await response.json();

      // Se há nova imagem, fazer upload e associar ao item
      if (imageData && imageData.hasImage && imageData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageData.imageFile);
        uploadFormData.append("itemName", updatedItem.name);
        uploadFormData.append("itemId", updatedItem.id);

        await fetch("/api/items/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
      }

      // Recarregar itens para pegar a imagem atualizada
      const itemsResponse = await fetch(`/api/rooms/${roomId}/items`);
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        setItems(itemsData);
      } else {
        setItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
        );
      }

      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja deletar este item?")) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar item");
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar item");
    }
  };

  if (loading) {
    return <LoadingPage message="Carregando itens..." />;
  }

  if (error || !room) {
    return (
      <ErrorPage
        error={error || "Sala não encontrada"}
        onRetry={() => router.push(`/salas/${roomId}`)}
        retryLabel="Voltar à Sala"
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Itens da Sala: {room.name}
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            {items.length} itens cadastrados
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            ← Voltar
          </Button>
          <Button onClick={() => setIsAddItemModalOpen(true)}>
            + Adicionar Item
          </Button>
        </div>
      </div>

      {/* Lista de itens */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-slate-500 dark:text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-xl mb-2 text-slate-900 dark:text-white">
                Nenhum item cadastrado
              </p>
              <p className="text-sm text-slate-600 dark:text-gray-400">
                Comece adicionando itens para esta sala
              </p>
            </div>
            <Button onClick={() => setIsAddItemModalOpen(true)}>
              Adicionar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => {
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
                className="hover:shadow-xl transition-shadow overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Imagem do item */}
                  {itemImage ? (
                    <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <span className="text-5xl">{item.icon || "📦"}</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                        className="flex-1"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex-1"
                      >
                        Deletar
                      </Button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-slate-700 dark:text-gray-300 text-sm mb-4 mt-4">
                      {item.description}
                    </p>
                  )}

                  {item.specifications && item.specifications.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-600 dark:text-gray-500 font-medium mb-2">
                        Especificações:
                      </p>
                      <ul className="text-xs text-slate-600 dark:text-gray-400 space-y-1">
                        {item.specifications.map(
                          (spec: string, index: number) => (
                            <li key={index} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                              {spec}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

      {/* Modal para editar item */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Item"
      >
        <ItemForm
          item={editingItem}
          onSubmit={handleUpdateItem}
          onCancel={() => setEditingItem(null)}
        />
      </Modal>
    </PageLayout>
  );
};

// Componente para formulário de item
const ItemForm: React.FC<{
  item?: (Item & { images?: Image[] }) | null;
  onSubmit: (
    item: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => void;
  onCancel: () => void;
}> = ({ item, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    specifications: item?.specifications.join(", ") || "",
    quantity: item?.quantity.toString() || "1",
    icon: item?.icon || "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    item?.images && item.images.length > 0
      ? item.images[0].path.replace(
          "/api/uploads/items/images/original_",
          "/api/uploads/items/images/thumb_"
        )
      : null
  );
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
    setImagePreview(
      item?.images && item.images.length > 0
        ? item.images[0].path.replace(
            "/api/uploads/items/images/original_",
            "/api/uploads/items/images/thumb_"
          )
        : null
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Criar/atualizar item primeiro
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        specifications: formData.specifications
          ? formData.specifications.split(",").map((s) => s.trim())
          : [],
        quantity: parseInt(formData.quantity),
        icon: formData.icon || null,
        roomId: null,
      };

      // Se há nova imagem selecionada, fazer upload após criar/atualizar item
      if (selectedImage) {
        // Primeiro criar/atualizar o item
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
          Nome do Item *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
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
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
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
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, specifications: e.target.value }))
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
            Quantidade *
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, quantity: e.target.value }))
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
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, icon: e.target.value }))
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
          {uploading
            ? "Salvando..."
            : item
            ? "Atualizar Item"
            : "Adicionar Item"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={uploading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default RoomItemsPage;
