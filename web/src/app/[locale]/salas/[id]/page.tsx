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
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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
  const { data: session } = useSession();
  const t = useTranslations("RoomDetail");
  const locale = params.locale as string;
  const roomId = params.id as string;

  // Verificar se o usuário é admin
  const isAdmin = session?.user?.role === "ADMIN";

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [room, setRoom] = useState<RoomWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

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
          throw new Error(t("notFound"));
        }
        const data = await response.json();
        setRoom(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errors.unknown"));
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
        throw new Error(t("errors.updateRoom"));
      }

      const updatedRoom = await response.json();
      setRoom(updatedRoom);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.updateRoom"));
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
        throw new Error(t("errors.addItem"));
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
      setError(err instanceof Error ? err.message : t("errors.addItem"));
    }
  };

  // Atualizar item
  const handleUpdateItem = async (
    itemData: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => {
    if (!editingItem) return;

    try {
      // Garantir que o roomId seja mantido
      const updateData = {
        ...itemData,
        roomId: editingItem.roomId || roomId, // Manter a sala atual
      };

      // Atualizar os dados do item
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(t("errors.updateItem"));
      }

      // Se há nova imagem, fazer upload
      if (imageData && imageData.hasImage && imageData.imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageData.imageFile);
        uploadFormData.append("itemName", itemData.name);
        uploadFormData.append("itemId", editingItem.id);

        await fetch("/api/items/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
      } 
      // Se a imagem foi removida, deletar da API
      else if (imageData && imageData.removeImage) {
        await fetch(`/api/items/${editingItem.id}/remove-image`, {
          method: "DELETE",
        });
      }

      // Recarregar dados da sala
      const updatedRoomResponse = await fetch(`/api/rooms/${roomId}`);
      if (updatedRoomResponse.ok) {
        const updatedRoomData = await updatedRoomResponse.json();
        setRoom(updatedRoomData);
      }
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.updateItem"));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t("confirmations.deleteItem"))) return;

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("errors.deleteItem"));
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
      setError(err instanceof Error ? err.message : t("errors.deleteItem"));
    }
  };

  if (loading) {
    return <LoadingPage message={t("loading")} />;
  }

  if (error || !room) {
    return (
      <ErrorPage
        error={error || t("notFound")}
        onRetry={() => router.push(`/${locale}/dashboard`)}
        retryLabel={t("backToDashboard")}
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
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
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
                  <span>{t("capacity", { count: room.capacity })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/salas/${roomId}/agendamentos`)}
              className="gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              {t("viewReservations")}
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t("editRoom")}
                </Button>
                <Button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("addItem")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Descrição */}
      {room.description && (
        <Card className="mb-6">
          <CardTitle className="text-lg mb-2">{t("description")}</CardTitle>
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
              <CardTitle className="text-xl">{t("roomItems")}</CardTitle>
              <CardDescription>
                {t(room.items.length === 1 ? "itemsRegisteredOne" : "itemsRegistered", { count: room.items.length })}
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
              {t("empty.title")}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {isAdmin 
                ? t("empty.descriptionAdmin")
                : t("empty.descriptionUser")
              }
            </p>
            {isAdmin && (
              <Button
                onClick={() => setIsAddItemModalOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {t("empty.addFirstItem")}
              </Button>
            )}
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
                          {t("item.quantity", { count: item.quantity })}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {item.specifications && item.specifications.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-500">
                          {t("item.specifications")}
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
                              {t("item.more", { count: item.specifications.length - 2 })}
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
        title={t("modals.editRoom")}
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
        title={t("modals.addItem")}
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
        title={t("modals.editItem")}
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

// Componente temporário para formulário de item
const ItemForm: React.FC<{
  item?: Item | null;
  onSubmit: (
    item: Omit<Item, "id" | "createdAt" | "updatedAt">,
    imageData?: any
  ) => void;
  onCancel: () => void;
}> = ({ item, onSubmit, onCancel }) => {
  const t = useTranslations("RoomDetail");
  const [formData, setFormData] = useState({
    name: item?.name || "",
    description: item?.description || "",
    specifications: item?.specifications?.join(", ") || "",
    quantity: item?.quantity?.toString() || "1",
    icon: item?.icon || "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageRemoved, setImageRemoved] = useState(false); // Flag para indicar remoção intencional

  // Para edição, mostrar imagem existente
  const existingImagePath = (item as any)?.images?.[0]?.path;

  // useEffect para definir preview da imagem existente
  React.useEffect(() => {
    if (existingImagePath && !selectedImage) {
      setImagePreview(existingImagePath.replace(
        "/api/uploads/items/images/original_",
        "/api/uploads/items/images/thumb_"
      ));
    }
  }, [existingImagePath, selectedImage]);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setImageRemoved(false); // Resetar flag de remoção
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageRemoved(true); // Marcar que a imagem foi removida intencionalmente
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
      } else if (imageRemoved) {
        // Se a imagem foi removida intencionalmente, informar para remover
        onSubmit(itemData, { hasImage: false, removeImage: true });
      } else {
        onSubmit(itemData);
      }
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      alert(error instanceof Error ? error.message : t("errors.saveItem"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
          {t("form.itemName")}
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e =>
            setFormData(prev => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={t("form.itemNamePlaceholder")}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
          {t("form.description")}
        </label>
        <textarea
          value={formData.description}
          onChange={e =>
            setFormData(prev => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={t("form.descriptionPlaceholder")}
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
          {t("form.specifications")}
        </label>
        <input
          type="text"
          value={formData.specifications}
          onChange={e =>
            setFormData(prev => ({ ...prev, specifications: e.target.value }))
          }
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={t("form.specificationsPlaceholder")}
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
            {t("form.quantity")}
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
            {t("form.icon")}
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={e =>
              setFormData(prev => ({ ...prev, icon: e.target.value }))
            }
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={t("form.iconPlaceholder")}
          />
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {t("form.iconHint")}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" disabled={uploading}>
          {uploading 
            ? t("form.saving")
            : item 
              ? t("form.updateItem")
              : t("form.addItem")
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
};

export default RoomDetailPage;
