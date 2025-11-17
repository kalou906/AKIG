// ============================================================
// 🚀 Performance Optimization Configuration
// ============================================================
// Ultra-high performance settings for AKIG frontend

const WebpackBundleAnalyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // ============================================================
      // Minification & Compression
      // ============================================================
      if (env === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  arrows: true,
                  toplevel: true,
                },
                output: {
                  comments: false,
                },
                mangle: {
                  toplevel: true,
                },
              },
              extractComments: false,
            }),
          ],
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                name: 'react-vendors',
                priority: 20,
                reuseExistingChunk: true,
              },
            },
          },
        };

        // Add compression plugin
        webpackConfig.plugins = [
          ...webpackConfig.plugins,
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
            deleteOriginalAssets: false,
          }),
        ];
      }

      return webpackConfig;
    },
  },
  devServer: {
    compress: true,
    port: 3000,
    historyApiFallback: true,
    headers: {
      'Cache-Control': 'max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
};
