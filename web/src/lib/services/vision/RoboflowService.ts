import { VisionAnalysisResult, VisionPrediction } from "./types";
import { VisionService } from "./VisionService";

/**
 * Implementação Real da Integração com o Roboflow Hosted Inference API.
 */
export class RoboflowService extends VisionService {
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string) {
    super();
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async analyzeImage(base64Image: string): Promise<VisionAnalysisResult> {
    try {
      // Remove o prefixo do Data URL (ex: "data:image/png;base64,") se estiver presente
      const base64Clean = base64Image.replace(/^data:image\/\w+;base64,/, "");

      // Endpoint oficial da Hosted Inference API do Roboflow
      const url = `https://detect.roboflow.com/${this.modelId}?api_key=${this.apiKey}`;

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
