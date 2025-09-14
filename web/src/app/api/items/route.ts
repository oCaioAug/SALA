import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        room: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Erro ao buscar itens:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, specifications, quantity, icon, roomId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do item é obrigatório' },
        { status: 400 }
      )
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        specifications: specifications || [],
        quantity: quantity ? parseInt(quantity) : 1,
        icon,
        roomId: roomId || null
      },
      include: {
        room: true
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar item:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
