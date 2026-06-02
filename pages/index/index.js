// index.js
Page({
  data: {
    resultData: null,
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
    // 轮播自动切换
    this.bannerTimer = setInterval(() => {
      let next = this.data.currentBanner + 1
      if (next >= this.data.banners.length) next = 0
      this.setData({ currentBanner: next })
    }, 3000)
  },
  onUnload() {
    if (this.bannerTimer) clearInterval(this.bannerTimer)
  },
  switchBanner(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentBanner: index })
  },
  onAction(e) {
    const key = e.currentTarget.dataset.key
    // 后续实现具体功能跳转
    console.log('点击功能:', key)
  }
})
