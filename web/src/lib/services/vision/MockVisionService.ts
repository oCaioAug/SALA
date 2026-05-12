import { VisionAnalysisResult, VisionPrediction } from "./types";
import { VisionService } from "./VisionService";

/**
 * Simulador de Alta Fidelidade de Visão Computacional (Roboflow Offline)
 * Permite que a aplicação seja testada sem internet ou créditos de API.
 */
export class MockVisionService extends VisionService {
  async analyzeImage(base64Image: string): Promise<VisionAnalysisResult> {
    // Simular latência de rede realista (500ms a 1s) para que o spinner/logs na UI pareçam reais
    await new Promise(resolve =>
      setTimeout(resolve, 600 + Math.random() * 400)
    );

    let predictions: VisionPrediction[] = [];
    let model = "s-a-l-a-classroom-detector-yolov8";

    // 1. Cenário: Laboratório Cheio / Em Uso (preset-full-classroom)
    if (base64Image.includes("preset-full-classroom")) {
      predictions = [
        // Pessoas
        {
          class: "person",
          confidence: 0.96,
          x: 200,
          y: 250,
          width: 80,
          height: 180,
        },
        {
          class: "person",
          confidence: 0.93,
          x: 450,
          y: 270,
          width: 85,
          height: 170,
        },
        {
          class: "person",
          confidence: 0.89,
          x: 650,
          y: 260,
          width: 75,
          height: 165,
        },
        // Equipamentos ativos
        {
          class: "laptop",
          confidence: 0.94,
          x: 180,
          y: 320,
          width: 70,
          height: 50,
        },
        {
          class: "laptop",
          confidence: 0.91,
          x: 430,
          y: 330,
          width: 70,
          height: 50,
        },
        {
          class: "laptop",
          confidence: 0.88,
          x: 630,
          y: 320,
          width: 65,
          height: 48,
        },
        {
          class: "projector",
          confidence: 0.95,
          x: 400,
          y: 60,
          width: 80,
          height: 40,
        },
      ];
    }
    // 2. Cenário: Laboratório de Nova Auditoria com Notebook Faltando (preset-missing-laptop)
    else if (base64Image.includes("preset-missing-laptop")) {
      // Nesse cenário simula que apenas 1 computador foi achado, enquanto no banco há mais.
      predictions = [
        {
          class: "projector",
          confidence: 0.92,
          x: 400,
          y: 60,
          width: 80,
          height: 40,
        },
        {
          class: "laptop",
          confidence: 0.95,
          x: 150,
          y: 300,
          width: 90,
          height: 60,
        },
        // O segundo notebook ("Notebook Dell") que deveria estar no x: 600 não está na foto!
      ];
    }
    // 3. Cenário: Novo Laboratório sem Itens no Banco para Provisionamento (preset-onboarding)
    else if (base64Image.includes("preset-onboarding")) {
      // Simula detecção de múltiplos itens para cadastrar do zero de uma vez
      predictions = [
        {
          class: "projector",
          confidence: 0.96,
          x: 380,
          y: 50,
          width: 70,
          height: 35,
        },
        // Laptops detectados (4 unidades)
        {
          class: "laptop",
          confidence: 0.92,
          x: 120,
          y: 280,
          width: 75,
          height: 45,
        },
        {
          class: "laptop",
          confidence: 0.94,
          x: 320,
          y: 280,
          width: 75,
          height: 45,
        },
        {
          class: "laptop",
          confidence: 0.91,
          x: 520,
          y: 280,
          width: 75,
          height: 45,
        },
        {
          class: "laptop",
          confidence: 0.89,
          x: 720,
          y: 280,
          width: 75,
          height: 45,
        },
        // Cadeiras detectadas (4 unidades)
        {
          class: "chair",
          confidence: 0.88,
          x: 120,
          y: 380,
          width: 60,
          height: 100,
        },
        {
          class: "chair",
          confidence: 0.85,
          x: 320,
          y: 380,
          width: 60,
          height: 100,
        },
        {
          class: "chair",
          confidence: 0.89,
          x: 520,
          y: 380,
          width: 60,
          height: 100,
        },
        {
          class: "chair",
          confidence: 0.87,
          x: 720,
          y: 380,
          width: 60,
          height: 100,
        },
      ];
    }
    // 4. Cenário: Laboratório Vazio (preset-empty)
    else if (base64Image.includes("preset-empty")) {
      predictions = [
        {
          class: "projector",
          confidence: 0.94,
          x: 400,
          y: 60,
          width: 80,
          height: 40,
        },
        {
          class: "chair",
          confidence: 0.89,
          x: 200,
          y: 350,
          width: 70,
          height: 110,
        },
        {
          class: "chair",
          confidence: 0.87,
          x: 600,
          y: 350,
          width: 70,
          height: 110,
        },
      ];
    }
    // 5. Fallback: Foto qualquer enviada pelo usuário
    else {
      // Retorna uma detecção realista genérica para que a tela desenhe caixas em qualquer foto
      predictions = [
        {
          class: "person",
          confidence: 0.94,
          x: 220,
          y: 230,
          width: 90,
          height: 190,
        },
        {
          class: "laptop",
          confidence: 0.92,
          x: 240,
          y: 340,
          width: 70,
          height: 45,
        },
        {
          class: "laptop",
          confidence: 0.87,
          x: 500,
          y: 330,
          width: 75,
          height: 45,
        },
        {
          class: "projector",
          confidence: 0.91,
          x: 410,
          y: 70,
          width: 80,
          height: 40,
        },
        {
          class: "chair",
          confidence: 0.83,
          x: 510,
          y: 400,
          width: 65,
          height: 100,
        },
      ];
    }

    // Calcula totalizadores
    const occupancyCount = predictions.filter(p => p.class === "person")
      .length;
    const detectedClasses: Record<string, number> = {};

    predictions.forEach(p => {
      detectedClasses[p.class] = (detectedClasses[p.class] || 0) + 1;
    });

    return {
      provider: "MOCK",
      model,
      predictions,
      occupancyCount,
      detectedClasses,
    };
  }
}
