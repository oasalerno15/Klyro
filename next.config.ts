import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://accounts.google.com https://apis.google.com https://www.gstatic.com https://ssl.gstatic.com https://s3.tradingview.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.openai.com https://api.stripe.com https://accounts.google.com https://www.googleapis.com",
              "frame-src 'self' https://js.stripe.com https://accounts.google.com https://www.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
