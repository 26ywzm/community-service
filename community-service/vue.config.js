const { defineConfig } = require('@vue/cli-service')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: 'all',
    https: true,
    client: {
      webSocketURL: 'wss://sheqv.26ywzm.icu/ws', 
    },
  },
  
  // 生产环境配置
  productionSourceMap: false, // 关闭生产环境的 source map
  
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 5,
        minSize: 20000,
        cacheGroups: {
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial'
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    },
    plugins: [
      new CompressionPlugin({
        test: /\.js$|\.html$|\.css$|\.jpg$|\.jpeg$|\.png/, // 需要压缩的文件类型
        threshold: 10240, // 归档需要进行压缩的文件大小最小值，这里表示大于10K的文件才会被压缩
        deleteOriginalAssets: false // 是否删除原文件
      })
    ]
  },
  
  chainWebpack: config => {
    config.optimization.minimize(true);
    // 移除 prefetch 插件
    config.plugins.delete('prefetch');
    // 移除 preload 插件
    config.plugins.delete('preload');
  }
})
