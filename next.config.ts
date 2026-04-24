import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions body size limit.
  // 기본 1MB → 상품 수정 시 description(base64 이미지 포함) + 기타 필드가 통째로 실려서
  // 쉽게 초과됨. 상세설명 이미지 4MB × 다수 + 여유 고려해서 30MB로 상향.
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
