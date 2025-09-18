import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RoomWithItems } from '@/lib/types'

// Cache simples em memória
let roomsCache: any[] | null = null
let lastCacheTime = 0
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutos

//apenas para testar a api
export async function GET() {
  try {
    const now = Date.now()
    return NextResponse.json(`Teste API - ${now}`)
  } catch (error) {
    console.error('Erro ao buscar salas:', error)
    return NextResponse.json({ error: 'Erro ao buscar salas' }, { status: 500 })
  }
}