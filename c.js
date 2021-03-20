
const { throws } = require('assert');
var axios = require('axios');
const { assert } = require('console');
const { EventEmitter } = require('events');
const e = require('express');
var fs = require('fs');
var mongoose = require('mongoose');
var path = require('path');
var request = require('request');
const db = require('./db');



/**
 * 
 * 流程:
 *      1.获取歌曲列表(.json)
 *          1.相关图片
 *          2.相关评论
 *          3.相关歌词
 *          4.相关流文件
 *      2.获取视频列表(.json)
 *          1.相关图片
 *          2.相关评论
 *          3.相关流文件
 * 
 *      3.下载： 
 *         ::图片 音频 视频
 *         1.请求超时错误: 先写入文件，后续处理完再进行数据请求
 * 
 *      注：每一个json文件以长度1000作为限度
 * 
 */

let fileConfig = {
    root: path.resolve("E:", "DB_SOURCE", "Json"),
    AudioStoreLocation: path.resolve("E:", "DB_SOURCE", "Audio"),
    VideoStoreLocation: path.resolve("E:", "DB_SOURCE", "Video"),
    songCommentsStoreLocation: path.resolve("E:", "DB_SOURCE", "Comment", "Song"),
    videoCommentStoreLocation: path.resolve("E:", "DB_SOURCE", "Comment", "Video"),
    songAboutStoreLocation: path.resolve("E:", "DB_SOURCE", "songAbout"),
    imagsStoreLocation: path.resolve("E:", "DB_SOURCE", "Imags"),
    errImformationStoreLocation: path.resolve("E:", "DB_SOURCE", "error.json"),
    //jsonFileStoreLocation: path.resolve("E:", "DB_SOURCE", "muiscAbout.json"),
}

let globalConfig = {
    headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Connection: 'keep-alive',
        Cookie: 'kw_token=6AZRGTT4US8',
        csrf: '6AZRGTT4US8',
        Host: 'www.kuwo.cn',
        Referer: 'http://www.kuwo.cn/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    }
}

let globalConfig1 = {
    reqId: "58ef7480-6502-11eb-9846-9d21988d7536",
    httpsStatus: 1
}

let tempObject = {
    data: new Array(),
    songInfos: new Array(),
    videoInfos: new Array(),
    count1: 0,
    limit1: 1,
    err: new Array()
}

var array = [
    "王力宏", "周杰伦", "林俊杰", "张宇", "薛之谦",
    "周深", "张国荣", "李宗盛", "李健", "赵英俊",
    "陶喆", "李晓东", "毛不易", "伍佰", "郭富城",
    "张信哲", "李克勤", "GAI周延", "吴青峰", "张韶涵",
    "张靓颖", "苏诗丁", "张碧晨", "邓丽君", "容祖儿",
    "于文文", "范玮琪", "谭维维", "李玟", "孙燕姿",
    "飞儿乐队", "梁静茹", "王菲", "徐佳莹", "田馥甄",
    "火箭少女", "李圣杰", "少女时代", "王心凌", "黎明",
    "黄致列", "黄霄雲", "降央卓玛", "刘若英", "那英",
    "陈雪凝", "韩红", "莫文蔚", "张茜", "韩宝仪",
    "陈慧琳", "许茹芸", "冯提莫", "张惠妹", "徐佳莹",
    "刘惜君", "谭晶", "周冬雨", "BLACKPINK", "T-ara",
    "Twice", "Apink", "f(x)", "Girl's Day", "iU", "BIGBANG", "Alan Walker",
    "Sia", "Zedd", "泰勒·斯威夫特", "Ava Max", "Sasha Sloan", "Katie Sky",
    "阿黛尔", "我是歌手", "天赐的声音", "凯丽·克拉克森",
    "Lady Gaga", "赛琳娜·戈麦斯", "Delacey", "Billie Eilish",
    "席琳·狄翁", "米津玄师", "李泉", "欧美", "日韩", "经典", "抖音"
]

