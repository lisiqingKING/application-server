var express = require('express');
var router = express.Router();
var fs = require('fs');
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
    bannerStoreLocation: path.resolve("E:", "DB_SOURCE", "bannerList"),
    userDir:path.resolve("E:","DB_SOURCE","Users")
}



let songers = fs.readdirSync(fileConfig.root) //歌手列表  .json
let audioList = fs.readdirSync(fileConfig.AudioStoreLocation) //音源列表 .json
let videoList = fs.readdirSync(fileConfig.VideoStoreLocation) //视频源列表  .json
let songs = new Array() //object 歌曲信息
let auidos = new Array() // STRING 音频id
let videos = new Array() // STRING 视频id
let songAbout = new Array() //object 歌曲相关信息包含歌词

//歌曲，歌手列表 直接拉到运存中
songers.forEach((songer) => {
    let data = fs.readFileSync(path.resolve(fileConfig.root, songer))
    songs = songs.concat(JSON.parse(data))
})

audioList.forEach((audio) => {
    auidos.push(audio.slice(0, audio.lastIndexOf(".")))
})

videoList.forEach((video) => {
    videos.push(video.slice(0, video.lastIndexOf(".")))
})




//搜索框简单查询
function matchSonger(content) {
    let tempArray = new Array()
    songers.forEach((songer) => {
        if (new RegExp(content).test(songer)) {
            songer = songer.slice(0, songer.lastIndexOf('.'))
            tempArray.push(songer)
        }
    })
    return tempArray
}

function matchSong(content) {
    let tempArray = new Array()
    songs.forEach((song) => {
        if (new RegExp(content).test(song.name)) {
            tempArray.push(song)
        }
    })
    return tempArray
}

function getRecSongs() {
    //随机抽取
    let temp = []
    for (let i = 0; i < 5; i++) {
        temp.push(songs[i])
    }
    return temp
}

const LISTS = [
    '王力宏', '李圣杰', '李泉', '周杰伦', '张靓颖',
    'Alan Walker', 'Sia', 'Lady Gaga', '阿黛尔', 'Zedd',
    'BLACKPINK', '黄致列', '少女时代', '米津玄师', 'iU'
]

function getRecSongers() {
    var temp = []
        //抽取以上个人信息以及图片,图片任意选一张
    LISTS.forEach((songer) => {
        let filename = songer + ".json"
        let data = fs.readFileSync(path.resolve(fileConfig.root, filename))
        let jsonData = JSON.parse(data)
        temp.push(jsonData[0])
    })
    return temp
}

//获取默认图片
router.get("/img/:name", function(req, res, next) {
    const fileName = req.params.name
    res.sendFile(path.resolve(fileConfig.bannerStoreLocation, fileName), function(err) {
            if (err) {
                next(err)
            } else {
                console.log('Sent:', path.resolve(fileConfig.bannerStoreLocation, fileName))
            }
        })
        //next()
})

//获取歌曲相关图片
router.get("/picture/:name", function(req, res, next) {
    const fileName = req.params.name
    res.sendFile(path.resolve(fileConfig.imagsStoreLocation, fileName), function(err) {
        if (err) {
            next(err)
        } else {
            console.log('Sent:', path.resolve(fileConfig.bannerStoreLocation, fileName))
        }
    })
})


router.get("/rec/:type", function(req, res, next) {
    if (req.params.type == "songs") {
        res.send(getRecSongs())
    } else if (req.params.type == 'songers') {
        res.send(getRecSongers())
    }
    res.end()
})

//搜索框简单查询
router.post('/query', function(req, res, next) {
    let query = req.body.data.query
    var result1 = matchSonger(query)
    var result2 = matchSong(query)
    result = [result1, result2]
    res.send(result)
    res.end()
});

//关键字查询 具有可扩展性
router.get("/queryByKeyword/:key", function(req, res, next) {
    //目前就支持 歌曲
    //后续扩展
    let key = req.params.key
    let song = matchSong(key)
    res.send(song)
    res.end()
})

router.get("/audioExist/:rid", function(req, res, next) {
    //查询音源是否存在
    let id = req.params.rid
    let filename = id + ".mp3"
    let fileLocation = path.resolve(fileConfig.AudioStoreLocation, filename)
    if (fs.existsSync(fileLocation)) {
        res.send({
            exist: true
        })
    } else {
        res.send({
            exist: false
        })
    }
    res.end()

})

