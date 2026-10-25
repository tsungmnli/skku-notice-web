import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Docker 이미지가 .next/standalone 만 복사해서 실행한다 (Dockerfile 참고)
  output: "standalone",
};

export default nextConfig;
