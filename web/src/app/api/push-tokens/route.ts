import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 POST /api/push-tokens recebido!')
    
    const body = await req.json()
    console.log('📱 Body recebido:', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'Push token endpoint funcionando!',
      data: body
    })
  } catch (error) {
    console.error('❌ Erro no push-tokens:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  console.log('📱 GET /api/push-tokens recebido!')
  return NextResponse.json({ 
    success: true,
    message: 'GET funcionando!' 
  })
}