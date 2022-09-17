module.exports = {
    entry:  __dirname + "/front/tasksview/main.js",//已多次提及的唯一入口文件
    output: {
      path: __dirname + "/public/javascripts/",//打包后的文件存放的地方
      filename: "cmdb.tasksview.js"//打包后输出文件的文件名
    }
}