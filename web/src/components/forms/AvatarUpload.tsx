"use client";

import { Camera, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React, { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { cn } from "@/lib/utils";
import { getUserGradient, getUserInitials } from "@/lib/utils/userUtils";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName: string;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
  disabled?: boolean;
  layout?: "default" | "profile";
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userName,
  onAvatarUpdate,
  disabled = false,
  layout = "default",
  className,
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

  const isProfile = layout === "profile";
  const avatarClass = cn(
    "object-cover transition-opacity",
    isProfile
      ? "size-28 rounded-full ring-2 ring-border ring-offset-2 ring-offset-card sm:size-32"
      : "size-[120px] rounded-lg"
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        isProfile ? "items-start" : "items-center gap-4",
        className
      )}
    >
      {/* Avatar Display */}
      <div className="relative group">
        {previewUrl ? (
          <div className="relative">
            <Image
              src={previewUrl}
              alt={t("previewAlt")}
              width={128}
              height={128}
              className={avatarClass}
            />
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/50",
                isProfile ? "rounded-full" : "rounded-lg"
              )}
            >
              <LoadingSpinner size="md" />
            </div>
          </div>
        ) : currentAvatar ? (
          <Image
            src={currentAvatar}
            alt={`Avatar de ${userName}`}
            width={128}
            height={128}
            className={cn(avatarClass, "group-hover:opacity-90")}
          />
        ) : (
          <div
            className={cn(
              getGradient(userName),
              "flex items-center justify-center group-hover:opacity-90",
              isProfile
                ? "size-28 rounded-full ring-2 ring-border ring-offset-2 ring-offset-card sm:size-32"
                : "size-[120px] rounded-lg"
            )}
          >
            <span
              className={cn(
                "font-bold text-white",
                isProfile ? "text-2xl sm:text-3xl" : "text-3xl"
              )}
            >
              {getInitials(userName)}
            </span>
          </div>
        )}

        {!isUploading && !disabled && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100",
              isProfile ? "rounded-full" : "rounded-lg"
            )}
          >
            <Camera className="h-7 w-7 text-white" />
          </div>
        )}
      </div>

      <div className={cn("flex gap-2", isProfile && "flex-wrap")}>
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

      {error && (
        <div className="max-w-xs text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!error && !isProfile && (
        <p className="max-w-xs text-center text-xs text-slate-500 dark:text-gray-400">
          {t("hint")}
        </p>
      )}
    </div>
  );
};