function headersReset(h1, h2) {
    // h1 是新获取的headers 
    // h2 是准备发送的headers
    if (h1.reqid) { h2.reqid = h1.reqid }
    if (h1['set-cookie']) {
        var newCookie = h1['set-cookie'].toString()
        newCookie = newCookie.toString().slice(0, newCookie.indexOf(';'))
        h2.Cookie = newCookie
    }

}


//随机定时发送请求 以避免触发反爬机制
function antiX(callback, time) {
    setTimeout(function () {
        callback()
    },  1000 * time)
}

//sql part------------------------------

//数据库开启
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



//仅仅用于查询时
function dbCollectionGet(collectionName) {
    return mongoose.model("random", new mongoose.Schema(), collectionName)
}

var COUNT_ = 0


let globalSql = {
    currentChema : new Object(),
    currentModel : null 
}


let dbOperations = {
    save:function(data,callback){
        let Model = globalSql.currentModel
        let docs = new Model(data)
        docs.save().then(callback)
    },
    query:function(options,collection,callback){
        let collects = mongoose.model(String(collection),new mongoose.Schema({}),collection)
        collects.find(options,callback)
    }
}
//sql end----------------------------------


//fs start -------------------------------

function storeLocation(fileName, baseDir) {
    console.log("store::", fileName)
    //由于存在相同名字的数据
    //存在公用同一张图片 所以获取的数量会实际
    const BASE_DIR = baseDir ? baseDir : "E://imgs"
    if (!fs.existsSync(path.resolve(BASE_DIR))) {
        fs.mkdirSync(path.resolve(BASE_DIR))
    }
    var fileName = fileName.replace(new RegExp("\//|\/|:", "g"), "")
    pathx = path.resolve(BASE_DIR, fileName)
    return pathx;
}


//同步文件写入::json文件
function syncFileWrite(path, data, options) {
    try {
        data = JSON.stringify(data)
        fs.writeFileSync(path, data, options)
        console.log(`${path} write finished!`)
    } catch (err) {
        console.log("file write error: ", err)
    }

}


//同步文件读取::json文件
function syncFileRead(path) {
    let d;
    d = fs.readFileSync(path)
    return JSON.parse(d)
}

//用于数据库与流文件存储位置的映射
function positionAttrAdd(song, picLocation) {
    /**
     * 图片 视频 被保存后 
     * json数据对象添加新属性 指示保存后的位置 然后再更新数据
     */
    song.picx = picLocation
}

function aboutPictureDown(song) {
    if (song.pic != undefined) {
        var picLocation = storeLocation(song.pic, fileConfig.imagsStoreLocation);//生成存储路径
        //判断图片是否以及存在，也存在则不用写入
        function isExistImag(song) {
            let imagList = fs.readdirSync(fileConfig.imagsStoreLocation)
            var isExist = false;
            for (let i = 0; i < imagList.length; i++) {
                if (song.pic.replace(new RegExp("\//|\/|:", "g"), "") == imagList[i]) {
                    console.log("exist imags")
                    isExist = true
                    break;
                }
            }
            return isExist
        }
        if (!isExistImag(song)) {
            request.get(song.pic, function (err, res) {

            })
                .pipe(fs.createWriteStream(picLocation))
                .on("error", (err) => {
                    console.error("picture ", song.pic, " get failed")
                })
                .on("finish", () => {
                    console.log(`img${song.pic} saved`)
                })

        }
    } else {
        console.log(`${song.name} not have pictures`)
    }

}






