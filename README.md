# Import

## 介绍
Import是一款面向下一代web应用程序的轻量级微前端框架,使用Import可以使一个巨大的应用分业务分系统开发，单独集成，单独部署，最终通过Import构建成一个应用。

### 关于“微前端”
> 与使用不同 JavaScript 框架的多个团队构建现代 Web 应用程序的技术、策略和方法。—微前端


微前端的概念，是在后端 server less 相关概念时候出现的，其实大致的思路是差不多的，每一个功能（服务）独立部署、独立运行，每一个模块都拆分成更小，更易于管理的 微应用

### Import 有什么特点

💃 上手简单，从始至终站在开发者的角度设计每一个功能

💪 HTML 入口访问模式，不同技术栈兼容性强

🛡 样式隔离，解决应用之间样式冲突

🧳 with+Function+proxy 实现JS沙盒，强大的运行时隔离

⚡ 预加载、资源缓存，速度快。

### 演示尝鲜（vue为例）
1. 第一步，只需要在要加载远程应用的地方导入即可，如下：

```javascript
// router.js
// 实例化一个加载器，并且定义两个钩子函数，分别在子应用加载和卸载的时候执行
import ComponentImport from '@/importor/componentImport'
let { Import } = new ComponentImport()
  .on('mounted', (vm, entry) => {
    console.log(entry + ' in mounted')
  })
  .on('unmounted', (vm, entry) => {
    console.log(entry + ' in unmounted')
  })

const routes = [
  // 普通方式导入组件是这样的
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/Test1',
    name: 'Test1',
    component: TEST1
  },
  {
    path: '/Test2',
    name: 'Test2',
    component: TEST2
  },
  // 远程加载一个子应用是这样的，其中TEST3是主应用的一个组件，它将成为app3这个子应用的宿主，即app3会挂载到TEST3
  {
    path: '/Test3/*',
    name: 'Test3',
    component: Import(TEST3, 'app3', {
      origin: 'http://localhost:8081/app3',
      cssScope: true, // 是否开启css隔离
      proxy: true, // 是否走代理访问，推荐代理；直连要解决静态资源路径问题
      activeRoute: '/Test3/app3', // 子应用进去实现激活的路由
      prefix: '', // 资源前缀
      pathRewrite: {
        '/app3': '', // 资源path重写
      },
    }),
  },
]
```
2.子应用注册到主应用中（app3为例）
```javascript
// App.vue
 export default {
    // __isSandBox__ 判断是否为沙箱环境
    // registerApp 将app注册到主应用
    // 这些属性、方法都是由沙箱提供，无需引入
    created() {
      if (window.__isSandBox__) {
        registerApp(this)
      }
    },
  }
```
3.子应用webpack配置（app3为例）

```javascript
module.exports = {
  publicPath: '/app3', // 为所有资源加上app3/前缀，因为要走代理，用于区分不同应用
  devServer: {
    port: '8081',
    headers: {
      'Access-Control-Allow-Origin': '*', // 允许跨域
    },
  },
}

```
4.主应用配置本地开发代理（线上配置相应的nginx代理即可）

```javascript
module.exports = {
  publicPath: './',
  outputDir: './dist',
  devServer: {
    open: false,
    overlay: {
      warnings: false,
      errors: true,
    },
    proxy: {
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
  },
}

```
####  结束了，是不是感觉和平时开发没有什么太大的区别，这也正是Import相对于其他微前端框架的一大特点

### ✨更多技术细节和框架文档将在正式版本发布后发布，敬请期待！✨
