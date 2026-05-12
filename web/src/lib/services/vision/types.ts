export interface VisionPrediction {
  class: string;
  confidence: number;
  x: number; // center x (em pixels na imagem original)
  y: number; // center y (em pixels na imagem original)
  width: number; // largura da bounding box
  height: number; // altura da bounding box
}

export interface VisionAnalysisResult {
  provider: "ROBOFLOW" | "MOCK";
  model: string;
  predictions: VisionPrediction[];
  occupancyCount: number; // quantidade de 'person' (pessoas)
  detectedClasses: Record<string, number>; // contagem de todos os itens: e.g. { "laptop": 12, "projector": 1 }
}

export interface AuditItemComparison {
  itemId?: string; // ID do item cadastrado no banco, se aplicável
  itemName: string; // Nome do item (ex: Notebook, Computador, Projetor)
  expectedQuantity: number; // Quantidade registrada no banco
  detectedQuantity: number; // Quantidade encontrada pela IA
  status: "OK" | "MISSING" | "EXCESS"; // Comparação
}

export interface VisionAuditResult {
  analysis: VisionAnalysisResult;
  comparisons: AuditItemComparison[];
  hasDiscrepancies: boolean;
  createdIncidentId?: string; // ID do incidente gerado automaticamente se faltar itens
}

export interface ProvisionItemSuggestion {
  name: string; // Classe identificada
  quantity: number; // Quantidade sugerida
  icon: string; // Emoji adequado mapeado automaticamente
}

export interface ProvisionConfirmResult {
  roomId: string;
  roomName: string;
  itemsCreatedCount: number;
}
