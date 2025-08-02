/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Don't resolve Node.js modules on the client to prevent this error on build
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
        dns: false,
        timers: false,
        "timers/promises": false,
        os: false,
        path: false,
        url: false,
        util: false,
        stream: false,
        buffer: false,
        events: false,
        assert: false,
        constants: false,
        domain: false,
        punycode: false,
        querystring: false,
        string_decoder: false,
        sys: false,
        vm: false,
        zlib: false,
      };
    }
    return config;
  },
};

export default nextConfig;
