const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // 新增devServer代理配置：解决前端/api请求转发到后端8080端口
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务地址
        changeOrigin: true // 开启跨域代理
      }
    }
  }
})