/**
 * 导出某个数据库下的集合 
 */

var mongoose = require('mongoose')
var dbUrl = "mongodb://localhost/my"

var fs = require("fs")
var path = require("path")
const { default: axios } = require('axios')
// mongoose.connect(dbUrl)
// let db = mongoose.connection

/**
 * 
 *  如何查询改数据库下的 collection 
 *  如何找出想要的collection 并且使用它 
 * 
 * let schemaName = new mongoose.Schema(New Object());生成准备写入的document 模版
 * 形成的Schema是接下来改集合创建文档要满足的形式 如果新创建的文档存在Schema不存在的属性 将会被抛弃
 * 集合的单数形式 = mongoose.model(集合的单数形式，模型，选择的集合名字); 如果忽略第三个参数 则按照第一个参数的小写的复数形式形成一个集合
 * 集合的单数形式可以作为构造函数 创建document 与此同时还可以作为集合对象 作为操作
 */
// let Schema = new mongoose.Schema({})
// let Song = mongoose.model('User',Schema,'songs')
// Song.remove({},function(err){console.log(err)
// fs.writeFile(path.resolve("E:","text.txt"),"aaaa",function(err){
//     console.log(err)
// })
console.log(process.platform)