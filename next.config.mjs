/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer : rendu PDF côté serveur uniquement, ne pas bundler.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "sharp"],
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
