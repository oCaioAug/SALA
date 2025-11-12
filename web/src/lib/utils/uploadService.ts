/**
 * Upload service that works both locally and on Vercel
 * Uses filesystem locally and Cloudinary on Vercel
 */

import sharp from "sharp";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const THUMBNAIL_SIZE = 200;
const AVATAR_SIZE = 300;
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
    .replace(/[^a-zA-Z0-9]/g, "_") // Substitui caracteres especiais
    .toLowerCase()
    .slice(0, 30); // Limita tamanho

  const timestamp = Date.now();
  return `${sanitizedName}_${timestamp}`;
}

/**
 * Detecta se está rodando na Vercel
 */
function isVercel(): boolean {
  const vercelEnv = process.env.VERCEL === "1";
  const vercelFlag = process.env.VERCEL_ENV !== undefined;
  const nodeEnv = process.env.NODE_ENV === "production";
  const forceCloudinary = process.env.USE_CLOUDINARY === "true";

  console.log("🔍 Environment detection:", {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    USE_CLOUDINARY: process.env.USE_CLOUDINARY,
    forceCloudinary,
  });

  // Se tem credenciais do Cloudinary e está em produção, usar Cloudinary
  const hasCloudinaryCredentials = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  console.log("☁️ Cloudinary credentials available:", hasCloudinaryCredentials);

  // Usar Cloudinary se:
  // 1. Estiver na Vercel (VERCEL=1 ou VERCEL_ENV existe)
  // 2. Ou se USE_CLOUDINARY=true estiver definido
  // 3. E se as credenciais estiverem disponíveis
  const shouldUseCloudinary =
    (vercelEnv || vercelFlag || forceCloudinary) && hasCloudinaryCredentials;

  console.log("🎯 Final decision: useCloudinary =", shouldUseCloudinary);

  return shouldUseCloudinary;
}

/**
 * Processa imagem e retorna buffers para original e thumbnail
 */
async function processImageBuffers(buffer: Buffer, filename: string) {
  // Processar imagem original (redimensionar se muito grande)
  const originalBuffer = await sharp(buffer)
    .resize(1200, 1200, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  // Criar thumbnail
  const thumbnailBuffer = await sharp(buffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "cover",
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return { originalBuffer, thumbnailBuffer };
}

/**
 * Upload usando Cloudinary (produção na Vercel)
 */
async function uploadWithCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = "sala/items"
): Promise<{ originalPath: string; thumbnailPath: string }> {
  console.log("☁️ Initiating Cloudinary upload...");

  // Verificar credenciais
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error("Credenciais do Cloudinary não configuradas");
  }

  const { v2: cloudinary } = await import("cloudinary");

  // Configurar Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log(`☁️ Cloudinary config: ${process.env.CLOUDINARY_CLOUD_NAME}`);

  const { originalBuffer, thumbnailBuffer } = await processImageBuffers(
    buffer,
    filename
  );

  try {
    // Upload da imagem original
    const originalResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            public_id: `${folder}/${filename}`,
            format: "jpg",
            quality: "auto:good",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(originalBuffer);
    });

    // Upload do thumbnail
    const thumbnailResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            public_id: `${folder}/thumb_${filename}`,
            format: "jpg",
            quality: "auto:good",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(thumbnailBuffer);
    });

    return {
      originalPath: originalResult.secure_url,
      thumbnailPath: thumbnailResult.secure_url,
    };
  } catch (error) {
    console.error("Erro no upload para Cloudinary:", error);
    throw new Error("Falha no upload da imagem");
  }
}

/**
 * Upload usando sistema de arquivos (desenvolvimento local)
 */
async function uploadWithFilesystem(
  buffer: Buffer,
  filename: string
): Promise<{ originalPath: string; thumbnailPath: string }> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const UPLOAD_DIR = path.join(
    process.cwd(),
    "public",
    "uploads",
    "items",
    "images"
  );

  // Garantir que o diretório existe
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const { originalBuffer, thumbnailBuffer } = await processImageBuffers(
    buffer,
    filename
  );

  // Salvar arquivos
  const originalFilename = `original_${filename}.jpg`;
  const thumbnailFilename = `thumb_${filename}.jpg`;

  const originalPath = path.join(UPLOAD_DIR, originalFilename);
  const thumbnailPath = path.join(UPLOAD_DIR, thumbnailFilename);

  await fs.writeFile(originalPath, originalBuffer);
  await fs.writeFile(thumbnailPath, thumbnailBuffer);

  return {
    originalPath: `/api/uploads/items/images/${originalFilename}`,
    thumbnailPath: `/api/uploads/items/images/${thumbnailFilename}`,
  };
}

/**
 * Upload principal que escolhe o método baseado no ambiente
 */
export async function uploadImage(
  buffer: Buffer,
  filename: string
): Promise<{ originalPath: string; thumbnailPath: string }> {
  if (isVercel()) {
    console.log("🌐 Uploading to Vercel using Cloudinary");
    return uploadWithCloudinary(buffer, filename, "sala/items");
  } else {
    console.log("💻 Uploading locally using filesystem");
    return uploadWithFilesystem(buffer, filename);
  }
}

/**
 * Upload de avatar (similar ao de item mas com tamanhos diferentes)
 */
export async function uploadAvatar(
  buffer: Buffer,
  filename: string
): Promise<{ originalPath: string; thumbnailPath: string }> {
  if (isVercel()) {
    console.log("🌐 Uploading avatar to Vercel using Cloudinary");
    return uploadWithCloudinary(buffer, filename, "sala/avatars");
  } else {
    // Usar filesystem para desenvolvimento local
    const fs = await import("fs/promises");
    const path = await import("path");

    const AVATARS_DIR = path.join(
      process.cwd(),
      "public",
      "uploads",
      "avatars"
    );
    await fs.mkdir(AVATARS_DIR, { recursive: true });

    const originalBuffer = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover",
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const thumbnailBuffer = await sharp(buffer)
      .resize(100, 100, {
        fit: "cover",
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    const originalFilename = `${filename}.jpg`;
    const thumbnailFilename = `thumb_${filename}.jpg`;

    const originalPath = path.join(AVATARS_DIR, originalFilename);
    const thumbnailPath = path.join(AVATARS_DIR, thumbnailFilename);

    await fs.writeFile(originalPath, originalBuffer);
    await fs.writeFile(thumbnailPath, thumbnailBuffer);

    return {
      originalPath: `/api/uploads/avatars/${originalFilename}`,
      thumbnailPath: `/api/uploads/avatars/${thumbnailFilename}`,
    };
  }
}
