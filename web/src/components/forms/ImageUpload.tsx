"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  previewUrl?: string | null;
  itemName?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  previewUrl,
  itemName,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSetImage = useCallback(
    (file: File) => {
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
        setError("Imagem muito grande. Tamanho máximo: 15MB");
        return;
      }

      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      validateAndSetImage(file);
    } else {
      setError("Por favor, selecione uma imagem válida.");
    }
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            validateAndSetImage(file);
          }
          break;
        }
      }
    },
    [disabled, validateAndSetImage]
  );

  React.useEffect(() => {
    if (!disabled) {
      document.addEventListener("paste", handlePaste);
      return () => {
        document.removeEventListener("paste", handlePaste);
      };
    }
  }, [disabled, handlePaste]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageRemove();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-gray-300 block">
        Imagem de Referência
      </label>

      {previewUrl ? (
        <div className="relative group">
          <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-600">
            <img
              src={previewUrl}
              alt={itemName || "Preview"}
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Clique na imagem para alterar
          </p>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-full h-48 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center gap-3
            cursor-pointer transition-colors
            ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
            }
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full">
              {isDragging ? (
                <Upload className="w-6 h-6 text-blue-500" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300">
                {isDragging
                  ? "Solte a imagem aqui"
                  : "Clique ou arraste uma imagem"}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                JPG, PNG ou WebP (máx. 15MB)
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                Ou cole da área de transferência (Ctrl+V)
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
