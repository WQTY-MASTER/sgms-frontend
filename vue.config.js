const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // 开发服务器配置：解决跨域 + 自定义前端端口
  devServer: {
    port: 8081, // 新增：前端运行端口（避免与后端8080冲突）
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 后端服务根地址
        changeOrigin: true // 开启跨域代理（关键：模拟请求的Origin为后端地址）
      }
    }
  }
})