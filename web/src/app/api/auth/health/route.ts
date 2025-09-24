import { NextResponse } from "next/server";

export async function GET() {
  console.log("🔍 Health check - NextAuth route accessible");
  console.log("Environment check:", {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
  });

  return NextResponse.json({
    status: "ok",
    message: "NextAuth API route is accessible",
    timestamp: new Date().toISOString(),
  });
}
