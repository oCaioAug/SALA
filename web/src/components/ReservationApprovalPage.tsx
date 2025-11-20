"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';

interface Reservation {
  id: string;
  user: {
    name: string;
    email: string;
  };
  room: {
    name: string;
  };
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  createdAt: string;
}

export default function ReservationApprovalPage() {
  const t = useTranslations("ReservationApproval");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPendingReservations();
    }
  }, [status]);

  // Verificar se o usuário está autenticado e é admin
  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-400 text-5xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("restricted.title")}
          </h3>
          <p className="text-gray-600 mb-6">
            {t("restricted.message")}
          </p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("restricted.login")}
          </a>
        </div>
      </div>
    );
  }

  // @ts-ignore - Verificação de role
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-yellow-400 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("denied.title")}
          </h3>
          <p className="text-gray-600">
            {t("denied.message")}
          </p>
        </div>
      </div>
    );
  }

  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Buscando reservas pendentes...');
      
      // Buscar reservas pendentes
      const response = await fetch('/api/reservations?status=PENDING', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('📡 Resposta da API:', response.status, response.statusText);
      
      if (response.ok) {
        const reservations = await response.json();
        console.log('📋 Reservas encontradas:', reservations.length);
        setPendingReservations(reservations || []);
      } else {
        console.error('❌ Erro ao buscar reservas pendentes:', response.status);
        const errorText = await response.text();
        console.error('📄 Erro detalhado:', errorText);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar reservas pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (reservationId: string, approved: boolean, reason?: string) => {
    try {
      setApproving(reservationId);
      
      console.log('🔄 Processando aprovação:', { reservationId, approved, reason });
      
      const response = await fetch('/api/reservations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reservationId,
          approved,
          reason: reason || undefined
        })
      });

      console.log('📡 Resposta da aprovação:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reserva processada:', data);
        
        // Remover a reserva da lista
        setPendingReservations(prev => 
          prev.filter(reservation => reservation.id !== reservationId)
        );
        
        alert(data.message || (approved ? t("feedback.successApprove") : t("feedback.successReject")));
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na aprovação:', errorData);
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar aprovação:', error);
      alert(t("feedback.errorInternal"));
    } finally {
      setApproving(null);
    }
  };

  const testPushNotification = async () => {
    try {
      const userId = prompt(t("feedback.testPushPrompt"));
      if (!userId) return;

      console.log('🧪 Testando push notification para usuário:', userId);
      
      const response = await fetch('/api/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: userId,
          title: t("feedback.testPushTitle"),
          body: t("feedback.testPushBody")
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Resultado do teste:', data);
        alert(data.message);
      } else {
        const errorData = await response.json();
        console.error('❌ Erro no teste:', errorData);
        alert(`Erro: ${errorData.error}`);
      }
    } catch (error) {
      console.error('❌ Erro ao testar push:', error);
      alert(t("feedback.errorTestPush"));
    }
  };

  const formatDateTime = (dateString: string) => {
    // Converter locale do next-intl para formato do Intl
    const intlLocale = locale === "pt" ? "pt-BR" : locale === "en" ? "en-US" : locale;
    
    return new Date(dateString).toLocaleString(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("title")}
        </h1>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t("loadingReservations")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("title")} ({pendingReservations.length})
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              console.log('📋 Estado atual das reservas:', pendingReservations);
              fetchPendingReservations();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("actions.refresh")}
          </button>
          <button
            onClick={() => {
              console.log('🔍 Debug - Reservas pendentes:', JSON.stringify(pendingReservations, null, 2));
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t("actions.debug")}
          </button>
          <button
            onClick={testPushNotification}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t("actions.testPush")}
          </button>
        </div>
      </div>

      {pendingReservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-5xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noPending")}
          </h3>
          <p className="text-gray-600">
            {t("noPendingDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              {/* Header da reserva */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {reservation.room.name}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {t("card.pending")}
                </span>
              </div>

              {/* Informações do usuário */}
              <div className="mb-4 space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">{t("card.requester")}:</span>
                  <p className="text-sm text-gray-900">{reservation.user.name}</p>
                  <p className="text-xs text-gray-600">{reservation.user.email}</p>
                </div>
              </div>

              {/* Horário */}
              <div className="mb-4 space-y-1">
                <div>
                  <span className="text-sm font-medium text-gray-500">{t("card.start")}:</span>
                  <p className="text-sm text-gray-900">{formatDateTime(reservation.startTime)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">{t("card.end")}:</span>
                  <p className="text-sm text-gray-900">{formatDateTime(reservation.endTime)}</p>
                </div>
              </div>

              {/* Propósito */}
              <div className="mb-6">
                <span className="text-sm font-medium text-gray-500">{t("card.purpose")}:</span>
                <p className="text-sm text-gray-900 mt-1">
                  {reservation.purpose || t("card.notInformed")}
                </p>
              </div>

              {/* Ações */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleApproval(reservation.id, true)}
                  disabled={approving === reservation.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {approving === reservation.id ? t("feedback.approving") : t("card.approve")}
                </button>
                <button
                  onClick={() => {
                    const reason = prompt(t("card.rejectReason"));
                    if (reason !== null) { // Usuario não cancelou
                      handleApproval(reservation.id, false, reason);
                    }
                  }}
                  disabled={approving === reservation.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {approving === reservation.id ? t("feedback.rejecting") : t("card.reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}