/** Static export: runs on Cloudflare Pages / Firebase Hosting with no server. */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
