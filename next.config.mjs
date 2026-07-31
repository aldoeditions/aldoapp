/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer : rendu PDF côté serveur uniquement, ne pas bundler.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
