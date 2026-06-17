// app.js
const config = require('./utils/config')

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d9gwg880y5393ee08', // 替换为你的云环境ID
        traceUser: true
      })
    }
    // 初始化云数据库引用
    this.db = wx.cloud ? wx.cloud.database() : null
    this.collection = this.db ? this.db.collection(config.collectionName) : null
    this.userCategoryCollection = this.db ? this.db.collection('user_category') : null
    this.userCollection = this.db ? this.db.collection('users') : null

    // 从本地缓存加载用户信息
    this.loadUserFromStorage()

    console.log('App launched, cloud db initialized:', !!this.collection)
  },

  // 从本地缓存加载用户信息
  loadUserFromStorage() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.globalData.userInfo = userInfo
        this.globalData.isLoggedIn = true
        console.log('Loaded user from storage:', userInfo.nickName)
      }
    } catch (e) {
      console.warn('Load user from storage failed:', e)
    }
  },

  // 保存用户信息到本地和云数据库
  saveUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    this.globalData.isLoggedIn = true

    // 保存到本地缓存
    try {
      wx.setStorageSync('userInfo', userInfo)
    } catch (e) {
      console.warn('Save user to storage failed:', e)
    }

    // 同步到云数据库
    if (this.userCollection && userInfo._id) {
      this.userCollection.doc(userInfo._id).set({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          updatedAt: new Date()
        }
      }).catch(err => {
        console.warn('Sync user to cloud failed:', err)
      })
    } else if (this.userCollection && userInfo._openid) {
      // 新用户，创建云数据库记录
      this.userCollection.add({
        data: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }).then(res => {
        userInfo._id = res._id
        wx.setStorageSync('userInfo', userInfo)
        this.globalData.userInfo = userInfo
        console.log('User created in cloud db:', res._id)
      }).catch(err => {
        console.warn('Create user in cloud failed:', err)
      })
    }
  },

  // 更新用户昵称
  updateNickName(nickName) {
    const userInfo = this.globalData.userInfo
    if (!userInfo) return
    userInfo.nickName = nickName
    this.saveUserInfo(userInfo)
  },

  // 更新用户头像
  updateAvatarUrl(avatarUrl) {
    const userInfo = this.globalData.userInfo
    if (!userInfo) return
    userInfo.avatarUrl = avatarUrl
    this.saveUserInfo(userInfo)
  },

  // 退出登录（清除用户数据）
  logout() {
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    try {
      wx.removeStorageSync('userInfo')
    } catch (e) {
      console.warn('Remove user storage failed:', e)
    }
    console.log('User logged out')
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
