/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add worker-loader only for client-side
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      });
    }
    return config;
  },
};

module.exports = nextConfig;