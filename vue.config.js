/*
 * @Description:
 * @Author: caiwu
 * @CreateDate:
 * @LastEditor:
 * @LastEditTime: 2021-08-27 16:14:54
 */
// const myPlugin = require('./myPlugin')
module.exports = {
  publicPath: './',
  outputDir: './dist',
  configureWebpack: {
    // plugins: [new myPlugin()],
  },
  devServer: {
    open: false,
    overlay: {
      warnings: false,
      errors: true,
    },
    // 配置代理 （以接口 https://www.easy-mock.com/mock/5ce2a7854c85c12abefbae0b/api 说明）
    proxy: {
      '/app1': {
        target: 'http://49.234.27.60/app1',
        changeOrigin: true, // 是否改变域名
        ws: true,
        pathRewrite: {
          // 路径重写
          '/app1': '', // 这个意思就是以api开头的，定向到哪里, 如果你的后边还有路径的话， 会自动拼接上
        },
      },
      '/app2': {
        target: 'http://49.234.27.60/app2',
        changeOrigin: true, // 是否改变域名
        ws: true,
        pathRewrite: {
          // 路径重写
          '/app2': '', // 这个意思就是以api开头的，定向到哪里, 如果你的后边还有路径的话， 会自动拼接上
        },
      },
      // '/app3': {
      //   target: 'http://49.234.27.60/app3',
      //   changeOrigin: true, // 是否改变域名
      //   ws: true,
      //   pathRewrite: {
      //     // 路径重写
      //     '/app3': '', // 这个意思就是以api开头的，定向到哪里, 如果你的后边还有路径的话， 会自动拼接上
      //   },
      // },
      '/app3': {
        target: 'http://localhost:8081/app3',
        changeOrigin: true, // 是否改变域名
        ws: true,
        pathRewrite: {
          // 路径重写
          '/app3': '', // 这个意思就是以api开头的，定向到哪里, 如果你的后边还有路径的话， 会自动拼接上
        },
      },
    },
    // 下边这个， 如果你是本地自己mock 的话用after这个属性，线上环境一定要干掉
    // after: require("./mock/mock-server.js")
  },
}
