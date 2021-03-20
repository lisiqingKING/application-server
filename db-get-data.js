/**
 * 爬虫 从酷我音乐网页端爬取数据
 * 数据一千首歌
 * 
 * 获取某位歌手的歌曲信息
 * 获取完后 连接mongodb 保存数据
 * 保存后 对于 歌手下属资源信息 图片 音频 视频 评论 请求获取
 */
var axios = require('axios');
var fs = require('fs');
var path = require('path');
var request = require('request')
var mongoose = require('mongoose')

var reqUrl = `http://www.kuwo.cn/`;
let config = {
    headers:{
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

function countRequestNumber (count){
    count ? count : 1
    return Number(count)
}

function isExist(){

}

function headersReset(h1,h2){
    // h1 是新获取的headers 
    // h2 是准备发送的headers
    if(h1.reqid) { h2.reqid = h1.reqid }
    if(h1['set-cookie']){
        var newCookie = h1['set-cookie'].toString()
        newCookie = newCookie.toString().slice(0,newCookie.indexOf(';'))
        h2.Cookie = newCookie
    }
    
}

// axios.get(reqUrl,{}).then((res)=>{
//     // config.headers.Cookie = res.headers['set-cookie']  注释这一段 否则无法生效
//     var  searchContent="王力宏",pn=1,rn=30,reqId="7a46eb30-608f-11eb-8857-a59473e",httpsStatus=1
//     var reqUrl_ = `http://www.kuwo.cn/api/www/search/searchMusicBykeyWord?key=${encodeURI('王力宏')}&pn=${pn}&rn=${rn}&httpsStatus=${httpsStatus}&reqId=${reqId}`
//     let get_ = function () {
//         axios.get(reqUrl_,config).then((res)=>{
//             console.log('header',res.headers);
//             // if(pn<20) { 
//             // pn+=1; 
//             // headersReset(res.headers,config.headers)
//             // get_(reqUrl_)
//             // }else {
//             //     console.log(`get total count :${pn*rn}`)
//             // }
//             console.log(res.data.data.list)
//             function callback(){
//                 fs.readFile(path.resolve('E:','music.json'),(err,data)=>{
//                     let d = JSON.parse(data)
//                     console.log(d[0])
//                 })
//             }
//             fs.writeFile(path.resolve('E:','music.json'),JSON.stringify(res.data.data.list),callback)
//          })
//     }
//     get_()
// }).catch((err) =>{
//     console.error(err)
// })

// response headerss of request http://kuwo.cn/ 
// { server: 'nginx',
//   date: 'Wed, 27 Jan 2021 08:57:30 GMT',
//   'content-type': 'text/html; charset=utf-8',
//   'transfer-encoding': 'chunked',
//   connection: 'close',
//   vary: 'Accept-Encoding, Accept-Encoding, Accept-Encoding',
//   'accept-ranges': 'none',
//   etag: '"33ced-NN4SqHk9aSLEbZmtIiFa7oTmJJU"',
//   'set-cookie':
//    [ 'kw_token=XP5PYWAAYWK; path=/; expires=Fri, 26 Feb 2021 08:57:30 GMT' ] }

/**
 * 1.获取搜索内容
 * 2.获取歌手歌曲 Request URL: http://www.kuwo.cn/api/www/search/searchMusicBykeyWord?key=%E7%8E%8B%E5%8A%9B%E5%AE%8F&pn=1&rn=30&httpsStatus=1&reqId=684ba770-6118-11eb-8a18-d92b717b8254
 */

 
 function downloadAudio(rid,time,reqId){
    // 128k 196k 320k 音频质量
     var format = "mp3" , br= "128kmp3" ,httpsStatus = 1;
     var urlm = "http://www.kuwo.cn/url?format=+format+&rid=${rid}&response=url&type=convert_url3&br=${br}&from=web&t=${time}&httpsStatus=1&reqId=${reqId}`
     axios
     .get(urlm).then((res) => {
            request(res.data.url)
            .on('error',(err)=>{console.log(err);process.exit() })
            .on('complete',(resp,body)=>{console.log('ok!') })
            .pipe(fs.createWriteStream(path.resolve('E:','Audio',`${rid}.mp3`)))   
})
 }

 function downloadVideo(){
     
 }


function stat_(){
    var d = fs.readFileSync(path.resolve('E:','music.json'))
    return d;
}
 

function downloadMusicResource(type){
    if(type === 'mv') {
        o.forEach((value,index,arr) =>{
            if(Boolean(value.hasmv)){ 
                getMvResouce(value.rid,new Date().getTime())
            }
            
        })
    }
    else if(type === 'comment') {
        o.forEach((value,index,arr) =>{
            function callback() {console.log(value.name) }
            setTimeout(function(){ getComment(1,value.rid,15,callback); },(Math.random())*1000) })
           
    }
    else {
        o.forEach((value,index,arr) =>{
            setTimeout(function(){ getsongInfo(value.rid) },(Math.random())*1000) })
           
    }

    


}

//downloadMusicResource()

function getMvResouce(rid,time){

    /**
     * test url : http://www.kuwo.cn/comment?type=get_comment&f=web&page=1&rows=20&digest=15&sid=844993&uid=0&prod=newWeb&httpsStatus=1&reqId=26393450-6470-11eb-9846-9d21988d7536
     * disgest 15 song 
     * diggest 7 mv 
     */

    let config = {
        headers:{
            Accept: 'application/json, text/plain, */*',
           'Accept-Encoding': 'gzip, deflate',
           'Accept-Language': 'zh-CN,zh;q=0.9',
            Connection: 'keep-alive',
            Cookie: 'kw_token=SDMDV5C9RNQ',
            csrf: 'SDMDV5C9RNQ',
            Host: 'www.kuwo.cn',
            Referer: 'http://www.kuwo.cn/',
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
        }
    }

    config.headers.Referer = `http://www.kuwo.cn/search/list?key=${encodeURI('王力宏')}`
    var url = `http://www.kuwo.cn/url?rid=${rid}&response=url&format=mp4%7Cmkv&type=convert_url&t=${time}&httpsStatus=1&reqId=4adad490-643d-11eb-a6d3-cdfa98efd273`

    axios
    .get(url,config)
    .then((res)=>{console.log('res:',res.data)})
    .catch((err)=>{console.log('err',err)})
}

//downloadMusicResource()

function getComment(page,sid,digest,callback){
    var tn = 0;
    let config = {
        headers:{
            Accept: 'application/json, text/plain, */*',
           'Accept-Encoding': 'gzip, deflate',
           'Accept-Language': 'zh-CN,zh;q=0.9',
            Connection: 'keep-alive',
            Cookie: 'kw_token=JWOMQFLT0U',
            csrf: 'JWOMQFLT0U',
            Host: 'www.kuwo.cn',
            Referer: `http://www.kuwo.cn/mvplay/${sid}`,
           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
        }
    }
    var url = `http://www.kuwo.cn/comment?type=get_comment&f=web&page=${page}&rows=20&digest=${digest}&sid=${sid}&uid=0&prod=newWeb&httpsStatus=1&reqId=4b191610-643d-11eb-a6d3-cdfa98efd273`
    axios.get(url,config)
    .then((res)=>{
        // fs.writeFile(path.resolve('E:','comment.json'),JSON.stringify(res.data),{flag:'w'},(err)=>{ if(err) { console.log(err) } })
        //console.log(res.headers)
        headersReset(res.headers,config)
        callback()
        console.log(res.data.total)
    })
    .catch((err)=>{

       
    })
}


//downloadMusicResource("comment")

function createSchema (origin) {
    for(let attr in origin) {
        origin[attr] = { type:origin[attr].__proto__.constructor ,default:null }
    }
    return origin
}
function dbStore(data){
    /**
     * test-data: 对象数组
     */
    let o = createSchema(data[0])
    console.log('Schema: ',o)
    mongoose.connect("mongodb://localhost/my")
    let db = mongoose.connection
    db.once("open",()=>{console.log("connect ok")}).on("error",(err)=>{console.log(err?err:"")})
    //console.log('o',o)
    var Schema = new mongoose.Schema(o)
    var Song = mongoose.model('Song',Schema,'songs')
    data.forEach((value,index,arr)=>{
        new Song(value).save().then((value) => {
            console.log('save ok!!')
        })
    })

}

// var d1 = fs.readFileSync(path.resolve("E:","music.json")) 
// d1 = JSON.parse(d1)
//console.log(d1) 
//dbStore(d1)

function getsongInfo(musicId){
    var url = `http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${musicId}&httpsStatus=1&reqId=26169120-6470-11eb-9846-9d21988d7536`
    axios.get(url).then((res)=>{
        console.log(res.data)
    })
    .catch((err)=>{
        console.log('err:',err)
        process.exit()
    })
}

var num = 0;
function getArtistImfo(category){
    var url =  'http://www.kuwo.cn/api/www/artist/artistInfo?category=' +
                category +
               '&pn=1&rn=6&reqId=' +
               '605ce400-b5d6-11e9-bbe2-cfe3cd6caf94'
    //config.headers['Cookie'] = "_ga=GA1.2.529781879.1611747289; Hm_lvt_cdb524f42f0ce19b169a8071123a4797=1611804198,1612011444,1612016490,1612144179; _gid=GA1.2.1846117700.1612144179; Hm_lvt_9f78d600df240bfd0362a7f55a913bb5=1611804198,1612011444,1612016490,1612144179; Hm_lpvt_cdb524f42f0ce19b169a8071123a4797=1612171841; Hm_lpvt_9f78d600df240bfd0362a7f55a913bb5=1612171841; kw_token=IONICCXQZE8; _gat=1"
    //config.headers['csrf'] = "IONICCXQZE8"
    axios.get(url,config)
    .then((res)=>{
        headersReset(res.headers,config)
        console.log(res.status)
        //console.log(res.headers)
        console.log(res.data.data.artistList)
        num+=1;
        if(2>num && Number(res.status)!= 200){
            getArtistImfo(11,1,6)
        }
        
    })
    .catch((err)=>{
        if(err) {console.log(err)}
    })
}

//getArtistImfo(11)

function getBangdanList(){
    var url = "http://www.kuwo.cn/api/www/bang/index/bangList?httpsStatus=1&reqId=381be320-64fc-11eb-9846-9d21988d7536"
    axios.get(url,config)
    .then((res)=>{
        console.log(res.data)
    })
}

//getBangdanList()

function getAlbumById(albumId,pn,rn) {
    var reqId = "93448a00-6500-11eb-9846-9d21988d7536"
    var url = "http://www.kuwo.cn/api/www/album/albumInfo?albumId="+albumId+
              "&pn="+pn+
               "&rn="+rn+
               "&httpsStatus=1"+
               "&reqId="+reqId
    
}