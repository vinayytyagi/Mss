/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'objectstorage.ap-mumbai-1.oraclecloud.com',
      },
    ],
  },
};

export default nextConfig;
