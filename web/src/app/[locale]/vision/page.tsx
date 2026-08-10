"use client";

import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Key,
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
import { Card, CardContent } from "@/components/ui/Card";
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
  const [activeTab, setActiveTab] = useState<"audit" | "provision">("audit");
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
  const [_detectedSummary, setDetectedSummary] = useState<Record<string, number>>({});
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
    } catch (_err: unknown) {
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

  const canAnalyze =
    Boolean(selectedRoomId) && Boolean(base64Image) && !analyzing;
  const imageReady = Boolean(imagePreviewUrl) || webcamActive;

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
      notificationUpdateTrigger={0}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400">
            <Cpu className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {t("description")}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800/80">
          <span
            className={`h-2 w-2 rounded-full ${
              credConfigured || usingEnv ? "bg-emerald-500" : "bg-amber-500"
            }`}
            aria-hidden
          />
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {credConfigured
              ? t("provider.real")
              : usingEnv
                ? t("provider.usingEnv")
                : t("provider.mock")}
          </span>
          {(credConfigured || usingEnv) && (
            <span className="text-slate-500 dark:text-slate-400">
              · {modelId}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        className="mb-5 flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700/40 dark:bg-slate-800/50"
      >
        {(["audit", "provision"] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setPredictions([]);
              setAuditComparisons([]);
              setProvisionSuggestions([]);
              setCreatedIncidentId(null);
              addLog(`Aba alterada para: "${t(`tabs.${tab}`)}"`);
            }}
            className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Barra de fluxo: 1 sala → 2 imagem → 3 analisar */}
      <Card
        className="mb-5 border-indigo-200/70 shadow-sm dark:border-indigo-500/20"
        variant="elevated"
      >
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                selectedRoomId
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
                1
              </span>
              {t("workflow.stepRoom")}
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                imageReady
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
                2
              </span>
              {t("workflow.stepImage")}
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
                3
              </span>
              {t("workflow.stepAnalyze")}
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t("controls.selectRoom")}
              </label>
              {loadingRooms ? (
                <div className="h-11 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              ) : (
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedRoomId}
                    onChange={e => {
                      setSelectedRoomId(e.target.value);
                      setPredictions([]);
                      setAuditComparisons([]);
                      setProvisionSuggestions([]);
                      setCreatedIncidentId(null);
                      addLog(
                        `Sala de destino alterada para ID: ${e.target.value}`
                      );
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-8 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">
                      {t("controls.selectRoomPlaceholder")}
                    </option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} ({room.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <div
                className={`rounded-xl border px-3 py-2 text-xs sm:min-w-[11rem] ${
                  imageReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                }`}
              >
                <p className="font-semibold">{t("workflow.imageStatus")}</p>
                <p className="mt-0.5 truncate">
                  {webcamActive
                    ? t("workflow.webcamActive")
                    : imagePreviewUrl
                      ? t("workflow.imageReady")
                      : t("workflow.imageMissing")}
                </p>
              </div>

              <Button
                className="h-11 min-w-[12rem] bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                onClick={handleAnalyzeImage}
                disabled={!canAnalyze}
                title={
                  !selectedRoomId
                    ? t("workflow.needRoom")
                    : !base64Image
                      ? t("workflow.needImage")
                      : undefined
                }
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("controls.analyzing")}
                  </>
                ) : (
                  <>
                    <Cpu className="mr-2 h-4 w-4" />
                    {t("controls.analyzeBtn")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {!canAnalyze && !analyzing && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {!selectedRoomId
                ? t("workflow.needRoom")
                : !base64Image
                  ? t("workflow.needImage")
                  : null}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Captura */}
        <div className="space-y-4 lg:col-span-8">
          <Card
            className="overflow-hidden border-slate-200 dark:border-slate-700/40"
            variant="elevated"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-800/50">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Camera className="h-4 w-4 text-indigo-500" />
                {t("controls.captureArea")}
              </span>
              <div className="flex gap-2">
                {webcamActive ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="border-none bg-red-600 text-white hover:bg-red-700"
                    onClick={stopWebcam}
                  >
                    {t("controls.stopCamera")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="inline-flex items-center gap-1.5"
                    onClick={startWebcam}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {t("controls.useWebcam")}
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="relative flex min-h-[380px] items-center justify-center bg-slate-900 p-0 dark:bg-slate-950">
              {webcamActive && (
                <div className="relative flex h-full w-full items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-auto max-h-[480px] w-full scale-x-[-1] object-cover"
                  />
                  <div className="absolute bottom-6 z-10 flex w-full justify-center">
                    <button
                      onClick={captureSnapshot}
                      className="flex items-center gap-2 rounded-full border border-red-500 bg-red-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-red-700"
                    >
                      <Camera className="h-5 w-5" />
                      {t("controls.capture")}
                    </button>
                  </div>
                </div>
              )}

              {!webcamActive && !imagePreviewUrl && (
                <div className="flex w-full flex-col items-center justify-center p-10 text-center">
                  <div className="mb-4 rounded-full bg-indigo-500/15 p-4 text-indigo-300">
                    <Upload className="h-9 w-9" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-slate-100">
                    {t("controls.uploadTitle")}
                  </h3>
                  <p className="mb-5 max-w-sm text-xs text-slate-400">
                    {t("controls.uploadSubtitle")}
                  </p>
                  <label className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700">
                    {t("controls.selectFile")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {!webcamActive && imagePreviewUrl && (
                <div className="group flex w-full items-center justify-center overflow-hidden p-2">
                  <div className="relative inline-block max-h-[480px] max-w-full">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview de laboratório"
                      onLoad={handleImageLoad}
                      className="block h-auto max-h-[480px] w-auto select-none rounded-lg"
                    />

                    <svg
                      className="pointer-events-none absolute left-0 top-0 h-full w-full"
                      viewBox={`0 0 ${aiProvider === "MOCK" ? 800 : imageNaturalSize.width} ${
                        aiProvider === "MOCK" ? 500 : imageNaturalSize.height
                      }`}
                    >
                      {predictions.map((pred, idx) => {
                        let boxColor = "rgba(16, 185, 129, 1)";
                        let bgColor = "rgba(16, 185, 129, 0.15)";
                        if (pred.class === "person") {
                          boxColor = "rgba(239, 68, 68, 1)";
                          bgColor = "rgba(239, 68, 68, 0.15)";
                        } else if (pred.class === "projector") {
                          boxColor = "rgba(245, 158, 11, 1)";
                          bgColor = "rgba(245, 158, 11, 0.15)";
                        } else if (pred.class === "chair") {
                          boxColor = "rgba(99, 102, 241, 1)";
                          bgColor = "rgba(99, 102, 241, 0.15)";
                        }

                        const rectX = pred.x - pred.width / 2;
                        const rectY = pred.y - pred.height / 2;

                        return (
                          <g key={idx}>
                            <rect
                              x={rectX}
                              y={rectY}
                              width={pred.width}
                              height={pred.height}
                              fill={bgColor}
                              stroke={boxColor}
                              strokeWidth="3"
                              rx="4"
                            />
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

                    <div className="absolute right-4 top-4 flex gap-2">
                      <button
                        onClick={() => {
                          setBase64Image("");
                          setImagePreviewUrl("");
                          setPredictions([]);
                          setAuditComparisons([]);
                          setProvisionSuggestions([]);
                          setCreatedIncidentId(null);
                        }}
                        className="rounded-lg bg-slate-950/80 p-2 text-white shadow-lg backdrop-blur-md transition-all hover:bg-slate-900"
                        title={t("controls.clearImage")}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {/* Presets compactos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700/40 dark:bg-slate-800/40">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t("controls.presets")}
              </h3>
            </div>
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              {t("controls.presetsSubtitle")}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() =>
                  loadPreset("missing-laptop", "Laboratório com Falta")
                }
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  base64Image.includes("preset-missing-laptop")
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {t("controls.presetAudit")}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t("tabs.audit")}
                  </span>
                </span>
              </button>

              <button
                onClick={() =>
                  loadPreset("onboarding", "Provisionamento Inicial")
                }
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                  base64Image.includes("preset-onboarding")
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600"
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {t("controls.presetProvision")}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t("tabs.provision")}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Lateral: logs + settings recolhíveis */}
        <div className="space-y-4 lg:col-span-4">
          <Card
            className="border-slate-800 bg-slate-950 shadow-md"
            variant="default"
          >
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  {t("console.title")}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {t("console.subtitle")}
                </span>
              </div>

              <div className="flex h-56 flex-col gap-1.5 overflow-y-auto font-mono text-[11px] leading-relaxed text-emerald-400/90">
                {logs.length === 0 ? (
                  <span className="italic text-slate-600">No logs...</span>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className="rounded border-l-2 border-slate-800 py-0.5 pl-1.5 transition-colors hover:bg-slate-900/40"
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <details className="group rounded-2xl border border-slate-200 bg-white open:shadow-sm dark:border-slate-700/40 dark:bg-slate-800/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                {t("credentials.title")}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <form
              onSubmit={handleSaveCredentials}
              className="space-y-4 border-t border-slate-100 px-4 py-4 dark:border-slate-700/40"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("credentials.apiKey")}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder={
                      credConfigured
                        ? "••••••••••••••••••••"
                        : t("credentials.apiKeyPlaceholder")
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2 text-xs font-bold text-indigo-500 hover:text-indigo-600"
                  >
                    {showApiKey
                      ? t("credentials.hide")
                      : t("credentials.show")}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("credentials.modelId")}
                </label>
                <input
                  type="text"
                  value={modelIdInput}
                  onChange={e => setModelIdInput(e.target.value)}
                  placeholder={t("credentials.modelIdPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={savingCreds}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <Save className="h-3.5 w-3.5" />
                  {t("credentials.save")}
                </button>
                {credConfigured && (
                  <button
                    type="button"
                    onClick={handleClearCredentials}
                    disabled={savingCreds}
                    className="flex items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    {t("credentials.clearShort")}
                  </button>
                )}
              </div>

              <p className="text-center font-mono text-[10px] italic text-slate-400">
                {t("credentials.securedLabel")}
              </p>
            </form>
          </details>
        </div>
      </div>

      {/* Resultados */}
      <div className="mt-6 space-y-6">
        {activeTab === "audit" && auditComparisons.length > 0 && (
          <Card
            className="border-slate-200 shadow-md dark:border-slate-700/40"
            variant="elevated"
          >
            <CardContent className="p-6">
              <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 md:flex-row md:items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("auditTable.auditSummary")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("auditTable.summaryHint")}
                  </p>
                </div>

                {hasAuditDiscrepancies ? (
                  <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                    <span className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      {t("auditTable.discrepancyFound", {
                        count: auditComparisons.filter(
                          c => c.status === "MISSING"
                        ).length,
                      })}
                    </span>
                    {createdIncidentId && (
                      <Link href={`/${locale}/incidentes`}>
                        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors hover:bg-indigo-700">
                          {t("auditTable.viewIncident")} (#
                          {createdIncidentId.slice(0, 5)}...)
                        </button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("auditTable.noDiscrepancy")}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                      <th className="p-4">{t("auditTable.item")}</th>
                      <th className="p-4 text-center">
                        {t("auditTable.expected")}
                      </th>
                      <th className="p-4 text-center">
                        {t("auditTable.detected")}
                      </th>
                      <th className="p-4 text-center">
                        {t("auditTable.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {auditComparisons.map((comp, idx) => (
                      <tr
                        key={idx}
                        className="font-medium transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                      >
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
                            <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {t("auditTable.statusOk")}
                            </span>
                          )}
                          {comp.status === "MISSING" && (
                            <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-extrabold text-red-600 dark:text-red-400">
                              {t("auditTable.statusMissing")}
                            </span>
                          )}
                          {comp.status === "EXCESS" && (
                            <span className="rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
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

        {activeTab === "provision" && provisionSuggestions.length > 0 && (
          <Card
            className="border-indigo-200/60 shadow-md dark:border-indigo-500/20"
            variant="elevated"
          >
            <CardContent className="p-6">
              <div className="mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  {t("provisionPanel.title")}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t("provisionPanel.description")}
                </p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {provisionSuggestions.map((sug, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="select-none rounded-xl bg-slate-100 p-2 text-2xl dark:bg-slate-800">
                        {sug.icon}
                      </span>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={sug.name}
                          onChange={e =>
                            handleNameChange(index, e.target.value)
                          }
                          className="border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-bold text-slate-800 hover:border-slate-300 focus:border-indigo-500 focus:outline-none dark:text-white dark:hover:border-slate-700"
                        />
                        <span className="font-mono text-[10px] text-slate-400">
                          IA Class: Suggested
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQtyChange(index, -1)}
                        className="rounded-lg bg-slate-100 p-1 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                        {sug.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(index, 1)}
                        className="rounded-lg bg-slate-100 p-1 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveSuggestion(index)}
                        className="ml-2 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                        title="Remover sugestão"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700"
                  onClick={handleConfirmProvisioning}
                  disabled={savingProvision}
                >
                  {savingProvision ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {t("provisionPanel.processing")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {t("provisionPanel.saveBtn")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "provision" &&
          provisionSuggestions.length === 0 &&
          provisioningSuccess && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span>{t("provisionPanel.successBanner")}</span>
            </div>
          )}
      </div>
    </PageLayout>
  );
}
