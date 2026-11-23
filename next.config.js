/** @type {import('next').NextConfig} */
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig = {
  images: {
    remotePatterns: cloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudName}/image/upload/**`
          }
        ]
      : []
  }
};

module.exports = nextConfig;
