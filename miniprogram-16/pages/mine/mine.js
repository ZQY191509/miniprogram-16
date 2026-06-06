// pages/mine/mine.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    cacheSize: '0 KB'
  },

  onLoad() {
    this.loadUserInfo()
    this.calcCacheSize()
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      // 构建显示用ID
      const displayId = userInfo._openid 
        ? userInfo._openid.substring(0, 10) + '...' 
        : (userInfo._id ? userInfo._id.substring(0, 8) + '...' : '微信用户')
      
      this.setData({
        userInfo: {
          ...userInfo,
          displayId: displayId
        },
        isLoggedIn: app.globalData.isLoggedIn
      })
    } else {
      // 尝试从本地缓存加载
      try {
        const cached = wx.getStorageSync('userInfo')
        if (cached) {
          app.globalData.userInfo = cached
          app.globalData.isLoggedIn = true
          this.loadUserInfo()
          return
        }
      } catch (e) {}
      
      this.setData({
        userInfo: null,
        isLoggedIn: false
      })
    }
  },

  // 计算缓存大小
  calcCacheSize() {
    try {
      const res = wx.getStorageInfoSync()
      const size = res.currentSize
      if (size < 1024) {
        this.setData({ cacheSize: size + ' KB' })
      } else {
        this.setData({ cacheSize: (size / 1024).toFixed(1) + ' MB' })
      }
    } catch (e) {
      this.setData({ cacheSize: '0 KB' })
    }
  },

  // 微信登录
  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    
    // 先获取用户信息
    wx.getUserProfile({
      desc: '用于完善个人资料',
      success: (res) => {
        const userInfo = res.userInfo
        // 再获取openid
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 如果有云函数，可以通过云函数换取openid
              // 这里简化处理：使用云开发自动获取openid
              if (app.db) {
                // 通过云数据库添加记录自动获取_openid
                app.saveUserInfo({
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl,
                  gender: userInfo.gender,
                  country: userInfo.country,
                  province: userInfo.province,
                  city: userInfo.city
                })
                
                // 延迟刷新，等待云数据库返回_id
                setTimeout(() => {
                  wx.hideLoading()
                  this.loadUserInfo()
                  wx.showToast({ title: '登录成功', icon: 'success' })
                }, 800)
              } else {
                // 无云开发，只用本地缓存
                wx.hideLoading()
                app.saveUserInfo({
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl
                })
                this.loadUserInfo()
                wx.showToast({ title: '登录成功', icon: 'success' })
              }
            } else {
              wx.hideLoading()
              wx.showToast({ title: '登录失败', icon: 'none' })
            }
          },
          fail: () => {
            wx.hideLoading()
            // login失败仍使用本地信息
            app.saveUserInfo({
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl
            })
            this.loadUserInfo()
            wx.showToast({ title: '登录成功', icon: 'success' })
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        if (err.errMsg.includes('cancel')) {
          console.log('用户取消登录')
        } else {
          wx.showToast({ title: '获取用户信息失败', icon: 'none' })
        }
      }
    })
  },

  // 选择头像（微信新版头像选择）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (avatarUrl) {
      wx.showLoading({ title: '保存中...' })
      
      // 更新用户头像
      app.updateAvatarUrl(avatarUrl)
      this.loadUserInfo()
      
      wx.hideLoading()
      wx.showToast({ title: '头像更新成功', icon: 'success' })
    }
  },

  // 修改昵称（微信新版昵称输入）
  onNickNameChange(e) {
    const nickName = e.detail.value
    if (nickName && nickName.trim()) {
      app.updateNickName(nickName.trim())
      this.loadUserInfo()
      wx.showToast({ title: '昵称更新成功', icon: 'success' })
    }
  },

  // 编辑个人信息
  handleEditProfile() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再设置个人信息',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.handleLogin()
          }
        }
      })
      return
    }

    wx.showActionSheet({
      itemList: ['修改昵称', '修改头像', '查看个人信息'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 修改昵称 - 弹出输入框
            this.showNickNameDialog()
            break
          case 1:
            // 修改头像 - 触发 chooseAvatar
            this.showAvatarTip()
            break
          case 2:
            // 查看个人信息
            this.showUserDetail()
            break
        }
      }
    })
  },

  // 显示昵称修改对话框
  showNickNameDialog() {
    // 昵称直接通过输入框编辑，这里给个提示
    wx.showToast({ title: '请在上方点击昵称进行修改', icon: 'none' })
  },

  // 显示头像修改提示
  showAvatarTip() {
    wx.showToast({ title: '请点击上方头像进行更换', icon: 'none' })
  },

  // 显示用户详细信息
  showUserDetail() {
    const userInfo = this.data.userInfo
    if (!userInfo) return
    
    const detailInfo = [
      `昵称: ${userInfo.nickName || '未设置'}`,
      `账号ID: ${userInfo.displayId || '未知'}`,
      `省份: ${userInfo.province || '未知'}`,
      `城市: ${userInfo.city || '未知'}`,
      `国家: ${userInfo.country || '未知'}`
    ].join('\n')
    
    wx.showModal({
      title: '个人信息详情',
      content: detailInfo,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 切换账号
  handleSwitchAccount() {
    wx.showModal({
      title: '切换账号',
      content: '切换账号将清除当前登录信息，需要重新授权登录。确定继续吗？',
      confirmText: '确定切换',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 执行切换
          app.logout()
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          
          wx.showToast({ title: '已退出当前账号', icon: 'success' })
          
          // 延迟后自动弹出登录
          setTimeout(() => {
            this.handleLogin()
          }, 800)
        }
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后将清除本地登录信息，确定退出吗？\n（分类记录不会被清除）',
      confirmText: '确定退出',
      cancelText: '取消',
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  },

  // 清除缓存
  handleClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存数据（不包括分类记录），确定继续吗？',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' })
          
          try {
            // 保留用户信息
            const userInfo = wx.getStorageSync('userInfo')
            wx.clearStorageSync()
            // 恢复用户信息
            if (userInfo) {
              wx.setStorageSync('userInfo', userInfo)
            }
            
            wx.hideLoading()
            this.calcCacheSize()
            wx.showToast({ title: '缓存清除成功', icon: 'success' })
          } catch (e) {
            wx.hideLoading()
            wx.showToast({ title: '清除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 导航到指南页
  goGuide() {
    wx.switchTab({ url: '/pages/guide/guide' })
  },

  // 导航到记录页
  goRecord() {
    wx.switchTab({ url: '/pages/record/record' })
  },

  // 使用帮助
  goHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 在首页上传图片或语音进行垃圾分类识别\n2. 识别结果会自动保存到分类记录\n3. 在指南页查看详细的垃圾分类知识\n4. 在我的页面管理个人账户',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 关于我们
  goAbout() {
    wx.showModal({
      title: '关于智能分类工具',
      content: '智能垃圾分类小程序 V1.0\n\n基于百度AI智能识别技术，帮助您快速准确地分类垃圾，助力环保事业。\n\n通过图片识别和语音识别两种方式，让垃圾分类变得简单高效。',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
