import { VisionAnalysisResult } from "./types";

/**
 * Contrato de Serviço para Motores de Visão Computacional (SOLID DIP)
 */
export abstract class VisionService {
  /**
   * Analisa uma imagem codificada em Base64 ou buffer
   * @param base64Image Imagem em formato Base64 (pode conter o prefixo data:image/*;base64,)
   */
  abstract analyzeImage(base64Image: string): Promise<VisionAnalysisResult>;
}
