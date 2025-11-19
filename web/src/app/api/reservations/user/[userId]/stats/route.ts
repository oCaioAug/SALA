import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    console.log('📊 Buscando estatísticas para usuário:', userId)

    // Buscar todas as reservas do usuário
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        createdAt: true
      }
    })

    console.log('📊 Reservas encontradas:', reservations.length)

    // Calcular estatísticas
    const now = new Date()
    
    const stats = {
      total: reservations.length,
      completed: reservations.filter(r => {
        const endTime = new Date(r.endTime)
        return endTime < now && r.status === 'APPROVED'
      }).length,
      active: reservations.filter(r => {
        const startTime = new Date(r.startTime)
        const endTime = new Date(r.endTime)
        return startTime <= now && endTime >= now && r.status === 'APPROVED'
      }).length,
      pending: reservations.filter(r => r.status === 'PENDING').length,
      rejected: reservations.filter(r => r.status === 'REJECTED').length,
    }

    console.log('📊 Estatísticas calculadas:', stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas de reservas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}