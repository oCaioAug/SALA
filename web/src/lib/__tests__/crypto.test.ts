import { encrypt, decrypt } from "../crypto";

describe("🔒 Cryptography (AES-256-GCM) Unit Tests", () => {
  const SAMPLE_API_KEY = "rf_live_abc123xyz987_roboflow_private_credential";

  test("Should successfully encrypt and decrypt a string", () => {
    // 1. Criptografar
    const result = encrypt(SAMPLE_API_KEY);
    expect(result).toHaveProperty("encrypted");
    expect(result).toHaveProperty("iv");
    expect(result).toHaveProperty("tag");
    expect(result.encrypted).not.toBe(SAMPLE_API_KEY);

    // 2. Descriptografar
    const decrypted = decrypt(result.encrypted, result.iv, result.tag);
    expect(decrypted).toBe(SAMPLE_API_KEY);
  });

  test("Should throw error if trying to decrypt tampered ciphertext", () => {
    const result = encrypt(SAMPLE_API_KEY);

    // Adulterar ligeiramente o texto cifrado alterando o último caractere
    const badCiphertext =
      result.encrypted.substring(0, result.encrypted.length - 1) + "0";

    expect(() => {
      decrypt(badCiphertext, result.iv, result.tag);
    }).toThrow("Falha na descriptografia: credenciais ilegíveis");
  });

  test("Should throw error if authentication tag is incorrect", () => {
    const result = encrypt(SAMPLE_API_KEY);

    // Adulterar a tag de autenticação
    const badTag = result.tag.substring(0, result.tag.length - 1) + "0";

    expect(() => {
      decrypt(result.encrypted, result.iv, badTag);
    }).toThrow("Falha na descriptografia: credenciais ilegíveis");
  });

  test("Should successfully handle high volume of operations", () => {
    for (let i = 0; i < 20; i++) {
      const payload = `key_index_${i}_hash_${Math.random().toString(36)}`;
      const encrypted = encrypt(payload);
      const decrypted = decrypt(
        encrypted.encrypted,
        encrypted.iv,
        encrypted.tag
      );
      expect(decrypted).toBe(payload);
    }
  });
});
