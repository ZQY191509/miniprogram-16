// app.js
App({
  onLaunch() {
    console.log('App launched')
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