router.get("/videoExist/:rid", function(req, res, next) {
    //查询视频源是否存在
    let id = req.params.rid
    let filename = id + ".mp4"
    let fileLocation = path.resolve(fileConfig.VideoStoreLocation, filename)
    if (fs.existsSync(fileLocation)) {
        res.send({
            exist: true,
        })
    } else {
        res.send({
            exist: false,
        })
    }
    res.end()

})

router.get("/audio/:audioName", function(req, res, next) {
    //获取音源
    let filename = req.params.audioName
    res.sendFile(path.resolve(fileConfig.AudioStoreLocation, filename), function(err) {
        res.end()
    })
})




router.get("/video/:videoName", function(req, res, next) {
    //获取视频源
    let fileName = req.params.videoName 
    res.sendFile(path.resolve(fileConfig.VideoStoreLocation, fileName), function(err) {
        res.end()
    })
})

//获取评论 []
//返回json
router.get("/comment/:type/:rid", function(req, res, next) {
    let type = req.params.type
    let rid = req.params.rid
    let fileLocation
    if (type == "song") { fileLocation = path.resolve(fileConfig.songCommentsStoreLocation, rid + ".json") } else {
        fileLocation = path.resolve(fileConfig.videoCommentStoreLocation, rid + ".json")
    }
    if (fs.existsSync(fileLocation)) {
        res.send(JSON.parse(fs.readFileSync(fileLocation)))
    } else {
        res.send([])
    }
    res.end()

})

//获取歌词相关信息 {}
//返回json
router.get("/songAbout/:rid", function(req, res, next) {
    let fileLocation = path.resolve(fileConfig.songAboutStoreLocation, req.params.rid + ".json")
    if (fs.existsSync(fileLocation)) {
        res.send(JSON.parse(fs.readFileSync(fileLocation)))
    }else {
        res.send({})
    }
    res.end()
})

router.get("/querySonger/:name",function(req,res,next){
    //此处的api 查询的结果必定存在
    let name = req.params.name
    try {
        let fileLocation = path.resolve(fileConfig.root,`${name}.json`)
        let data = JSON.parse(fs.readFileSync(fileLocation))
        res.send(data)
        res.end()

    }catch(err) {
        function matchSong(name_) {
            let temp = []
            songs.forEach((song) => {
                if(song.artist === name_) {
                    temp.push(song)
                }
            })
            return temp
        }

        res.send(matchSong(name))
        res.end()
    }
   
})


//用来检测用户是否存在
function checkIsExist(name) {
    let users = fs.readdirSync(fileConfig.userDir)
    let exist = false 
    for(let y=0;y<users.length;y++) {
        if(users[y] === `${name}.json`) {
            exist = true 
        }
    }

    return exist //如果为真：存在 ，如果为假的：不存在
}


router.post("/login",function(req,res,next) {
    let s0 = {
        state:"success",
        message:"登录成功"
    }
    let s1 = {
        state:"fail",
        message:"用户不存在"
    }
 
    let s2 = {
        state:"fail",
        message:"密码错误"
    }
 
    if(checkIsExist(req.body.form.username)) {
        let user = JSON.parse(fs.readFileSync(path.resolve(fileConfig.userDir,`${req.body.form.username}.json`)))
        if(user.password === req.body.form.password) {
            res.send(s0)
        }else {
            res.send(s2)
        }
    }else {
        res.send(s1)
    }
    
     res.end()
})

router.post("/register",function(req,res,next){
  
    try {
        if(checkIsExist(req.body.form.username)){
            res.send({
                state:"fail",
                message:"用户已存在"
            })
        }else {
             
            let obj = req.body.form 
            obj.commets = []
            let data = JSON.stringify(obj)
            fs.writeFileSync(path.resolve(fileConfig.userDir,`${req.body.form.username}.json`),data)
            res.send({
                state:"success",
                message:"用户注册完成"
            })
        }
    }catch(err) {
        res.send({
            state:"fail",
            message:"server happen error"
        })
        console.log(err)
    }
  
   
    res.end()
})


module.exports = router;