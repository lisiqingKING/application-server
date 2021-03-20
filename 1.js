
var fs = require('fs');
var mongoose = require('mongoose');
var path = require('path');

let fileConfig = {
    root: path.resolve("E:", "DB_SOURCE", "Json"),
    AudioStoreLocation: path.resolve("E:", "DB_SOURCE", "Audio"),
    VideoStoreLocation: path.resolve("E:", "DB_SOURCE", "Video"),
    songCommentsStoreLocation: path.resolve("E:", "DB_SOURCE", "Comment", "Song"),
    videoCommentStoreLocation: path.resolve("E:", "DB_SOURCE", "Comment", "Video"),
    songAboutStoreLocation: path.resolve("E:", "DB_SOURCE", "songAbout"),
    imagsStoreLocation: path.resolve("E:", "DB_SOURCE", "Imags"),
    errImformationStoreLocation: path.resolve("E:", "DB_SOURCE", "error.json"),
}

let dbOperations = {
    // the same model can not complie again 
    collect: null,
    Modelx: null,
    Schemax: null,
    beforeSave: function (origin, collection) {
        Schema = objectModify(origin)
        let modelName = collection.slice(0, collection.lastIndexOf("s"))
        this.Modelx = mongoose.model(modelName, Schema, collection)
    },
    beforeQuery: function (collection) {
        this.collect = null
        let modelName = collection.slice(0, collection.lastIndexOf("s"))
        this.collect = mongoose.model(modelName, {}, collection)
    },
    afterQuery: function () {
        console.log("query finished")
        this.collect = null
    },
    save: function (data, callback) {
        //this.Modelx是一个document构造函数，与此同时还是一个collection
        let doc = new this.Modelx(data)
        doc.save().then(callback)
    },
    query: function (collection, options, callback) {
        this.beforeQuery(collection)
        this.collect.find(options, callback)

    },
    delete: function (options, collection, callback) {
        this.beforeQuery(collection)
        this.collect.remove(options, callback)
    },
    insert: function () {

    }

}

//同步文件读取::json文件
function syncFileRead(path) {
    let d;
    d = fs.readFileSync(path)
    return JSON.parse(d)
}

function dbStart(dbName) {
    var dbName = dbName ? dbName : 'test'
    mongoose.connect(`mongodb://localhost/${dbName}`)
    return mongoose.connection
}

// 用于存储数据库时 生成Schema
function objectModify(object) {

    for (let attr in object) {
        if (typeof object[attr] === 'object' && object[attr] != null) {
            objectModify(object[attr])
        }
        else if (object[attr] === null) {
            object[attr] = { type: String, default: null }
        }
        else if (object[attr] === undefined) {
            object[attr] = undefined
        }
        else {
            object[attr] = { type: object[attr].__proto__.constructor, default: null }
        }
    }

    return object

}


function dataTransformDatabase() {
    const PATH = path.resolve(fileConfig.songAboutStoreLocation)
    const DIR = fs.readdirSync(PATH)
    DIR.forEach((filename, index1) => {
        //console.log(filename)
        let jsonData = syncFileRead(path.resolve(PATH, filename))
        //console.log(jsonData)
            if (index1 == 0 ) {
                dbOperations.beforeSave(jsonData, "songabouts")
            }
            dbOperations.save(jsonData, function (doc) {
                console.log(`写入数据::${doc},  类型为::${typeof song}`)
            })
    })
}




let DB = dbStart("music")
dataTransformDatabase()

//let DB = dbStart("songAbout")

// songs
// songsabout

// dbOperations.query("songs",{artist:"王力宏"},function(err,docs){
//     if(err) {console.error(err)}
//     //docs is a object
//     //get doc by docs[index]
//     //docs :: Array
//     //doc  :: Object //被mongoose重新封装
//     //docs[index]._doc  :: Object //真实doc
//     console.log("value:",Object.keys(docs[0]))
//     console.log(docs[0]._doc.name)
// })

// dbOperations.delete({},"songs",function(err){
//     if(err) {
//         console.error(err)
//     }else {
//         console.log("delete finished")
//     }
// })


// function isExistIndex(index,indexs) {
//     var isExist = false
//     for(let i=0;i<indexs.length;i++) {
//         if(index == indexs[i]) {
//             isExist = true 
//             break;
//         }
//     }
//     return isExist
// }

// var arr = [1,2,3,4,5,6,7,8,9,8,7,6,5,4,3,2,1,1,2,2,3,3,4,4]
// console.log(arr)
// var indexArray = [],count_=0
// for(var i=0;i<arr.length;i++){
//     for(var j=i+1;j<arr.length;j++){
//         if(arr[i] == arr[j]){
//             if(!isExistIndex(j,indexArray)) {
//                 indexArray.push(j)
//             }
            
//         }
//     }
    
// }


// console.log("repeat index::",indexArray)
// indexArray.forEach((v,i)=>{
//      arr.splice(v,1)
//      count_+=1
//      console.log(arr)
// })

// console.log(arr)

