import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pushNotificationService } from '@/lib/push-notification-service'
import { z } from 'zod'

const approveReservationSchema = z.object({
  reservationId: z.string().min(1, 'ID da reserva é obrigatório'),
  approved: z.boolean(),
  reason: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se o usuário é admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem aprovar reservas.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { reservationId, approved, reason } = approveReservationSchema.parse(body)

    // Buscar a reserva com informações completas
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        room: true,
        user: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    if (reservation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Apenas reservas pendentes podem ser aprovadas ou rejeitadas' },
        { status: 400 }
      )
    }

    // Atualizar status da reserva
    const newStatus = approved ? 'APPROVED' : 'REJECTED'
    
    // Se for uma reserva recorrente, atualizar todas as instâncias
    if (reservation.isRecurring && reservation.recurringTemplateId) {
      // Buscar todas as reservas com o mesmo recurringTemplateId
      const allRecurringReservations = await prisma.reservation.findMany({
        where: {
          recurringTemplateId: reservation.recurringTemplateId,
          status: 'PENDING',
        },
        include: {
          room: true,
          user: true,
        },
      })

      // Atualizar todas as reservas recorrentes
      await prisma.reservation.updateMany({
        where: {
          recurringTemplateId: reservation.recurringTemplateId,
          status: 'PENDING',
        },
        data: {
          status: newStatus,
        },
      })

      // Buscar a reserva atualizada para retornar
      const updatedReservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          room: true,
          user: true,
        },
      })

      if (!updatedReservation) {
        return NextResponse.json(
          { error: 'Reserva não encontrada após atualização' },
          { status: 404 }
        )
      }

      // Criar notificação para cada instância (ou uma notificação consolidada)
      for (const recurringReservation of allRecurringReservations) {
        await prisma.notification.create({
          data: {
            userId: recurringReservation.userId,
            type: approved ? 'RESERVATION_APPROVED' : 'RESERVATION_REJECTED',
            title: approved 
              ? '✅ Reserva Recorrente Aprovada!' 
              : '❌ Reserva Recorrente Rejeitada',
            message: approved 
              ? `Suas reservas recorrentes da ${recurringReservation.room.name} foram aprovadas!`
              : `Suas reservas recorrentes da ${recurringReservation.room.name} foram rejeitadas${reason ? `. Motivo: ${reason}` : '.'}`,
            data: {
              reservationId: recurringReservation.id,
              roomName: recurringReservation.room.name,
              startTime: recurringReservation.startTime.toISOString(),
              endTime: recurringReservation.endTime.toISOString(),
              reason: reason || null,
              isRecurring: true,
              recurringInstances: allRecurringReservations.length,
            },
          },
        })
      }

      // Enviar notificação push (uma para todas as instâncias)
      try {
        if (approved) {
          await pushNotificationService.sendReservationApprovalNotification(
            reservation.userId,
            {
              roomName: reservation.room.name,
              startTime: reservation.startTime,
              endTime: reservation.endTime,
            }
          )
        } else {
          await pushNotificationService.sendReservationRejectionNotification(
            reservation.userId,
            {
              roomName: reservation.room.name,
              startTime: reservation.startTime,
              reason: reason,
            }
          )
        }
        console.log(`✅ Notificação push enviada para usuário ${reservation.userId}`)
      } catch (pushError) {
        console.error('⚠️ Erro ao enviar notificação push:', pushError)
      }

      return NextResponse.json({
        id: updatedReservation.id,
        status: updatedReservation.status,
        message: approved 
          ? `Reserva recorrente aprovada! ${allRecurringReservations.length} instâncias foram aprovadas.`
          : `Reserva recorrente rejeitada! ${allRecurringReservations.length} instâncias foram rejeitadas.`,
        notification_sent: true,
        recurringInstances: allRecurringReservations.length,
      })
    }

    // Reserva única (não recorrente)
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: newStatus },
      include: {
        room: true,
        user: true
      }
    })

    // Criar notificação no banco
    await prisma.notification.create({
      data: {
        userId: reservation.userId,
        type: approved ? 'RESERVATION_APPROVED' : 'RESERVATION_REJECTED',
        title: approved ? '✅ Reserva Aprovada!' : '❌ Reserva Rejeitada',
        message: approved 
          ? `Sua reserva da ${reservation.room.name} foi aprovada!`
          : `Sua reserva da ${reservation.room.name} foi rejeitada${reason ? `. Motivo: ${reason}` : '.'}`,
        data: {
          reservationId: reservationId,
          roomName: reservation.room.name,
          startTime: reservation.startTime.toISOString(),
          endTime: reservation.endTime.toISOString(),
          reason: reason || null
        }
      }
    })

    // Enviar notificação push
    try {
      if (approved) {
        await pushNotificationService.sendReservationApprovalNotification(
          reservation.userId,
          {
            roomName: reservation.room.name,
            startTime: reservation.startTime,
            endTime: reservation.endTime
          }
        )
      } else {
        await pushNotificationService.sendReservationRejectionNotification(
          reservation.userId,
          {
            roomName: reservation.room.name,
            startTime: reservation.startTime,
            reason: reason
          }
        )
      }
      console.log(`✅ Notificação push enviada para usuário ${reservation.userId}`)
    } catch (pushError) {
      console.error('⚠️ Erro ao enviar notificação push:', pushError)
      // Não falhar a requisição se a notificação push falhar
    }

    return NextResponse.json({
      id: updatedReservation.id,
      status: updatedReservation.status,
      message: approved 
        ? 'Reserva aprovada com sucesso!'
        : 'Reserva rejeitada com sucesso!',
      notification_sent: true
    })

  } catch (error) {
    console.error('Erro ao processar aprovação de reserva:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}