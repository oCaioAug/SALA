import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso"
    });
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
