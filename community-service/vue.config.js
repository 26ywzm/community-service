const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: [
      'sq.26ywzm.icu',
      'localhost',
      '127.0.0.1',
    ],
  },
})
