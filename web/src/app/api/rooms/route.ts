import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RoomWithItems } from '@/lib/types'

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        items: true,
        reservations: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Erro ao buscar salas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, capacity } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da sala é obrigatório' },
        { status: 400 }
      )
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        capacity: capacity ? parseInt(capacity) : null,
        status: 'LIVRE'
      },
      include: {
        items: true
      }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar sala:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
