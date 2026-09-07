/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer : rendu PDF côté serveur uniquement, ne pas bundler.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "sharp"],
    // Uploads via Server Actions (visuel réduit côté client, PDF signé…) : on
    // relève la limite par défaut (1 Mo). Vercel plafonne de toute façon à ~4,5 Mo.
    serverActions: { bodySizeLimit: "5mb" },
    // Vercel n'embarque pas /public dans la fonction serverless : on force
    // l'inclusion des polices (lues par Font.register lors de la génération PDF).
    outputFileTracingIncludes: {
      "/artistes/[id]": ["./public/fonts/**"],
      "/**": ["./public/fonts/**"],
    },
  },
  // Optimisation d'images (redimensionnement + WebP + cache) pour les visuels
  // Supabase Storage — évite de servir les masters HD pleine résolution.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
