const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: 'all',
    https: true,
    client: {
      webSocketURL: 'wss://sheqv.26ywzm.icu/ws', 
    },
  },
})
