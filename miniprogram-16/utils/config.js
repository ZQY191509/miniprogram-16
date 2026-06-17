// 后端API配置
const config = {
  // 智能分类API地址
  //此处ip地址改成自己的，ipconfig查询局域网ip，确定后端电脑与前端在同一个wife下
<<<<<<< Updated upstream
  classifyApiUrl: 'http://192.168.195.117:8080/api/waste/recognize',
    // 语音识别API地址（新增）
    voiceApiUrl: 'http://192.168.216.117:8080/api/waste/recognize-voice',
=======
  classifyApiUrl: 'http://10.41.139.29:8080/api/waste/recognize',
    // 语音识别API地址（新增）
    voiceApiUrl: 'http://10.41.139.29:8080/api/waste/recognize-voice',
>>>>>>> Stashed changes
  // 云数据库集合名称
  collectionName: 'classify_records'
}

module.exports = config
