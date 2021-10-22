var text = `
#nav {
  padding: 30px;
}
h {
  sss
} wew ewe  
/* background-color: red; */
.test .test2.test3 {
  /* background-color: red; */
  font-size: 20px;
  background-color: red;
}`
var reg = /(\s*)([\.|#]?.*?)(\s*{\s*[^\}]*?\s*\})/g
// text = `#nav {padding: 30px;}h{sss}.test {font-size: 20px;background-color: red;}`
console.log(text.replace(reg, '$1 .www $2 $3'))
// console.log(text.match(/s/g))
// console.log(text.match(/(\s*[\.|#]?[a-zA-Z]+)\s*(\{.*?\s*\}\s*)/g))
// console.log(text.match(reg))
// console.log(text.match(/\s*\{\s*.*\s*\}?\s*/g))
