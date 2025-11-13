import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
  status?: number;
}

// Função para validar token mobile
function validateMobileToken(token: string): {
  email: string | null;
  valid: boolean;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email, timestamp, hash] = decoded.split(":");

    // Verificar se não é muito antigo (24 horas)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return { email: null, valid: false };
    }

    // Verificar hash
    const data = `${email}:${timestamp}`;
    const expectedHash = crypto
      .createHash("sha256")
      .update(data + "SALA_SECRET_KEY")
      .digest("hex");

    if (hash !== expectedHash) {
      return { email: null, valid: false };
    }

    return { email, valid: true };
  } catch {
    return { email: null, valid: false };
  }
}

// Função para gerar token mobile
export function generateMobileToken(email: string): string {
  const timestamp = Date.now().toString();
  const data = `${email}:${timestamp}`;
  const hash = crypto
    .createHash("sha256")
    .update(data + "SALA_SECRET_KEY")
    .digest("hex");
  return Buffer.from(`${data}:${hash}`).toString("base64");
}

// Função híbrida para autenticação (web + mobile)
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Tentar autenticação por token primeiro (mobile)
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { email, valid } = validateMobileToken(token);

      if (valid && email) {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, role: true },
        });

        if (user) {
          return { success: true, user };
        }
      }

      return { success: false, error: "Token inválido", status: 401 };
    }

    // Tentar autenticação por sessão (web)
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, role: true },
      });

      if (user) {
        return { success: true, user };
      }
    }

    return { success: false, error: "Não autorizado", status: 401 };
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return { success: false, error: "Erro interno", status: 500 };
  }
}
