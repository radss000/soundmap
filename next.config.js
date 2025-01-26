// next.config.js
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // Support Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      loader: 'worker-loader',
      options: {
        filename: 'static/[hash].worker.js',
        publicPath: '/_next/',
      },
    });
    return config;
  },
};