//---------------------------------
//下载音频流文件
function downloadAudio(rid, format, br) {
    // 128k 196k 320k 音频质量
    //var format = "mp3" , br= "128kmp3" ,httpsStatus = 1;
    function isExistAudio(rid) {
        var audioList = fs.readdirSync(path.resolve(fileConfig.AudioStoreLocation))
        var isExist = false
        //console.log(audioList)
        for (let i = 0; i < audioList.length; i++) {
            if (audioList[i] == `${rid}.mp3`) {
                console.log("exist audio")
                isExist = true
                break;
            }
        }
        return isExist
    }
    if (!isExistAudio(rid)) {
        time = new Date().getTime()
        var urlm = "http://www.kuwo.cn/url?format=" + format
            + "&rid=" + rid
            + "&response=url&type=convert_url3&br=" + br
            + "&from=web&t=" + time
            + "&httpsStatus=" + globalConfig1.httpsStatus
            + "&reqId=" + globalConfig1.reqId
        axios
            .get(urlm).then((res) => {
                request(res.data.url)
                    .on('error', (err) => { console.log("download err"); })
                    .on('complete', (resp, body) => { console.log('ok!') })
                    .pipe(fs.createWriteStream(path.resolve(fileConfig.AudioStoreLocation, `${rid}.mp3`)))
            })
    }

}
//下载视频流文件
function downloadVideo(rid, format) {
    function isExistVideo(rid, url) {
        let videoList = fs.readdirSync(fileConfig.VideoStoreLocation)
        var isExist = false
        for (let i = 0; i < videoList.length; i++) {
            if (videoList[i] == `${rid}${url.slice(url.lastIndexOf("."))}`) {
                console.log("exist video")
                isExist = true
                break;
            }
        }
        return isExist
    }
    var url = "http://www.kuwo.cn/url?rid=" + rid
        + "&response=url&format=" + encodeURI(format)
        + "&type=convert_url&t=" + new Date().getTime()
        + "&httpsStatus=" + globalConfig1.httpsStatus
        + "&reqId=" + globalConfig1.reqId
    axios.get(url)
        .then((res) => {
            //console.log("downloadpath:", res.data)
            if (!isExistVideo(rid, res.data)) {
                var filename = `${rid}${res.data.slice(res.data.lastIndexOf("."))}`
                var socket = request(res.data)
                    .on("response", (resp) => {
                        //console.log(resp.rawHeaders)
                    })
                    .on("complete", () => { console.log("video finished");socket.end() })
                    .on("error", (err) => { console.log("request error:",err) })
                    .pipe(fs.createWriteStream(path.resolve(fileConfig.VideoStoreLocation, filename)))
            }
        })
        .catch((err) => {
            console.log("504")
            // process.exit()
        })
}

// 用于获取指定歌曲
function getSongerSongList(content, pn, rn, limitPage = 3, tempx) {
    //defalut:90个歌曲，少于90取完
    var url = "http://www.kuwo.cn/api/www/search/searchMusicBykeyWord?key=" + encodeURI(content)
        + "&pn=" + pn
        + "&rn=" + rn
        + "&httpsStatus=" + globalConfig1.httpsStatus
        + "&reqId=" + globalConfig1.reqId
    axios.get(url, globalConfig)
        .then((res) => {
            if (res.data.code && res.data.code == 200) {
                var data = res.data.data
                var total = Number(data.total)
                var current = Number(pn * rn)
                tempx = tempx.concat(data.list)
                if (total > current && 90 > current && limitPage > pn) {
                    pn += 1
                    getSongerSongList(content, pn, rn, limitPage = 3, tempx)
                }
                else {
                    //处理完成返回结果
                    syncFileWrite(path.resolve(fileConfig.root, `${content}.json`), tempx, { flag: 'w' })
                    console.log("ok", tempx.length)
                }
            } else {
                //记录原因::请求成功，但无法获取数据
                console.log("not found data::", `${content}的第${pn}页无法获取数据`)
            }
        })
        .catch((err) => {
            //记录错误原因，以及没有成功获取的内容

            tempObject.err.push({
                "content": content,
            })
            console.log(`${content}::happend ${err}`)

            //process.exit()
        })
}

//用于获取歌手所有视频 ;关键词搜索视频
function getSongerMvList(songer, pn, rn) {
    var url = "http://www.kuwo.cn/api/www/search/searchMvBykeyWord?key=" + encodeURI(songer)
        + "&pn=" + pn
        + "&rn=" + rn
        + "&httpsStatus=" + globalConfig1.httpsStatus
        + "&reqId=" + globalConfig1.reqId
    axios.get(url, globalConfig)
        .then(((res) => {
            syncFileWrite(path.resolve("E:", "video.json"), res.data.data.mvlist, { flag: 'w' })
        }))
}

