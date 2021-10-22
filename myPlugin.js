class Test {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('Test', (compilation) => {
      compilation.hooks.additionalAssets.tap('Test', (res) => {
        console.log('=====2222222======')
      })
    })
    compiler.hooks.emit.tap('Test', (compilation) => {
      console.log('====')
      compilation.chunks.forEach((chunk) => {
        chunk.files.forEach((ele) => {
          if (/(app|about).*js$/.test(ele)) {
            console.log(ele)
            const rawCon = compilation.assets[ele].source()
            compilation.assets[ele] = {
              source(res) {
                return `((gs)=>{
                  var window = new Proxy(gs,{
                    get(target,key){
                      //console.log("sssss");
                      console.log('获取了'+key);
                      return Reflect.get(target,key)
                    },
                    set(target,key,value){
                      console.log('设置了'+key);
                       return Reflect.set(target,key,value)
                    }
                  });
                  console.log("=====",window.location);
                  ${rawCon}
              })(window)`
              },
              size() {
                return compilation.assets[ele].length
              },
            }
          }
        })
      })
      // const rawCon = compilation.assets['js/app.[hash]'].source()
    })
  }
}

module.exports = Test
