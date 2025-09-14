import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        room: true
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Erro ao buscar item:', error)
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
    const { name, description, specifications, quantity, icon, roomId } = body

    const item = await prisma.item.update({
      where: { id: params.id },
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

    return NextResponse.json(item)
  } catch (error) {
    console.error('Erro ao atualizar item:', error)
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
    await prisma.item.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Item deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar item:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
