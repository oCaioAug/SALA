import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic behavior to prevent static optimization
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🔍 Testing session...");

    const session = await getServerSession(authOptions);
    console.log("Session data:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "No session found",
          session: null,
        },
        { status: 401 }
      );
    }

    // Buscar usuário no banco
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true, name: true },
    });

    console.log("DB User:", dbUser);

    return NextResponse.json({
      session: {
        email: session.user.email,
        role: session.user.role,
        id: session.user.id,
      },
      dbUser,
    });
  } catch (error) {
    console.error("Error testing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
