"use client";

import { Camera, Upload, X, Trash2 } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getUserInitials, getUserGradient } from "@/lib/utils/userUtils";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName: string;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userName,
  onAvatarUpdate,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateAndUploadAvatar = useCallback(
    async (file: File) => {
      setError(null);

      // Validar tipo
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setError("Formato não suportado. Use JPG, PNG ou WebP.");
        return;
      }

      // Validar tamanho (15MB)
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("Imagem muito grande. Máximo 15MB.");
        return;
      }

      try {
        setIsUploading(true);

        // Criar preview local
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Fazer upload
        const formData = new FormData();
        formData.append("avatar", file);

        const response = await fetch("/api/users/avatar", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao fazer upload do avatar");
        }

        const data = await response.json();

        // Atualizar avatar na interface
        onAvatarUpdate(data.imagePath);
        setPreviewUrl(null);

        // Sucesso implícito - o componente pai deve mostrar mensagem de sucesso
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        setError(
          error instanceof Error ? error.message : "Erro ao fazer upload"
        );
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onAvatarUpdate]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUploadAvatar(file);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsRemoving(true);
      setError(null);

      const response = await fetch("/api/users/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao remover avatar");
      }

      onAvatarUpdate(null);
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      setError(
        error instanceof Error ? error.message : "Erro ao remover avatar"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Gerar iniciais do nome (primeira letra do primeiro e último nome)
  const getInitials = (name: string) => {
    return getUserInitials(name);
  };

  // Gerar gradiente baseado no nome
  const getGradient = (name: string) => {
    return getUserGradient(name);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display */}
      <div className="relative group">
        {previewUrl ? (
          // Preview durante upload
          <div className="relative">
            <Image
              src={previewUrl}
              alt="Preview do avatar"
              width={120}
              height={120}
              className="w-30 h-30 rounded-2xl object-cover shadow-xl"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          </div>
        ) : currentAvatar ? (
          // Avatar atual
          <Image
            src={currentAvatar}
            alt={`Avatar de ${userName}`}
            width={120}
            height={120}
            className="w-30 h-30 rounded-2xl object-cover shadow-xl group-hover:opacity-80 transition-opacity"
          />
        ) : (
          // Placeholder com iniciais
          <div
            className={`w-30 h-30 bg-gradient-to-br ${getGradient(userName)} rounded-2xl flex items-center justify-center shadow-xl group-hover:opacity-80 transition-opacity`}
          >
            <span className="text-white font-bold text-3xl">
              {getInitials(userName)}
            </span>
          </div>
        )}

        {/* Overlay de hover */}
        {!isUploading && !disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={disabled || isUploading || isRemoving}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <LoadingSpinner size="sm" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {currentAvatar ? "Alterar" : "Enviar"}
            </>
          )}
        </Button>

        {currentAvatar && !isUploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveAvatar}
            disabled={disabled || isRemoving}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            {isRemoving ? (
              <>
                <LoadingSpinner size="sm" />
                Removendo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Remover
              </>
            )}
          </Button>
        )}
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Erro */}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Dica de formato */}
      {!error && (
        <p className="text-xs text-slate-500 dark:text-gray-400 text-center max-w-xs">
          JPG, PNG ou WebP • Máximo 15MB
        </p>
      )}
    </div>
  );
};
