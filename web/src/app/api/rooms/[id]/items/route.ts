import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const items = await prisma.item.findMany({
      where: { roomId: params.id },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Erro ao buscar itens da sala:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, specifications, quantity, icon } = body

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
        roomId: params.id
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
