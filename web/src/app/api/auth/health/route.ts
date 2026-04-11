import { NextResponse } from "next/server";

export async function GET() {
  console.log("Health check - NextAuth route accessible");

  const envCheck = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not_set",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "set" : "missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      ? "set"
      : "missing",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    HARDCODED_URL:
      process.env.NODE_ENV === "production"
        ? "https://sala.ocaioaug.com.br"
        : "Not in production",
  };

  console.log("Environment check:", envCheck);

  return NextResponse.json({
    status: "ok",
    message: "NextAuth API route is accessible",
    environment: envCheck,
    expectedDomain: "https://sala.ocaioaug.com.br",
    timestamp: new Date().toISOString(),
  });
}
