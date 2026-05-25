"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  Eye,
  Info,
  Key,
  Laptop,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Terminal,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

interface Room {
  id: string;
  name: string;
  status: string;
}

interface Prediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AuditComparison {
  itemId?: string;
  itemName: string;
  expectedQuantity: number;
  detectedQuantity: number;
  status: "OK" | "MISSING" | "EXCESS";
}

interface ProvisionSuggestion {
  name: string;
  quantity: number;
  icon: string;
}

export const dynamic = "force-dynamic";

export default function VisionPage() {
  const t = useTranslations("Vision");
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState("vision");
  const { showSuccess, showError, showInfo } = useApp();

  // Navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // --- Estados do Dashboard ---
  const [activeTab, setActiveTab] = useState<"occupancy" | "audit" | "provision">("occupancy");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [base64Image, setBase64Image] = useState<string>("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  
  // --- Estados do Provedor de IA ---
  const [credConfigured, setCredConfigured] = useState<boolean>(false);
  const [usingEnv, setUsingEnv] = useState<boolean>(false);
  const [modelId, setModelId] = useState<string>("yolov8n");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [modelIdInput, setModelIdInput] = useState<string>("yolov8n");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [savingCreds, setSavingCreds] = useState<boolean>(false);

  // --- Estados de Resultado de IA ---
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [detectedSummary, setDetectedSummary] = useState<Record<string, number>>({});
  const [aiProvider, setAiProvider] = useState<string>("MOCK");
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  
  // --- Estados de Auditoria ---
  const [auditComparisons, setAuditComparisons] = useState<AuditComparison[]>([]);
  const [hasAuditDiscrepancies, setHasAuditDiscrepancies] = useState<boolean>(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);

  // --- Estados de Provisionamento ---
  const [provisionSuggestions, setProvisionSuggestions] = useState<ProvisionSuggestion[]>([]);
  const [provisioningSuccess, setProvisioningSuccess] = useState<boolean>(false);
  const [savingProvision, setSavingProvision] = useState<boolean>(false);

  // --- Estados de Webcam ---
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Carregamento Inicial ---
  useEffect(() => {
    fetchRooms();
    fetchCredentialsInfo();
    addLog(t("console.waiting"));
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Falha ao carregar salas");
      const data = await res.json();
      setRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      showError("Erro ao carregar lista de salas.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchCredentialsInfo = async () => {
    try {
      const res = await fetch("/api/vision/credentials");
      if (res.ok) {
        const data = await res.json();
        setCredConfigured(data.isConfigured);
        setUsingEnv(data.usingEnv);
        setModelId(data.modelId);
        setModelIdInput(data.modelId);
      }
    } catch (err) {
      console.error("Erro ao carregar status de credenciais", err);
    }
  };

  // --- Salvar Credenciais do Roboflow ---
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCreds(true);
      const res = await fetch("/api/vision/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          modelId: modelIdInput,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha ao salvar credenciais");
      }

      showSuccess(t("credentials.saved"));
      setApiKeyInput("");
      fetchCredentialsInfo();
    } catch (err: any) {
      showError(err.message || "Erro ao salvar chaves.");
    } finally {
      setSavingCreds(false);
    }
  };

  // --- Limpar Credenciais ---
  const handleClearCredentials = async () => {
    try {
      setSavingCreds(true);
      const res = await fetch("/api/vision/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "", modelId: "" }),
      });

      if (!res.ok) throw new Error("Erro ao remover configurações");

      showSuccess(t("credentials.cleared"));
      setApiKeyInput("");
      fetchCredentialsInfo();
    } catch (err: any) {
      showError("Falha ao remover credenciais.");
    } finally {
      setSavingCreds(false);
    }
  };

  // --- Ativar/Desativar Webcam ---
  const startWebcam = async () => {
    try {
      setWebcamActive(true);
      setBase64Image("");
      setImagePreviewUrl("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      addLog("Câmera do laboratório ativada.");
    } catch (err) {
      console.error(err);
      showError("Não foi possível acessar a câmera do dispositivo.");
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setWebcamActive(false);
    addLog("Câmera desativada.");
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg");
        setBase64Image(dataUrl);
        setImagePreviewUrl(dataUrl);
        stopWebcam();
        addLog("Snapshot da câmera capturado com sucesso!");
      }
    }
  };

  // --- Upload de Arquivo Manual ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Selecione um arquivo de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultBase64 = reader.result as string;
      setBase64Image(resultBase64);
      setImagePreviewUrl(resultBase64);
      setWebcamActive(false);
      // Limpa predições anteriores ao trocar de foto
      setPredictions([]);
      setAuditComparisons([]);
      setProvisionSuggestions([]);
      setCreatedIncidentId(null);
      addLog(`Imagem "${file.name}" carregada pelo usuário.`);
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 500,
    });
  };

  // --- Selecionar Cenários de Presets de Teste ---
  const loadPreset = (presetKey: string, name: string) => {
    setWebcamActive(false);
    setAiProvider("MOCK");
    // Cria uma base64 falsa contendo a tag correspondente para que o Mock reconheça
    const dummyBase64 = `data:image/jpeg;base64,preset-${presetKey}-dummy-base64-data-image-classroom-assets-glowing`;
    setBase64Image(dummyBase64);
    
    // Fallback de imagem de fundo fictícia bonita para renderizar o Canvas
    const placeholderUrl = `https://images.unsplash.com/photo-${
      presetKey === "empty"
        ? "1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200" // empty/tech lab
        : presetKey === "full-classroom"
        ? "1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=1200" // classroom
        : presetKey === "missing-laptop"
        ? "1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200" // missing item lab
        : "1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200" // provision room onboarding
    }`;
    setImagePreviewUrl(placeholderUrl);
    
    // Limpa resultados anteriores
    setPredictions([]);
    setAuditComparisons([]);
    setProvisionSuggestions([]);
    setCreatedIncidentId(null);

    addLog(`Cenário Preset selecionado: "${name}".`);
  };

  // --- Rodar Análise com IA ---
  const handleAnalyzeImage = async () => {
    if (!base64Image) {
      showError("Por favor, envie uma foto ou use um cenário de teste para executar a análise.");
      return;
    }
    if (!selectedRoomId) {
      showError("Selecione uma sala de destino para sincronizar os dados.");
      return;
    }

    try {
      setAnalyzing(true);
      setPredictions([]);
      setAuditComparisons([]);
      setProvisionSuggestions([]);
      setCreatedIncidentId(null);
      addLog(`Iniciando análise inteligente em modo "${t(`tabs.${activeTab}`)}"...`);

      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          roomId: selectedRoomId,
          mode: activeTab,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao processar imagem via API");
      }

      const data = await res.json();
      
      // Sincroniza logs retornados pelo backend
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((logItem: string) => addLog(logItem));
      }

      setAiProvider(data.analysis.provider);
      setPredictions(data.analysis.predictions);
      setDetectedSummary(data.analysis.detectedClasses);

      if (activeTab === "occupancy") {
        if (data.statusChanged) {
          showSuccess(`Sucesso! Status da sala atualizado de "${data.previousStatus}" para "${data.currentStatus}".`);
        } else {
          showSuccess(`Análise de presença concluída. Status atual: ${data.currentStatus}`);
        }
      }

      if (activeTab === "audit") {
        setAuditComparisons(data.comparisons);
        setHasAuditDiscrepancies(data.hasDiscrepancies);
        setCreatedIncidentId(data.createdIncidentId || null);

        if (data.hasDiscrepancies) {
          showError("Atenção! Auditoria acusou falta de equipamentos cadastrados! Incidente aberto pelo SALA-Bot.");
        } else {
          showSuccess("Parabéns! Todos os equipamentos registrados no banco estão presentes na sala!");
        }
      }

      if (activeTab === "provision") {
        setProvisionSuggestions(data.suggestions);
        if (data.suggestions.length > 0) {
          showSuccess(`IA identificou ${data.suggestions.length} tipos de equipamentos prontos para provisionamento.`);
        } else {
          showInfo("Nenhum equipamento cadastrável identificado.");
        }
      }

    } catch (err: any) {
      console.error(err);
      showError(err.message || "Ocorreu um erro ao processar a imagem.");
      addLog(`❌ Erro no processamento: ${err.message || "Falha HTTP."}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // --- Manipular Ajuste de Provisionamento (Steppers) ---
  const handleQtyChange = (index: number, delta: number) => {
    setProvisionSuggestions(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          return {
            ...item,
            quantity: Math.max(1, item.quantity + delta),
          };
        }
        return item;
      })
    );
  };

  const handleNameChange = (index: number, newName: string) => {
    setProvisionSuggestions(prev =>
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, name: newName };
        }
        return item;
      })
    );
  };

  const handleRemoveSuggestion = (index: number) => {
    setProvisionSuggestions(prev => prev.filter((_, idx) => idx !== index));
    addLog("Sugestão de provisionamento removida pelo administrador.");
  };

  // --- Enviar Provisionamento Final ao Banco ---
  const handleConfirmProvisioning = async () => {
    if (!selectedRoomId) return;
    try {
      setSavingProvision(true);
      addLog("Enviando solicitação de provisionamento em massa para o PostgreSQL...");

      const res = await fetch("/api/vision/provision-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          items: provisionSuggestions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar provisionamento");
      }

      const data = await res.json();
      showSuccess(data.message);
      addLog(`[DATABASE] Sincronização concluída! ${data.itemsCreatedCount} equipamentos cadastrados na sala.`);
      setProvisionSuggestions([]);
      setProvisioningSuccess(true);
    } catch (err: any) {
      showError(err.message || "Erro ao confirmar provisionamento.");
      addLog(`❌ Erro no banco: ${err.message}`);
    } finally {
      setSavingProvision(false);
    }
  };

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
      notificationUpdateTrigger={0}
    >
      {/* Header Premium */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Cpu className="w-9 h-9 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3.5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t("title")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-xl text-sm">
              {t("description")}
            </p>
          </div>
        </div>

        {/* Status de Provedor Ativo */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <div className={`w-2.5 h-2.5 rounded-full ${credConfigured || usingEnv ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white">
              {credConfigured ? t("provider.real") : usingEnv ? t("provider.usingEnv") : t("provider.mock")}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {credConfigured || usingEnv ? `Modelo: ${modelId}` : t("provider.notConfigured")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Principais */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl mb-8 border border-slate-200/50 dark:border-slate-700/30 shadow-inner">
        {(["occupancy", "audit", "provision"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              // Limpar estados temporários para trocar de tab
              setPredictions([]);
              setAuditComparisons([]);
              setProvisionSuggestions([]);
              setCreatedIncidentId(null);
              addLog(`Aba alterada para: "${t(`tabs.${tab}`)}"`);
            }}
            className={`flex-1 py-3 text-center rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === tab
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md transform scale-[1.01]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-950 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= SEÇÃO ESQUERDA: CÂMERA E PRESETS ================= */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Workspace de Captura / Canvas */}
          <Card className="overflow-hidden border-slate-200/60 dark:border-slate-700/40 shadow-xl" variant="elevated">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200/60 dark:border-slate-700/40 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" />
                Área de Captura de Imagem do Laboratório
              </span>
              <div className="flex gap-2">
                {webcamActive ? (
                  <Button size="sm" variant="secondary" className="bg-red-600 hover:bg-red-700 text-white border-none dark:bg-red-600 dark:hover:bg-red-700" onClick={stopWebcam}>
                    Desativar Câmera
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex items-center gap-1.5" onClick={startWebcam}>
                    <Camera className="w-3.5 h-3.5" />
                    Usar Webcam
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="p-0 bg-slate-950 relative min-h-[420px] flex items-center justify-center">
              {/* Fluxo de Vídeo Webcam Ao Vivo */}
              {webcamActive && (
                <div className="w-full h-full relative flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto max-h-[480px] object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-6 flex justify-center w-full z-10">
                    <button
                      onClick={captureSnapshot}
                      className="px-6 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg hover:bg-red-700 hover:scale-105 transition-all flex items-center gap-2 border border-red-500 animate-pulse"
                    >
                      <Camera className="w-5 h-5" />
                      {t("controls.capture")}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Dropzone / Visualizador de Imagem com Bounding Boxes */}
              {!webcamActive && !imagePreviewUrl && (
                <div className="p-12 text-center flex flex-col items-center justify-center w-full">
                  <div className="p-5 bg-indigo-500/10 rounded-full text-indigo-400 mb-4 shadow-inner">
                    <Upload className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">
                    {t("controls.uploadTitle")}
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 max-w-sm">
                    {t("controls.uploadSubtitle")}
                  </p>
                  <label className="cursor-pointer px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:scale-102 transition-all">
                    Selecionar Arquivo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Renderização de Imagem Analisada com Canvas/Bounding Boxes sobrepostos */}
              {!webcamActive && imagePreviewUrl && (
                <div className="w-full flex items-center justify-center overflow-hidden group p-2">
                  <div className="relative inline-block max-w-full max-h-[480px]">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview de laboratório"
                      onLoad={handleImageLoad}
                      className="max-h-[480px] w-auto h-auto block select-none rounded-lg"
                    />

                    {/* SVG Overlay para Bounding Boxes Inteligentes e Responsivos */}
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      viewBox={`0 0 ${aiProvider === "MOCK" ? 800 : imageNaturalSize.width} ${
                        aiProvider === "MOCK" ? 500 : imageNaturalSize.height
                      }`}
                    >
                      {predictions.map((pred, idx) => {
                        // Cores personalizadas dinâmicas baseadas na classe do item detectado (SOLID)
                        let boxColor = "rgba(16, 185, 129, 1)"; // emerald para computadores/laptops
                        let bgColor = "rgba(16, 185, 129, 0.15)";
                        if (pred.class === "person") {
                          boxColor = "rgba(239, 68, 68, 1)"; // vermelho para pessoas
                          bgColor = "rgba(239, 68, 68, 0.15)";
                        } else if (pred.class === "projector") {
                          boxColor = "rgba(245, 158, 11, 1)"; // âmbar para projetor
                          bgColor = "rgba(245, 158, 11, 0.15)";
                        } else if (pred.class === "chair") {
                          boxColor = "rgba(99, 102, 241, 1)"; // indigo para cadeiras
                          bgColor = "rgba(99, 102, 241, 0.15)";
                        }

                        // Roboflow retorna centro x, y e dimensões na escala original
                        const rectX = pred.x - pred.width / 2;
                        const rectY = pred.y - pred.height / 2;

                        return (
                          <g key={idx} className="animate-fade-in">
                            {/* Caixa delimitadora neon brilhante */}
                            <rect
                              x={rectX}
                              y={rectY}
                              width={pred.width}
                              height={pred.height}
                              fill={bgColor}
                              stroke={boxColor}
                              strokeWidth="3"
                              rx="4"
                              style={{ filter: "drop-shadow(0px 0px 4px var(--tw-shadow-color))" }}
                              className="transition-all duration-300 shadow-indigo-500"
                            />
                            {/* Aba com o nome do item e nível de certeza de acerto da IA */}
                            <rect
                              x={rectX}
                              y={Math.max(0, rectY - 22)}
                              width={pred.class.length * 9 + 48}
                              height="22"
                              fill={boxColor}
                              rx="3"
                            />
                            <text
                              x={rectX + 6}
                              y={Math.max(14, rectY - 6)}
                              fill="white"
                              fontSize="11"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {pred.class} {Math.round(pred.confidence * 100)}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Ações Rápidas por cima da imagem */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={() => {
                          setBase64Image("");
                          setImagePreviewUrl("");
                          setPredictions([]);
                          setAuditComparisons([]);
                          setProvisionSuggestions([]);
                          setCreatedIncidentId(null);
                        }}
                        className="p-2 bg-slate-950/80 hover:bg-slate-900 text-white rounded-lg backdrop-blur-md transition-all shadow-lg"
                        title="Deletar imagem atual"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Elemento Oculto para Snapshot de Webcam */}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {/* Preset de Simulações Rápidas */}
          <Card className="border-slate-200/60 dark:border-slate-700/40" variant="elevated">
            <CardContent className="p-6">
              <span className="text-xs uppercase tracking-wider text-indigo-500 font-bold flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {t("controls.presets")}
              </span>
              <p className="text-xs text-slate-500 mb-4">
                {t("controls.presetsSubtitle")}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => loadPreset("empty", "Laboratório Vazio")}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 hover:scale-102 flex flex-col gap-2 ${
                    base64Image.includes("preset-empty")
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <span className="text-xl">🪟</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t("controls.presetEmpty")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Modo Ocupação</span>
                  </div>
                </button>

                <button
                  onClick={() => loadPreset("full-classroom", "Laboratório Cheio")}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 hover:scale-102 flex flex-col gap-2 ${
                    base64Image.includes("preset-full-classroom")
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <span className="text-xl">👥</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t("controls.presetFull")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Modo Ocupação</span>
                  </div>
                </button>

                <button
                  onClick={() => loadPreset("missing-laptop", "Laboratório com Falta")}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 hover:scale-102 flex flex-col gap-2 ${
                    base64Image.includes("preset-missing-laptop")
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <span className="text-xl">⚠️</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t("controls.presetAudit")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Modo Auditoria</span>
                  </div>
                </button>

                <button
                  onClick={() => loadPreset("onboarding", "Provisionamento Inicial")}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 hover:scale-102 flex flex-col gap-2 ${
                    base64Image.includes("preset-onboarding")
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <span className="text-xl">✨</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t("controls.presetProvision")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Modo Cadastro</span>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= SEÇÃO DIREITA: CONFIGURAÇÕES E FLUXO ================= */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Seletor de Sala de Destino */}
          <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent shadow-md" variant="elevated">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-indigo-500" />
                Definir Sala e Iniciar Automação
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    {t("controls.selectRoom")}
                  </label>
                  {loadingRooms ? (
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  ) : (
                    <select
                      value={selectedRoomId}
                      onChange={e => {
                        setSelectedRoomId(e.target.value);
                        setPredictions([]);
                        setAuditComparisons([]);
                        setProvisionSuggestions([]);
                        setCreatedIncidentId(null);
                        addLog(`Sala de destino alterada para ID: ${e.target.value}`);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                    >
                      <option value="">{t("controls.selectRoomPlaceholder")}</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          🏢 {room.name} ({room.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <Button
                  className="w-full py-3 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-102 flex items-center justify-center gap-2 transition-all"
                  onClick={handleAnalyzeImage}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t("controls.analyzing")}
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      {t("controls.analyzeBtn")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Terminal de Logs de Eventos */}
          <Card className="bg-slate-950/95 border-slate-900 shadow-xl" variant="default">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  {t("console.title")}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {t("console.subtitle")}
                </span>
              </div>
              
              <div className="h-44 overflow-y-auto font-mono text-[11px] text-emerald-400/90 leading-relaxed scrollbar-thin scrollbar-thumb-slate-900 flex flex-col gap-1.5">
                {logs.length === 0 ? (
                  <span className="text-slate-600 italic">No logs...</span>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="border-l-2 border-slate-900 pl-1.5 py-0.5 hover:bg-slate-900/40 rounded transition-all">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configurações Administrativas do Roboflow */}
          <Card className="border-slate-200/60 dark:border-slate-700/40 shadow-md" variant="elevated">
            <CardContent className="p-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lock className="w-3.5 h-3.5 text-yellow-500" />
                {t("credentials.title")}
              </span>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t("credentials.apiKey")}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder={credConfigured ? "••••••••••••••••••••" : t("credentials.apiKeyPlaceholder")}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-12 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-indigo-500 hover:text-indigo-600 font-bold absolute right-3 top-2"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t("credentials.modelId")}
                  </label>
                  <input
                    type="text"
                    value={modelIdInput}
                    onChange={e => setModelIdInput(e.target.value)}
                    placeholder={t("credentials.modelIdPlaceholder")}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingCreds}
                    className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {t("credentials.save")}
                  </button>
                  {credConfigured && (
                    <button
                      type="button"
                      onClick={handleClearCredentials}
                      disabled={savingCreds}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                
                <span className="block text-[9px] text-slate-400 italic text-center font-mono">
                  {t("credentials.securedLabel")}
                </span>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ================= SEÇÃO DE RESULTADOS DA INFERÊNCIA DA IA ================= */}
      <div className="mt-8 space-y-8 animate-fade-in">
        
        {/* CASO 2: Tabela de Relatório de Auditoria de Inventário */}
        {activeTab === "audit" && auditComparisons.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-700/40 shadow-xl" variant="elevated">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {t("auditTable.auditSummary")}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Reconciliação entre itens registrados no PostgreSQL vs objetos identificados visualmente.
                  </p>
                </div>

                {hasAuditDiscrepancies ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                    <span className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                      {t("auditTable.discrepancyFound", { count: auditComparisons.filter(c => c.status === "MISSING").length })}
                    </span>
                    {createdIncidentId && (
                      <Link href={`/${locale}/incidentes`}>
                        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all">
                          {t("auditTable.viewIncident")} (#{createdIncidentId.slice(0, 5)}...)
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {t("auditTable.noDiscrepancy")}
                  </span>
                )}
              </div>

              {/* Tabela de Reconciliação */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">{t("auditTable.item")}</th>
                      <th className="p-4 text-center">{t("auditTable.expected")}</th>
                      <th className="p-4 text-center">{t("auditTable.detected")}</th>
                      <th className="p-4 text-center">{t("auditTable.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditComparisons.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all font-medium">
                        <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">
                          {comp.itemName}
                        </td>
                        <td className="p-4 text-center text-slate-700 dark:text-slate-300">
                          {comp.expectedQuantity}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-900 dark:text-white">
                          {comp.detectedQuantity}
                        </td>
                        <td className="p-4 text-center">
                          {comp.status === "OK" && (
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-lg">
                              {t("auditTable.statusOk")}
                            </span>
                          )}
                          {comp.status === "MISSING" && (
                            <span className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold text-xs rounded-lg animate-pulse border border-red-500/20">
                              {t("auditTable.statusMissing")}
                            </span>
                          )}
                          {comp.status === "EXCESS" && (
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg">
                              {t("auditTable.statusExcess")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CASO 3: Painel Interativo de Revisão de Provisionamento */}
        {activeTab === "provision" && provisionSuggestions.length > 0 && (
          <Card className="border-indigo-500/20 shadow-xl" variant="elevated">
            <CardContent className="p-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  {t("provisionPanel.title")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t("provisionPanel.description")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {provisionSuggestions.map((sug, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-slate-100 dark:bg-slate-800 rounded-xl select-none">{sug.icon}</span>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={sug.name}
                          onChange={e => handleNameChange(index, e.target.value)}
                          className="text-sm font-bold text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">IA Class: Suggested</span>
                      </div>
                    </div>

                    {/* Steppers de ajuste de quantidade */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQtyChange(index, -1)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white w-6 text-center font-mono">
                        {sug.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(index, 1)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveSuggestion(index)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all ml-2"
                        title="Remover sugestão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  className="py-3 px-6 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-102 flex items-center gap-2 transition-all"
                  onClick={handleConfirmProvisioning}
                  disabled={savingProvision}
                >
                  {savingProvision ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t("provisionPanel.saveBtn")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem de sucesso quando terminar provisionamento */}
        {activeTab === "provision" && provisionSuggestions.length === 0 && provisioningSuccess && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 animate-bounce" />
            <span>Sua sala foi provisionada com sucesso! Todos os equipamentos foram salvos no PostgreSQL e estão ativos.</span>
          </div>
        )}

      </div>

    </PageLayout>
  );
}
