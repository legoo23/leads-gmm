import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Fuerza HTTPS en todo el dominio por 1 año; incluye subdominios
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Convierte cualquier recurso http:// de la página a https:// antes de cargarlo
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
          // Evita que la página sea embebida en iframes de otros dominios
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Bloquea detección de tipo MIME incorrecta
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
