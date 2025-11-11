import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "items",
  "images"
);
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const THUMBNAIL_SIZE = 200;
const JPEG_QUALITY = 85;

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Formato de imagem não suportado. Use JPG, PNG ou WebP.",
    };
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Imagem muito grande. Tamanho máximo: ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`,
    };
  }

  return { valid: true };
}

/**
 * Gera um nome de arquivo único baseado no nome do item
 */
export function generateFilename(itemName: string): string {
  // Remove caracteres especiais e espaços, substitui por underscore
  const sanitizedName = itemName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();

  // Gera 4 dígitos aleatórios
  const randomDigits = Math.floor(1000 + Math.random() * 9000);

  return `${sanitizedName}_${randomDigits}.jpg`;
}

/**
 * Processa e salva a imagem (converte para JPG, redimensiona, cria thumbnail)
 */
export async function processAndSaveImage(
  buffer: Buffer,
  filename: string
): Promise<{ originalPath: string; thumbnailPath: string }> {
  // Garantir que o diretório existe
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const originalFilename = `original_${filename}`;
  const thumbnailFilename = `thumb_${filename}`;

  const originalPath = path.join(UPLOAD_DIR, originalFilename);
  const thumbnailPath = path.join(UPLOAD_DIR, thumbnailFilename);

  // Processar imagem original (converter para JPG, qualidade 85%)
  await sharp(buffer).jpeg({ quality: JPEG_QUALITY }).toFile(originalPath);

  // Criar thumbnail 200x200
  await sharp(buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "cover",
      position: "center",
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(thumbnailPath);

  return {
    originalPath: `/api/uploads/items/images/${originalFilename}`,
    thumbnailPath: `/api/uploads/items/images/${thumbnailFilename}`,
  };
}

/**
 * Deleta arquivos de imagem
 */
export async function deleteImageFiles(filename: string): Promise<void> {
  const originalFilename = `original_${filename}`;
  const thumbnailFilename = `thumb_${filename}`;

  const originalPath = path.join(UPLOAD_DIR, originalFilename);
  const thumbnailPath = path.join(UPLOAD_DIR, thumbnailFilename);

  try {
    await fs.unlink(originalPath);
  } catch (_error) {
    // Arquivo pode não existir, ignorar erro
  }

  try {
    await fs.unlink(thumbnailPath);
  } catch (_error) {
    // Arquivo pode não existir, ignorar erro
  }
}
