import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

import { MockVisionService } from "./MockVisionService";
import { RoboflowService } from "./RoboflowService";
import { VisionService } from "./VisionService";

/**
 * Fábrica Resolvedora de Serviços de Visão Computacional (SOLID DIP)
 * Resolve dinamicamente qual motor de IA instanciar com base no banco e ambiente.
 */
export class VisionServiceFactory {
  static async getService(): Promise<VisionService> {
    try {
      // 1. Tentar carregar credenciais cadastradas e criptografadas no Banco de Dados
      const dbCredential = await prisma.apiCredential.findUnique({
        where: { provider: "ROBOFLOW" },
      });

      if (dbCredential) {
        console.log(
          "🗝️ [VisionFactory] Credencial do Roboflow localizada no banco. Descriptografando..."
        );
        try {
          // Descriptografa de forma segura a chave de API
          const decryptedKey = decrypt(
            dbCredential.encryptedKey,
            dbCredential.iv,
            dbCredential.tag
          );
          const modelId = dbCredential.modelId || "yolov8n";

          console.log(
            `🚀 [VisionFactory] Ativando RoboflowService via Banco de Dados (Modelo: ${modelId})`
          );
          return new RoboflowService(decryptedKey, modelId);
        } catch (decryptError) {
          console.error(
            "❌ [VisionFactory] Erro ao descriptografar chave do banco. Tentando fallback...",
            decryptError
          );
        }
      }

      // 2. Fallback: Tentar carregar credenciais das variáveis de ambiente (.env)
      const envApiKey = process.env.ROBOFLOW_API_KEY;
      const envModelId = process.env.ROBOFLOW_MODEL_ID;

      if (envApiKey) {
        const modelId = envModelId || "yolov8n";
        console.log(
          `🚀 [VisionFactory] Ativando RoboflowService via variáveis de ambiente (Modelo: ${modelId})`
        );
        return new RoboflowService(envApiKey, modelId);
      }

      // 3. Fallback Final: Ativar o Simulador de Alta Fidelidade (Mock)
      console.log(
        "💡 [VisionFactory] Nenhuma credencial configurada. Iniciando MockVisionService (Offline)."
      );
      return new MockVisionService();
    } catch (error) {
      console.error(
        "❌ [VisionFactory] Erro ao resolver motor de visão:",
        error
      );
      // Retorna o Mock como rede de segurança para garantir estabilidade da aplicação
      return new MockVisionService();
    }
  }
}
export default VisionServiceFactory;
