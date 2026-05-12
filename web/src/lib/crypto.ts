import crypto from "crypto";

// Chave padrão usada localmente se ENCRYPTION_KEY não estiver definido no ambiente
const SECRET_KEY_SOURCE =
  process.env.ENCRYPTION_KEY ||
  "sala_development_authenticated_encryption_key_default_32bytes_sec";

// Para garantir que a chave tenha exatamente 256 bits (32 bytes),
// fazemos o hash SHA-256 do segredo configurado. Isso evita erros de tamanho de chave.
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(SECRET_KEY_SOURCE)
  .digest();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Tamanho padrão recomendado para IV no modo GCM (12 bytes)

interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

/**
 * Criptografa um texto em modo autenticado usando AES-256-GCM.
 * Retorna o dado cifrado (hex), o vetor de inicialização (hex) e a tag de autenticação (hex).
 */
export function encrypt(text: string): EncryptionResult {
  try {
    // Vetor de inicialização criptograficamente seguro e aleatório
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Tag de autenticação gerada exclusivamente pelo modo GCM para validar integridade
    const tag = cipher.getAuthTag().toString("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag,
    };
  } catch (error) {
    console.error("❌ Erro ao criptografar dado:", error);
    throw new Error("Falha no processo de criptografia de credenciais");
  }
}

/**
 * Descriptografa um texto cifrado em GCM.
 * Valida a autenticidade do ciphertext usando a tag fornecida.
 */
export function decrypt(
  encryptedText: string,
  ivHex: string,
  tagHex: string
): string {
  try {
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error(
      "❌ Erro ao descriptografar dado (possível chave incorreta ou adulteração):",
      error
    );
    throw new Error("Falha na descriptografia: credenciais ilegíveis");
  }
}
