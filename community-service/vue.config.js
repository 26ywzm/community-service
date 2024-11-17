const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: 'all',
    https: false, 
    client: {
      webSocketURL: 'wss://localhost:8080/ws',
    },
  },
})
