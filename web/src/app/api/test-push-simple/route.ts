import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📱 Teste simples recebido:', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'Teste funcionando!',
      received: body 
    })
  } catch (error) {
    console.error('Erro no teste simples:', error)
    return NextResponse.json(
      { error: 'Erro no teste' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true,
    message: 'GET funcionando!' 
  })
}