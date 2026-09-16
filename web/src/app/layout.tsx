import "./globals.css";

import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { ReactNode } from "react";

const _ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const _jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SALA",
  description: "Sistema de Gerenciamento",
};

// Com next-intl, o layout raiz não deve ter HTML/BODY, apenas o layout do locale
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
