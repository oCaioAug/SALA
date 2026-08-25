"use client";

import { Camera, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { getUserGradient, getUserInitials } from "@/lib/utils/userUtils";

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
  const t = useTranslations("AvatarUpload");
  const { fromPayload } = useApiErrorMessage();
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
        setError(t("invalidFormat"));
        return;
      }

      // Validar tamanho (15MB)
      const maxSize = 15 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(t("tooLarge"));
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
          throw new Error(fromPayload(errorData) || t("uploadError"));
        }

        const data = await response.json();

        // Atualizar avatar na interface
        onAvatarUpdate(data.imagePath);
        setPreviewUrl(null);

        // Sucesso implícito - o componente pai deve mostrar mensagem de sucesso
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        setError(error instanceof Error ? error.message : t("uploadError"));
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onAvatarUpdate, fromPayload, t]
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
        throw new Error(fromPayload(errorData) || t("uploadError"));
      }

      onAvatarUpdate(null);
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      setError(error instanceof Error ? error.message : t("uploadError"));
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
              alt={t("previewAlt")}
              width={120}
              height={120}
              className="w-30 h-30 rounded-lg object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
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
            className="w-30 h-30 rounded-lg object-cover group-hover:opacity-80 transition-opacity"
          />
        ) : (
          // Placeholder com iniciais
          <div
            className={`w-30 h-30 ${getGradient(userName)} rounded-lg flex items-center justify-center group-hover:opacity-80 transition-opacity`}
          >
            <span className="text-white font-bold text-3xl">
              {getInitials(userName)}
            </span>
          </div>
        )}

        {/* Overlay de hover */}
        {!isUploading && !disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
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
              {t("uploading")}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {currentAvatar ? t("change") : t("upload")}
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
                {t("removing")}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {t("remove")}
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
          {t("hint")}
        </p>
      )}
    </div>
  );
};
