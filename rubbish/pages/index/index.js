// index.js
const config = require('../../utils/config')
const app = getApp()

// 分类编号映射
const CATEGORY_MAP = ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾']
const CATEGORY_COLOR = {
  '可回收物': '#1677ff',
  '厨余垃圾': '#52c41a',
  '有害垃圾': '#f53f3f',
  '其他垃圾': '#8c8c8c'
}

Page({
  data: {
    inputText: '',
    imageList: [],          // 上传的图片临时路径列表
    resultData: null,       // 分类结果 [{content, category, categoryIndex}]
    classifying: false,     // 正在分类中
    isRecording: false,
    // 轮播Banner
    banners: [
      { icon: '📸', title: '拍照识别', desc: '拍照一键识别垃圾类别' },
      { icon: '🎯', title: '精准分类', desc: 'AI算法准确率超96%' },
      { icon: '🌱', title: '环保生活', desc: '垃圾分类，从我做起' }
    ],
    currentBanner: 0,
    // 快捷功能
    quickActions: [
      { icon: '📝', text: '文字分类', key: 'text' },
      { icon: '📷', text: '拍照识别', key: 'camera' },
      { icon: '🎤', text: '语音录入', key: 'voice' },
      { icon: '📋', text: '分类记录', key: 'history' }
    ],
    // 热门分类
    hotCategories: [
      { name: '可回收物', icon: '♻️', color: '#1677ff', count: '128次' },
      { name: '厨余垃圾', icon: '🍃', color: '#52c41a', count: '96次' },
      { name: '有害垃圾', icon: '☣️', color: '#f53f3f', count: '43次' },
      { name: '其他垃圾', icon: '🗑️', color: '#8c8c8c', count: '67次' }
    ],
    // 每日小贴士
    tip: '废旧电池属于有害垃圾，需投入红色垃圾桶，切勿随意丢弃以免污染环境。'
  },
// ========== 新增：录音相关实例变量 ==========
recorderManager: null,
innerAudioContext: null,
  onLoad() {
    this.bannerTimer = setInterval(() => {
      let next = this.data.currentBanner + 1
      if (next >= this.data.banners.length) next = 0
      this.setData({ currentBanner: next })
    }, 3000)
     // ========== 新增：初始化录音管理器 ==========
     this.recorderManager = wx.getRecorderManager()
     this.innerAudioContext = wx.createInnerAudioContext()
 
     // 录音结束事件
     this.recorderManager.onStop((res) => {
       console.log('录音结束', res)
       this.uploadVoice(res.tempFilePath)
     })
 
     // 录音错误事件
     this.recorderManager.onError((err) => {
       console.error('录音错误', err)
       wx.showToast({ title: '录音失败', icon: 'none' })
       this.setData({ isRecording: false })
     })
  },

  onUnload() {
    if (this.bannerTimer) clearInterval(this.bannerTimer)
    // ========== 新增：释放音频资源 ==========
    if (this.innerAudioContext) {
      this.innerAudioContext.destroy()
    }
  },

  // 轮播切换
  switchBanner(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentBanner: index })
  },

  // 快捷功能
  onAction(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'camera') {
      this.chooseImage()
    } else if (key === 'history') {
      wx.switchTab({ url: '/pages/record/record' })
    } else if (key === 'text') {
      // 聚焦到输入框
    } else if (key === 'voice') {
      this.startVoiceInput()
    }
  },
  // ========== 新增：开始语音输入 ==========
  startVoiceInput() {
    if (this.data.isRecording) {
      // 停止录音
      this.recorderManager.stop()
      this.setData({ isRecording: false })
    } else {
      // 开始录音
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          this.setData({ isRecording: true })
          wx.showToast({ title: '正在录音，再次点击结束', icon: 'none', duration: 2000 })

          this.recorderManager.start({
            duration: 60000,      // 最长60秒
            sampleRate: 16000,    // 采样率16kHz（适合语音识别API）
            numberOfChannels: 1,  // 单声道
            format: 'wav',        // 音频格式
            audioSource: 'auto'
          })
        },
        fail: () => {
          wx.showModal({
            title: '提示',
            content: '需要录音权限才能使用语音功能',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      })
    }
  },
  // =====================================

  // ========== 新增：上传语音文件到后端 ==========
  uploadVoice(tempFilePath) {
    wx.showLoading({ title: '识别中...' })

    wx.uploadFile({
      url: config.voiceApiUrl,  // 需要在 config.js 中配置此地址
      filePath: tempFilePath,
      name: 'file',
      success: (res) => {
        wx.hideLoading()
        // 解析返回结果（根据你的后端返回格式调整）
        let recognizedText = ''
        try {
          const data = JSON.parse(res.data)
          recognizedText = data.text || data.result || res.data
        } catch (e) {
          recognizedText = res.data
        }

        if (recognizedText && recognizedText !== '语音识别失败') {
          this.setData({
            inputText: recognizedText,
            isRecording: false
          })
          wx.showToast({ title: '识别成功', icon: 'success' })
        } else {
          wx.showToast({ title: '识别失败，请重试', icon: 'none' })
          this.setData({ isRecording: false })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败:', err)
        wx.showToast({ title: '网络错误', icon: 'none' })
        this.setData({ isRecording: false })
      }
    })
  },
 
  // 输入框内容变化
  onInputText(e) {
    this.setData({ inputText: e.detail.value })
  },

  // 搜索按钮
  onSearch() {
    if (!this.data.inputText.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }
    this.doClassify()
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const files = res.tempFiles.map(f => f.tempFilePath)
        const newList = this.data.imageList.concat(files)
        this.setData({ imageList: newList.slice(0, 3) })
      }
    })
  },

  // 删除已选图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index
    const list = this.data.imageList
    list.splice(index, 1)
    this.setData({ imageList: list })
  },

  // 点击"开始分类"
  onStartClassify() {
    if (!this.data.inputText.trim() && this.data.imageList.length === 0) {
      wx.showToast({ title: '请输入内容或上传图片', icon: 'none' })
      return
    }
    this.doClassify()
  },

  // 执行分类（发送HTTP请求到后端）
  async doClassify() {
    this.setData({ classifying: true })
    try {
      const text = this.data.inputText.trim()
      const imageList = this.data.imageList

      // 将图片转为base64
      this.imagesToBase64(imageList, (base64Images) => {
        if (!base64Images && imageList.length > 0) {
          this.setData({ classifying: false })
          wx.showToast({ title: '图片处理失败，请重试', icon: 'none' })
          return
        }

        // 直接调用后端接口（后端会先查CATEGORY_MAP，再查H2数据库）
        this.sendClassifyRequest(text, base64Images || [])
      })
    } catch (err) {
      console.error('分类流程异常:', err)
      this.setData({ classifying: false })
      wx.showToast({ title: '分类失败，请重试', icon: 'none' })
    }
  },

  // 将本地图片路径转为 Base64
  imagesToBase64(filePaths, callback) {
    const fs = wx.getFileSystemManager()
    const tasks = filePaths.map((filePath) => {
      return new Promise((resolve, reject) => {
        fs.readFile({
          filePath: filePath,
          encoding: 'base64',
          success: (res) => resolve(res.data),
          fail: (err) => {
            console.error('读取图片失败:', err)
            reject(err)
          }
        })
      })
    })

    Promise.all(tasks)
      .then((base64List) => callback(base64List))
      .catch(() => {
        this.setData({ classifying: false })
        wx.showToast({ title: '图片读取失败', icon: 'none' })
      })
  },

  // 发送分类请求
  sendClassifyRequest(text, images) {
    const requestData = {
      text: text,
      images: images      // 这里发送的是 Base64 字符串数组
    }

    wx.request({
      url: config.classifyApiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: requestData,
      success: (res) => {
        this.setData({ classifying: false })
        if (res.statusCode === 200 && res.data) {
          this.handleClassifyResult(res.data)
        } else {
          wx.showToast({ title: '分类失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        this.setData({ classifying: false })
        console.error('分类请求失败:', err)
        wx.showToast({ title: '网络请求失败', icon: 'none' })
      }
    })
  },

  // 处理分类返回结果
  // 后端返回格式: { items: [{ content: "物品名", category: 0 }, ...] }
  // category: 0=可回收物, 1=厨余垃圾, 2=有害垃圾, 3=其他垃圾, -1=未识别
  handleClassifyResult(resData) {
    let items = []
    if (Array.isArray(resData.items)) {
      items = resData.items.map(item => ({
        content: item.content || item.name || '未知物品',
        category: item.category === -1 ? '未识别' : (CATEGORY_MAP[item.category] || '其他垃圾'),
        categoryIndex: item.category
      }))
    } else if (Array.isArray(resData)) {
      items = resData.map(item => ({
        content: item.content || item.name || '未知物品',
        category: item.category === -1 ? '未识别' : (CATEGORY_MAP[item.category] || '其他垃圾'),
        categoryIndex: item.category
      }))
    }

    if (items.length === 0) {
      wx.showToast({ title: '未识别到物品', icon: 'none' })
      return
    }

    // 检查是否有未识别的物品（categoryIndex === -1）
    const unresolvedItems = items.filter(item => item.categoryIndex === -1)
    if (unresolvedItems.length > 0) {
      // 显示反馈弹窗，让用户手动分类
      this.showFeedbackForUnresolved(unresolvedItems, items)
    } else {
      // 全部识别成功，直接显示结果
      this.setData({ resultData: items })
      // 存储到云数据库（历史记录）
      this.saveToCloud(items)
    }
  },

  // 为未识别的物品显示反馈弹窗
  showFeedbackForUnresolved(unresolvedItems, allItems) {
    const firstUnresolved = unresolvedItems[0]
    const remaining = unresolvedItems.slice(1)

    wx.showActionSheet({
      itemList: ['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'],
      success: (res) => {
        const category = res.tapIndex
        
        // 更新当前物品的分类
        firstUnresolved.categoryIndex = category
        firstUnresolved.category = CATEGORY_MAP[category]
        
        // 保存到后端H2数据库
        this.saveFeedbackToBackend(firstUnresolved.content, category)
        
        // 如果还有未识别的物品，继续显示弹窗
        if (remaining.length > 0) {
          this.showFeedbackForUnresolved(remaining, allItems)
        } else {
          // 所有物品都处理完毕，显示结果
          this.setData({ resultData: allItems })
          // 存储到云数据库（历史记录）
          this.saveToCloud(allItems)
        }
      },
      fail: () => {
        // 用户取消，仍然显示当前结果（未识别的物品会显示为"未识别"）
        this.setData({ resultData: allItems })
      }
    })
  },

  // 保存用户反馈到后端H2数据库
  saveFeedbackToBackend(itemName, category) {
    wx.request({
      url: config.classifyApiUrl.replace('/recognize', '/save-feedback'),
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        itemName: itemName,
        category: category
      },
      success: (res) => {
        console.log('反馈已保存到后端:', itemName, category)
      },
      fail: (err) => {
        console.error('保存反馈失败:', err)
      }
    })
  },

  // 生成时间戳字符串
  getTimestamp() {
    const now = new Date()
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekDay = weekDays[now.getDay()]
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    return {
      full: `${year}-${month}-${day} ${weekDay} ${hour}:${minute}:${second}`,
      date: `${year}-${month}-${day}`,
      weekDay: weekDay,
      time: `${hour}:${minute}:${second}`
    }
  },

  // 存储到云数据库
  saveToCloud(items) {
    const timestamp = this.getTimestamp()
    const collection = app.collection

    if (!collection) {
      console.warn('云数据库未初始化，跳过存储')
      return
    }

    // 为每个物品创建一条记录
    const promises = items.map(item => {
      return collection.add({
        data: {
          content: item.content,
          category: item.category,
          categoryIndex: item.categoryIndex,
          timestamp: timestamp.full,
          date: timestamp.date,
          weekDay: timestamp.weekDay,
          time: timestamp.time,
          favorited: false,
          createdAt: new Date()
        }
      })
    })

    Promise.all(promises).then(() => {
      console.log('分类结果已存储到云数据库')
    }).catch(err => {
      console.error('存储失败:', err)
    })
  }
})
