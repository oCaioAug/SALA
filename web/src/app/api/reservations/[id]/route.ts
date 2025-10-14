import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        room: true
      }
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Erro ao buscar reserva:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { startTime, endTime, purpose, status } = body

    // Verificar se a reserva existe
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id }
    })

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    // Se está alterando horário, verificar conflitos
    if (startTime && endTime) {
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          id: { not: params.id },
          roomId: existingReservation.roomId,
          status: 'ACTIVE',
          OR: [
            {
              AND: [
                { startTime: { lte: new Date(startTime) } },
                { endTime: { gt: new Date(startTime) } }
              ]
            },
            {
              AND: [
                { startTime: { lt: new Date(endTime) } },
                { endTime: { gte: new Date(endTime) } }
              ]
            }
          ]
        }
      })

      if (conflictingReservation) {
        return NextResponse.json(
          { error: 'A sala já está reservada neste horário' },
          { status: 409 }
        )
      }
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id: params.id },
      data: {
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(purpose !== undefined && { purpose }),
        ...(status && { status })
      },
      include: {
        user: true,
        room: true
      }
    })

    // Se cancelou a reserva, atualizar status da sala para LIVRE
    if (status === 'CANCELLED') {
      await prisma.room.update({
        where: { id: existingReservation.roomId },
        data: { status: 'LIVRE' }
      })
    }

    return NextResponse.json(updatedReservation)
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se a reserva existe
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        room: true,
      },
    })

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    // Deletar a reserva
    await prisma.reservation.delete({
      where: { id: params.id }
    })

    // Atualizar status da sala para LIVRE
    await prisma.room.update({
      where: { id: existingReservation.roomId },
      data: { status: 'LIVRE' }
    })

    // Criar notificação para o usuário sobre o cancelamento
    try {
      await notificationService.reservationCancelled(existingReservation);
    } catch (notificationError) {
      console.error("Erro ao criar notificação de cancelamento:", notificationError);
      // Não falhar o cancelamento por causa da notificação
    }

    return NextResponse.json({ message: 'Reserva cancelada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar reserva:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
