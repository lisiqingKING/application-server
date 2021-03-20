var express = require('express');
var router = express.Router();
var db = require('../db.js')


/* GET users listing. */
router.get('/register', function(req, res, next) {
  //将回调函数传进去 让数据查询完后 进行处理
  function callbackSend(err,docs){
    res.send(docs)
  }
  db.query(null,callbackSend)
});

module.exports = router;
