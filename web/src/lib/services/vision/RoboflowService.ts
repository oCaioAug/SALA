import { VisionAnalysisResult, VisionPrediction } from "./types";
import { VisionService } from "./VisionService";

/**
 * Implementação Real da Integração com o Roboflow Hosted Inference API.
 */
export class RoboflowService extends VisionService {
  private apiKey: string;
  private modelId: string;
  private confidence?: number;
  private overlap?: number;

  constructor(apiKey: string, modelId: string, confidence?: number, overlap?: number) {
    super();
    this.apiKey = apiKey;
    this.modelId = modelId;
    this.confidence = confidence;
    this.overlap = overlap;
  }

  async analyzeImage(base64Image: string): Promise<VisionAnalysisResult> {
    try {
      // Remove o prefixo do Data URL (ex: "data:image/png;base64,") se estiver presente
      const base64Clean = base64Image.replace(/^data:image\/\w+;base64,/, "");

      let cleanModelId = this.modelId;
      if (this.modelId.includes("app.roboflow.com")) {
        try {
          const urlObj = new URL(this.modelId);
          const parts = urlObj.pathname.split("/").filter(Boolean);
          // Formato padrão do painel: /workspace-id/project-id ou /workspace-id/project-id/version
          if (parts.length >= 2) {
            const project = parts[1];
            const version = parts[2] || "1";
            cleanModelId = `${project}/${version}`;
            console.log(`🧹 [Roboflow] Extraído ID de modelo do painel: ${cleanModelId}`);
          }
        } catch (e) {
          console.error("❌ Erro ao analisar URL do painel do Roboflow:", e);
        }
      }

      // Permite usar uma URL base customizada via variável de ambiente (ex: https://serverless.roboflow.com)
      const baseUrl = process.env.ROBOFLOW_API_URL || "https://detect.roboflow.com";
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");

      let url = "";
      if (cleanModelId.startsWith("http://") || cleanModelId.startsWith("https://")) {
        // Se o cleanModelId já for uma URL completa da API (ex: serverless.roboflow.com), usa ela
        const parsedUrl = new URL(cleanModelId);
        parsedUrl.searchParams.set("api_key", this.apiKey);
        if (this.confidence !== undefined) {
          parsedUrl.searchParams.set("confidence", this.confidence.toString());
        }
        if (this.overlap !== undefined) {
          parsedUrl.searchParams.set("overlap", this.overlap.toString());
        }
        url = parsedUrl.toString();
      } else {
        const queryParams = new URLSearchParams({
          api_key: this.apiKey,
        });
        if (this.confidence !== undefined) {
          queryParams.set("confidence", this.confidence.toString());
        }
        if (this.overlap !== undefined) {
          queryParams.set("overlap", this.overlap.toString());
        }
        url = `${cleanBaseUrl}/${cleanModelId}?${queryParams.toString()}`;
      }

      console.log(
        `📡 [Roboflow] Iniciando requisição para o modelo: ${this.modelId}`
      );

      const response = await fetch(url, {
        method: "POST",
        body: base64Clean,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Resposta de erro do Roboflow:", errorText);
        throw new Error(
          `Roboflow API retornou status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ [Roboflow] Resposta recebida com sucesso da API Cloud.");

      // Mapeia o resultado retornado pelo Roboflow para os nossos tipos internos padronizados
      const rawPredictions = data.predictions || [];
      const predictions: VisionPrediction[] = rawPredictions.map((p: any) => ({
        class: p.class || "unknown",
        confidence: p.confidence || 0,
        x: p.x || 0,
        y: p.y || 0,
        width: p.width || 0,
        height: p.height || 0,
      }));

      // Calcula estatísticas
      const occupancyCount = predictions.filter(
        p => p.class === "person" || p.class === "people"
      ).length;

      const detectedClasses: Record<string, number> = {};
      predictions.forEach(p => {
        // Uniformizar nomes de classe conhecidos
        let className = p.class.toLowerCase();
        if (className === "people") className = "person";
        
        detectedClasses[className] = (detectedClasses[className] || 0) + 1;
      });

      return {
        provider: "ROBOFLOW",
        model: this.modelId,
        predictions,
        occupancyCount,
        detectedClasses,
      };
    } catch (error) {
      console.error("❌ Erro de comunicação com o Roboflow:", error);
      throw new Error(
        "Não foi possível obter a detecção do Roboflow. Certifique-se de que sua Chave de API e o ID do Modelo são válidos e ativos."
      );
    }
  }
}
