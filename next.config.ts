import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Configurazione per PDF.js - evita problemi con SSR
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    
    // Escludi PDF.js worker dal server-side rendering
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('pdfjs-dist');
    }

    return config;
  },
  
  // Configura il tracing per evitare warning sui lockfiles
  experimental: {
    outputFileTracingRoot: __dirname,
  },
};

export default nextConfig;
