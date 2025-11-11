/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: false, // Desabilitar para evitar problemas de hidratação dupla
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
    ],
  },
  // Configurações para melhorar estabilidade em produção
  experimental: {
    serverComponentsExternalPackages: ["prisma"],
  },
  // Evitar problemas de hidratação em produção
  swcMinify: true,
  // Configurações específicas para produção
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
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
        ],
      },
    ];
  },
  // Otimizações de webpack para reduzir problemas
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Configurações específicas para client-side build
      config.optimization.splitChunks.cacheGroups.vendor = {
        test: /[\\/]node_modules[\\/]/,
        name: "vendors",
        chunks: "all",
        priority: 10,
        reuseExistingChunk: true,
        enforce: true,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
