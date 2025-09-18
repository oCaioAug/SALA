import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}

    if (roomId) {
      where.roomId = roomId
    }

    if (status) {
      where.status = status
    }

    if (userId) {
      where.userId = userId
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: true,
        room: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Erro ao buscar reservas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, roomId, startTime, endTime, purpose } = body

    console.log('Dados recebidos para criar reserva:', { userId, roomId, startTime, endTime, purpose })

    if (!userId || !roomId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a sala existe
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a sala está disponível no horário
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        roomId,
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
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } }
            ]
          }
        ]
      }
    })

    if (conflictingReservation) {
      const conflictStart = new Date(conflictingReservation.startTime).toLocaleString('pt-BR')
      const conflictEnd = new Date(conflictingReservation.endTime).toLocaleString('pt-BR')
      
      return NextResponse.json(
        { 
          error: `A sala já está reservada neste horário. Conflito: ${conflictStart} - ${conflictEnd}`,
          conflictingReservation: {
            id: conflictingReservation.id,
            startTime: conflictingReservation.startTime,
            endTime: conflictingReservation.endTime,
            user: conflictingReservation.userId
          }
        },
        { status: 409 }
      )
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        purpose
      },
      include: {
        user: true,
        room: true
      }
    })

    // Atualizar status da sala para RESERVADO
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'RESERVADO' }
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar reserva:', error)
    
    // Verificar se é um erro de validação do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Já existe uma reserva com estes dados' },
          { status: 409 }
        )
      }
      
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Usuário ou sala inválidos' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}
