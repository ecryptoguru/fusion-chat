const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/conversations",
        permanent: false,
      },
    ]
  }
}

export default nextConfig
