var jsonSchemaGenerator = require('json-schema-generator');
var express = require('express');
var router = express.Router();
const { MongoClient ,ObjectID} = require("mongodb");
const clone = require('clone');
const path=require('path');
const fs=require('fs');
const multer=require('multer');
var sillydt = require('silly-datetime');


const UPLOAD_PATH=path.join(__dirname, "../public/upload") 
let storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, UPLOAD_PATH);
	},
	filename: function (req, file, cb) {
		//cb(null, 'upload_' + Date.now() + path.extname(file.originalname));
		var now = new Date();
		var format = sillydt.format(now, 'YYYY_MM_DD_HH_mm_ss');
		cb(null, format + "_" + now.getTime() + "_" + file.originalname);
	},
});
let upload = multer({ storage: storage });

// Replace the uri string with your connection string.
const uri =
  "mongodb://zsl:zsl@localhost?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const database = client.db('cmdb');
const tasksTb = database.collection('tasks');
const purchasedTb = database.collection('purchased');
const leasedTb = database.collection('leased');
const orderTb = database.collection('order');


var equipmentInfo=[];
var rentInfo=[];
var tasks=[];
var purchased=[];
var leased=[];
var order=[];

const TB_CONFIGS=[
  {type:'tasks' , title:'任务分解' , columns:[
    { title: "任务" ,name: "task" },
    { title: "地点" ,name: "site" },
    { title: "责任人" ,name: "owner" },
    { title: "开始时间" ,name: "starttime"},
    { title: "结束时间" ,name: "endtime"},
    { title: "依赖设备" ,name: "equipments"},
    { title: "数量" ,name: "count"},
    { title: "备注" ,name: "remark"},
  ]},
  {type:'purchased' , title:'已购设备' , columns:[
    { "title": "资产名称" },
    { "title": "品牌" },
    { "title": "型号" },
    { "title": "预算单价" },
    { "title": "数量" },
  ]},
  {type:'leased' , title:'已租设备', columns:[
    { "title": "资产名称" },
    { "title": "品牌" },
    { "title": "型号" },
    { "title": "预算单价" },
    { "title": "数量" },
  ]},
  {type:'order' , title:'设备需求', columns:[
    { "title": "资产名称" },
    { "title": "品牌" },
    { "title": "型号" },
    { "title": "预算单价" },
    { "title": "数量" },
  ]},
];
  



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/listrecord', function(req, res, next) {
  res.render('listrecord');
});
router.get('/addrecord', function(req, res, next) {
  res.render('addrecord');
});
router.get('/tasksview', function(req, res, next) {
  res.render('tasksview');
});


router.get('/getconfig.do', function(req, res, next) {
  var config = null;
 
  for(var i = 0 ;i < TB_CONFIGS.length ; i ++)
  {
    config = TB_CONFIGS[i];
    if(config.type == req.query.type)
    {
      break;
    }
  }
  res.json(config);
});

router.get('/getall.do', async function(req, res, next) {
  var configs = clone(TB_CONFIGS);
  
  for(var i = 0 ;i < configs.length ; i ++)
  {
    var data = [];
    var config = configs[i];
    
    var tbc = database.collection(config.type);
    var cursor = tbc.find();
    await cursor.forEach((item)=>{
      data.push(item);
    });
    config.data = data;
    
  }
  
  res.json(configs);
});


router.post('/add.do', async function(req, res, next) {
  var reqJson = req.body;
  var result = null;
  for(var i = 0 ;i < TB_CONFIGS.length ; i ++)
  {
    var config = TB_CONFIGS[i];
    
    if(config.type == reqJson.type)
    {
      var tbc = database.collection(config.type);
      // this option prevents additional documents from being inserted if one fails
      result = await tbc.insertMany(reqJson.data, { ordered: true });
      break;
    }
  }
  res.json({errorCode:0,result:result});
});

router.post('/delete.do', async function(req, res, next) {
  var reqJson = req.body;
  var result = null;
  for(var i = 0 ;i < TB_CONFIGS.length ; i ++)
  {
    var config = TB_CONFIGS[i];
    
    if(config.type == reqJson.type)
    {
      var tbc = database.collection(config.type);
      result = await tbc.deleteOne({ _id: new ObjectID(reqJson.rowdata._id) });
      break;
    }
  }
  res.json({errorCode:0,result:result});
});
router.post('/edit.do', async function(req, res, next) {
  var reqJson = req.body;
  var result = null;
  for(var i = 0 ;i < TB_CONFIGS.length ; i ++)
  {
    var config = TB_CONFIGS[i];
    
    if(config.type == reqJson.type)
    {
      var tbc = database.collection(config.type);
      // create a document that sets the plot of the movie
      result = await tbc.updateOne({ _id: new ObjectID(reqJson.rowdata._id) } ,{$set: reqJson.rowdata}, { upsert: true });
      break;
    }
  }
  res.json({errorCode:0,result:result});
});

router.post('/addfromexcel.do', upload.single('file'), function (req, res, next) {
  let domin = req.protocol + '://' + req.get('host');
  let url = domin + '/upload/' + req.file.filename;
  res.json({
    data: url,
  });
});

module.exports = router;
