<!--
 * @Description: 
 * @Author: caiwu
 * @CreateDate: 
 * @LastEditor: 
 * @LastEditTime: 2021-08-16 17:21:44
-->
<template>
  <div id="app2" style="height: 100vh; overflow: scroll">
    <div id="nav">
      <router-link to="/">Home</router-link> |
      <router-link to="/TEST1">TEST1</router-link>|
      <router-link to="/TEST2">TEST2</router-link>|
      <router-link to="/TEST3/">TEST3</router-link>
    </div>
    <router-view />
  </div>
</template>

<style lang="scss">
#app2 {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
body {
  padding: 0;
  margin: 0;
}
</style>