//用于获取歌曲的信息
function getSongImfo(sid) {
    //keyWord就是歌曲的中心词
    //sid为歌曲id
    //length就是下载的相关长度
    //临时数组
    var url = "http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=" + sid
        + "&httpsStatus=" + globalConfig1.httpsStatus
        + "&reqId=" + globalConfig1.reqId
    axios.get(url)
        .then((res) => {
            //tempArray.push(res.data)
            let data = res.data.data
            // console.log("...")
            // console.log(data.lrclist)
            // console.log("...")
            //没有歌词就是lrclist:null
            //有歌词就是对象数组
            if (data) {
                //一定数目后 写入文件
                //一个歌手的歌曲信息写入一个json文件
                syncFileWrite(path.resolve(fileConfig.songAboutStoreLocation, `${sid}.json`), data, { flag: 'w' })
            }
        })
        .catch((err) => {
            console.log(err)
            //process.exit()
        })
}

//获取视频的信息 貌似不用 先留着
function getVideoImfo(length, mid) {
    //http://www.kuwo.cn/api/www/music/musicInfo?mid=844993&httpsStatus=1&reqId=8f990621-661c-11eb-bc59-b7b77e81beb5
    var url = "http://www.kuwo.cn/api/www/music/musicInfo?mid=" + mid + "&httpsStatus=" + globalConfig1.httpsStatus + "&reqId=" + globalConfig1.reqId
    axios.get(url)
        .then((res) => {
            console.log(res.data)
            tempObject.videoInfos.push(res.data)
            if (tempObject.songInfos.length == length) {
                //一定数目后 写入文件
                syncFileWrite(path.resolve("E:", "VIDEOIMFO.json"), tempObject.videoInfos, { flag: 'w' })
                tempObject.videoInfos = new Array();//清空数据
            }
        })
        .catch((err) => {
            console.log(err)
            process.exit()
        })
}

//获取歌手歌曲的评论
function getComment(sid, page, rows, digest, limit, temp, type) {
    //digest 15: 表示音乐歌曲的评论
    //digest 7:表示视频的评论
    //歌曲 对应评论 如何保存?
    var url = "http://www.kuwo.cn/comment?type=get_comment&f=web&page=" + page
        + "&rows=" + rows
        + "&digest=" + digest
        + "&sid=" + sid
        + "&uid=0&prod=newWeb&httpsStatus=" + globalConfig1.httpsStatus
        + "&reqId=" + globalConfig1.reqId;
    axios.get(url, globalConfig)
        .then((res) => {
            //避免写入错误数据
            if (res.data.result === "ok") {
                headersReset(res.headers, globalConfig.headers)
                var total = Number(res.data.totalPage)
                //2的意思是每一首歌最多是两页 2*20
                temp = temp.concat(res.data.rows)
                if (page === 1) {
                    limit = limit > total ? total : limit; //console.log("limit:", limit) 
                }
                if (limit > page) {
                    page += 1
                    getComment(sid, page, rows, digest, limit, temp, type)
                }
                else {
                    if (type == 'song') {
                        syncFileWrite(path.resolve(fileConfig.songCommentsStoreLocation, `${sid}.json`), temp, { flag: 'w' })
                    } else {
                        syncFileWrite(path.resolve(fileConfig.videoCommentStoreLocation, `${sid}.json`), temp, { flag: 'w' })
                    }

                }

            }


        })
        .catch((err) => {
            console.log("err")
            // //console.log(err.response.status)
            // //此外下下策
            // //---重新完全第二次请求 可以覆盖全部 意思是再执行一次
            // if (err.response.status == 504) {
            //     //服务器超时 未处理
            //     //随机时间发起请求
            //     //设置重新请求次数
            //     //err.response.config
            //     //getSongComment(err.response.config.url,)
            //     console.log(`${sid}have not found`)
            //     if (5 > reqLimit) {
            //         console.log('again', reqLimit);
            //         function callback() {
            //             getSongComment(sid, page, rows, digest, limit, reqLimit)
            //         }
            //         antiX(callback)
            //     }
            // }
            // else {
            //     console.log("err: ", err.response.status)
            //     //process.exit()
            // }

        })
}

