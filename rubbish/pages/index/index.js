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

  onLoad() {
    this.bannerTimer = setInterval(() => {
      let next = this.data.currentBanner + 1
      if (next >= this.data.banners.length) next = 0
      this.setData({ currentBanner: next })
    }, 3000)
  },

  onUnload() {
    if (this.bannerTimer) clearInterval(this.bannerTimer)
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
      wx.showToast({ title: '语音功能开发中', icon: 'none' })
    }
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
  doClassify() {
    this.setData({ classifying: true })

    // 构建请求数据
    const requestData = {
      text: this.data.inputText.trim(),
      images: this.data.imageList
    }

    // 如果有图片，先转换为base64发送（或上传获取URL）
    // 这里先以简单方式发送文本，图片路径
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
  // category: 0=可回收物, 1=厨余垃圾, 2=有害垃圾, 3=其他垃圾
  handleClassifyResult(resData) {
    let items = []
    if (Array.isArray(resData.items)) {
      items = resData.items.map(item => ({
        content: item.content || item.name || '未知物品',
        category: CATEGORY_MAP[item.category] || '其他垃圾',
        categoryIndex: item.category
      }))
    } else if (Array.isArray(resData)) {
      items = resData.map(item => ({
        content: item.content || item.name || '未知物品',
        category: CATEGORY_MAP[item.category] || '其他垃圾',
        categoryIndex: item.category
      }))
    }

    if (items.length === 0) {
      wx.showToast({ title: '未识别到物品', icon: 'none' })
      return
    }

    this.setData({ resultData: items })

    // 存储到云数据库
    this.saveToCloud(items)
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
