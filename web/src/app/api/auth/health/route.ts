import { NextResponse } from "next/server";

export async function GET() {
  console.log("🔍 Health check - NextAuth route accessible");
  
  const envCheck = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
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