//获取歌手视频的评论
// function getVideoComment(sid, page, rows, digest, limit) {
//     //http://www.kuwo.cn/comment?type=get_comment&f=web&page=1&rows=20&digest=7&sid=844993&uid=0&prod=newWeb&httpsStatus=1&reqId=90867360-661c-11eb-bc59-b7b77e81beb5
//     var url = "http://www.kuwo.cn/comment?type=get_comment&f=web&page=" + page
//         + "&rows=" + rows
//         + "&digest=" + digest
//         + "&sid=" + sid
//         + "&uid=0&prod=newWeb&httpsStatus=" + globalConfig1.httpsStatus
//         + "&reqId=" + globalConfig1.reqId;
//     axios.get(url, globalConfig)
//         .then((res) => {
//             //避免写入错误数据
//             if (res.data.result === "ok") {
//                 headersReset(res.headers, globalConfig.headers)
//                 //2的意思是每一首歌最多是两页 2*20
//                 if (page === 1) {
//                     limit = limit > Number(res.data.totalPage) ? Number(res.data.totalPage) : limit; //console.log("limit:", limit) 
//                 }
//                 if (limit > page) {
//                     page += 1
//                     getVideoComment(sid, page, rows, digest, limit)
//                 }
//                 else {
//                     syncFileWrite(path.resolve(fileConfig.videoCommentStoreLocation, `${sid}.json`), res.data.rows ? res.data.rows : [], { flag: 'w' })
//                 }

//             }


//         })
//         .catch((err) => {
//             console.error("x");


//         })
// }



//批量操作
//流图片保存 并且添加存储属性
//歌曲图片下载
function songPictureOperation() {
    //下载图片
    var dataArray = syncFileRead(path.resolve("E:", "MUSIC.json"))
    console.log(dataArray.length)
    dataArray.forEach((song, index) => {
        //console.log(index,": " ,song.pic)
        aboutPictureDown(song);//json对象 一首歌曲的相关信息
        song.picx = storeLocation(song.pic)
    });
    //下载完图片 修改完信息 要写回原来json文件
    syncFileWrite(path.resolve("E:", "MUSIC.json"), dataArray, { flag: 'w' })
}
function songImfomationOperation() {
    var dataArray = syncFileRead(path.resolve("E:", "MUSIC.json"))
    console.log("....")
    dataArray.forEach((song) => {
        getSongImfo(dataArray.length, song.rid)
    })
}
function videoImfomationOperation() {
}
function songCommetOperation() {
    var dataArray = syncFileRead(path.resolve("E:", "MUSIC.json"))
    dataArray.forEach((song, index) => {
        getSongComment(song.rid, 1, 20, 15, 3, 0)
    })
}
function audioDownloadOperation() {
    var dataArray = syncFileRead(path.resolve("E:", "MUSIC.json"))
    dataArray.forEach((song, index) => {
        downloadAudio(song.rid, "mp3", "128kmp3")
        // function callback () {
        //     downloadAudio(song.rid,"mp3","128kmp3")
        // }
        // antiX(callback)
    })
}
function VideoDownloadOperation() {
    var arrayData = syncFileRead(path.resolve("E:", "video.json"))
    arrayData.forEach((element) => {
        downloadVideo(element.id, "mp4|mkv")
    })
}
function videoCommentOperation() {
    var arrayData = syncFileRead(path.resolve("E:", "video.json"))
    arrayData.forEach((element) => {
        getVideoComment(element.id, 1, 20, 7, 3, 0)
    })
}

