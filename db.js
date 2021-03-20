/**
 * 完成对数据库的开启
 */
var mongoose = require('mongoose')
var fs = require('fs')
var path = require('path')

let db = {
    DB: null,
    DB_NAME: 'test',
    log: function () {
        /**
         * 存储相关日志 
         * 数据库开启时间
         */
    },
    start: function (dbName) {
        this.DB_NAME = dbName ? dbName : this.DB_NAME
        mongoose.connect(`mongodb://localhost/${this.DB_NAME}`)
        this.DB = mongoose.connection
        this.DB.once("open", function () {
            console.log(`${db.DB_NAME} have open`)
        })
        this.DB.on("error", function () {
            console.log(`${db.DB_NAME} have close`)
        })
    },

    query: function (queryCondition, collection, callback) {
        var Schema = new mongoose.Schema({})
        let Collection = mongoose.model(String("document"), Schema, collection)
        Collection.find(queryCondition, callback)
    },
    upate: function (updateConditon, updateObject, collection, callback) {
        //传入更新的对象 和 对应的集合
        //回调函数 是更新完成后的动作
        let Collection = mongoose.model(String("document"), Schema, collection)
        Collection.updateMany(updateConditon, updateObject, callback)
    },
    delete: function (deleteCondition, collection, callback) { },
    insert: function (insertCondition, collection, callback) { },
    steamStore: function (path, stream) {
        /**
         * 指定路径和流文件
         */
    }
}

module.exports = db 
