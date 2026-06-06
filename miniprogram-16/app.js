// app.js
const config = require('./utils/config')

App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d7gxsj2gid454ccbd', // 替换为你的云环境ID
        traceUser: true
      })
    }
    // 初始化云数据库引用
    this.db = wx.cloud ? wx.cloud.database() : null
    this.collection = this.db ? this.db.collection(config.collectionName) : null
    console.log('App launched, cloud db initialized:', !!this.collection)
  },
  onShow() {
    // 处理非空页面栈问题：当页面栈异常时重置到首页
    try {
      const pages = getCurrentPages()
      if (pages.length > 0 && pages.length <= 3) {
        // 页面栈正常，不处理
      } else if (pages.length > 3) {
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
    } catch (e) {
      console.warn('onShow error:', e)
    }
  }
})