// function otherAboutGet() {
//     //酷我音乐的首页的相关信息
//     /**
//      * 歌手推荐
//      * 榜单推荐
//      * 专辑推荐
//      * 歌单推荐
//      * 广告一
//      * 广告二
//      */
//     let category = {
//         china: 11,
//         europe: 13,
//         japn_korea: 12,
//         coopearion: 16
//     }
//     var cpn = 1, crn = 6
//     var url1 = "http://www.kuwo.cn/api/www/artist/artistInfo?category=" + category.china
//         + "&pn=" + cpn
//         + "&rn=" + crn
//         + "&httpsStatus=" + globalConfig1.httpsStatus
//         + "&reqId=" + globalConfig1.reqId //获取推荐歌手

//     var url2 = "http://www.kuwo.cn/api/www/bang/index/bangList?httpsStatus=1&reqId=1fe1f082-6dd3-11eb-b2fa-d32da97ec173"//获取推荐榜单


//     let gedan = {
//         cover: "1848",
//         net: "621",
//         blue: "146",
//         europe: "45",
//         recommand: "rcm"
//     }
//     var gpn=1,grn=5
//     var url3 = "http://www.kuwo.cn/api/www/rcm/index/playlist?id=" + gedan.recommand
//         + "&pn=" + gpn
//         + "&rn=" + grn
//         + "&httpsStatus=" + globalConfig1.httpsStatus
//         + "&reqId=" + globalConfig1.reqId//获取推荐表单
//
//  
//}
function requestErrorDeal() {
    //处理批量请求下载时部分数据丢生的情况
}
function filter() {
    //将7000多首歌进行过滤
    //重复id删去
}

function testApi() {
  

    const files = fs.readdirSync(path.resolve(fileConfig.root))
    files.forEach((file, index) => {
        console.log(index,"  ",file)
        //86
        function callbackx () {
            console.log("task beagn")
            let json = syncFileRead(path.resolve(fileConfig.root, file))
            function depatchTasks(json) {
                json.forEach((song,index) => {
                    function callback() {
                        //console.log(index," video began download")
                        //aboutPictureDown(song)
                        //getSongImfo(song.rid)
                        //downloadAudio(song.rid,"mp3","128kmp3")
                        //downloadAudio(song.rid,"mp3","128kmp3")
                        // if (Boolean(song.hasmv)) {
                        //     downloadVideo(song.rid, "mp4|mkv")
                        // }
                         getComment(song.rid,1,20,15,2,new Array(),"song") //歌曲评论
                         getComment(song.rid,1,20,7,2,new Array(),"video") //视频评论
                    }
                    antiX(callback, index)
                    //getComment(song.rid,1,20,15,2,new Array(),"song") //歌曲评论
                    //getComment(song.rid,1,20,7,2,new Array(),"video") //视频评论
                })
            }
            depatchTasks(json)
        }
        antiX(callbackx,5*index)
    })
    //7689
}
//testApi();用于获取原始数据




function dataTransformDatabase(DB,isSave){
    const PATH = path.resolve(fileConfig.root)
    const DIR = fs.readdirSync(PATH)
    let isSaved = isSave || false
    DIR.forEach((filename,index1,dir)=>{
        if(index1>=0) {
            let songerSongList = syncFileRead(path.resolve(PATH,filename))
            console.log("first:",index1)
            songerSongList.forEach((song,index2,songList)=>{
                if(isSaved && index1==0 && index2==0) {
                        let songSchema = objectModify(song)
                        let Schema = new mongoose.Schema(songSchema)
                        var Song = mongoose.model("song",Schema)
                        globalSql.currentChema = Schema
                        globalSql.currentModel = Song 
                        console.log("...")
                }
                if(index2>=0){
                //    dbOperations.save(song,function(docs){
                //        console.log(docs.name,"have saved")
                //    })
                dbOperations.query({"name":"王力宏"},"songs",function(err,docs){
                    if(err) return console.error(err)
                    console.log(docs)
                })
                }
            })
        }
    })
}

let DB = dbStart("music")
dataTransformDatabase(DB)