// 后端API配置
const config = {
  // 智能分类API地址
  //此处ip地址改成自己的，ipconfig查询局域网ip，确定后端电脑与前端在同一个wife下
  classifyApiUrl: 'http://10.116.74.29:8080/api/waste/recognize',
  // 云数据库集合名称
  collectionName: 'classify_records'
}

module.exports = config
