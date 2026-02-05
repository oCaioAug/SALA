import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false, // Desabilitar para evitar problemas de hidratação dupla

  // Configuração de imagens atualizada para Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
      {
        protocol: "https",
        hostname: "sala.ocaioaug.com.br",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Removido 'domains' - usar apenas remotePatterns no Next.js 16
  },

  // serverExternalPackages movido para fora de experimental no Next.js 16
  serverExternalPackages: ["prisma", "@prisma/client"],

  // Configuração do Turbopack (novo bundler padrão no Next.js 16)
  turbopack: {
    root: "C:\\dev\\SALA\\web",
  },

  // Reescrever URLs para servir uploads
  async rewrites() {
    return [
      {
        source: "/uploads/avatars/:filename",
        destination: "/api/uploads/avatars/:filename",
      },
    ];
  },

  // swcMinify foi removido - agora é padrão no Next.js 16

  // Configurar headers de segurança
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Otimizações webpack - simplificadas para Next.js 16
  webpack: (config, { isServer }) => {
    // Adicionar suporte para arquivos específicos se necessário
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
