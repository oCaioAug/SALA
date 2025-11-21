import { ReactNode } from "react";
import "./globals.css";
// Importe suas fontes aqui
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SALA",
  description: "Sistema de Gerenciamento",
};

// ESTE LAYOUT É O DONO DAS TAGS HTML e BODY
// Com next-intl, o layout raiz não deve ter HTML/BODY, apenas o layout do locale
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
