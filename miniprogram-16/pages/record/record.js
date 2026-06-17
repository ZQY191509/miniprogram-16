// pages/record/record.js
const app = getApp()

// 分类样式映射（避免模板内深层三元嵌套）
const CATEGORY_STYLE = {
  '可回收物': { color: '#1677ff', typeClass: 'blue' },
  '厨余垃圾': { color: '#52c41a', typeClass: 'green' },
  '有害垃圾': { color: '#f53f3f', typeClass: 'red' },
  '其他垃圾': { color: '#8c8c8c', typeClass: 'gray' }
}
const DEFAULT_STYLE = { color: '#8c8c8c', typeClass: 'gray' }

Page({
  data: {
    stats: {
      total: 0,
      today: 0,
      week: 0,
      accuracy: 96.5
    },
    categoryDist: [
      { name: '可回收物', count: 0, pct: 0, color: '#1677ff' },
      { name: '厨余垃圾', count: 0, pct: 0, color: '#52c41a' },
      { name: '有害垃圾', count: 0, pct: 0, color: '#f53f3f' },
      { name: '其他垃圾', count: 0, pct: 0, color: '#8c8c8c' }
    ],
    weekTrend: [],
    tabs: ['全部', '可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'],
    activeTab: 0,
    showCharts: true,
    // 原始记录与过滤后记录
    allRecords: [],
    records: [],
    // 按日期分组的数据
    dateGroups: []
  },

  onShow() {
    this.loadRecords()
  },

  // 从云数据库加载记录
  loadRecords() {
    const collection = app.collection
    if (!collection) {
      console.warn('云数据库未初始化')
      this.updateStats([], [])
      return
    }

    // 获取所有记录，按时间倒序
    collection.orderBy('createdAt', 'desc').get().then(res => {
      const records = res.data || []
      this.setData({ allRecords: records })
      this.updateStats(records)
      this.filterRecords(records)
      this.calcCategoryDist(records)
      this.calcWeekTrend(records)
    }).catch(err => {
      console.warn('加载记录失败，显示空状态:', err.message)
      // 云环境不存在或网络错误时，直接显示空数据，不做提示
      this.setData({ allRecords: [] })
      this.updateStats([])
      this.filterRecords([])
      this.calcCategoryDist([])
      this.calcWeekTrend([])
    })
  },

  // 更新统计数据
  updateStats(records) {
    const now = new Date()
    const todayStr = this.formatDate(now)

    // 获取本周一
    const dayOfWeek = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    const mondayStr = this.formatDate(monday)

    let todayCount = 0
    let weekCount = 0

    records.forEach(r => {
      if (r.date === todayStr) todayCount++
      if (r.date >= mondayStr && r.date <= todayStr) weekCount++
    })

    this.setData({
      stats: {
        total: records.length,
        today: todayCount,
        week: weekCount,
        accuracy: 96.5
      }
    })
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  // 过滤记录（根据activeTab）
  filterRecords(allRecords) {
    let records = allRecords || this.data.allRecords
    const activeTab = this.data.activeTab

    if (activeTab > 0) {
      const categoryName = this.data.tabs[activeTab]
      records = records.filter(r => r.category === categoryName)
    }

    // 生成日期分组：今天、昨天、前天
    const now = new Date()
    const groups = this.buildDateGroups(records, now)

    this.setData({
      records: records,
      dateGroups: groups
    })
  },

  // 构建日期分组（为每条记录预计算样式，避免模板深层三元嵌套）
  buildDateGroups(records, now) {
    const todayStr = this.formatDate(now)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = this.formatDate(yesterday)
    const dayBefore = new Date(now)
    dayBefore.setDate(now.getDate() - 2)
    const dayBeforeStr = this.formatDate(dayBefore)

    const groupMap = {}
    const dateLabels = {}
    dateLabels[todayStr] = '今天'
    dateLabels[yesterdayStr] = '昨天'
    dateLabels[dayBeforeStr] = this.formatDisplayDate(dayBeforeStr)

    records.forEach(r => {
      if (!groupMap[r.date]) {
        groupMap[r.date] = []
      }
      // 预计算分类样式，避免模板中深层三元嵌套
      const style = CATEGORY_STYLE[r.category] || DEFAULT_STYLE
      groupMap[r.date].push({
        ...r,
        dotColor: style.color,
        typeClass: style.typeClass,
        displayTime: r.timestamp || (r.date && r.time ? r.date + ' ' + r.time : '')
      })
    })

    // 按今天、昨天、前天顺序排列
    const groupOrder = [todayStr, yesterdayStr, dayBeforeStr]
    const result = []

    groupOrder.forEach(date => {
      if (groupMap[date] && groupMap[date].length > 0) {
        result.push({
          label: dateLabels[date],
          date: date,
          items: groupMap[date]
        })
      }
    })

    return result
  },

  // 格式化显示日期 MM/DD
  formatDisplayDate(dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    return `${parts[1]}/${parts[2]}`
  },

  // 计算分类分布
  calcCategoryDist(records) {
    const dist = [
      { name: '可回收物', count: 0, pct: 0, color: '#1677ff' },
      { name: '厨余垃圾', count: 0, pct: 0, color: '#52c41a' },
      { name: '有害垃圾', count: 0, pct: 0, color: '#f53f3f' },
      { name: '其他垃圾', count: 0, pct: 0, color: '#8c8c8c' }
    ]

    records.forEach(r => {
      const cat = dist.find(d => d.name === r.category)
      if (cat) cat.count++
    })

    const total = records.length || 1
    dist.forEach(d => {
      d.pct = Math.round((d.count / total) * 100)
    })//百分比

    this.setData({ categoryDist: dist })
  },

  // 计算近7天趋势
  calcWeekTrend(records) {
    const now = new Date()
    const trend = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = this.formatDate(d)
      const displayDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      const count = records.filter(r => r.date === dateStr).length

      trend.push({
        date: displayDate,
        count: count,
        color: count > 0 ? '#1677ff' : '#91caff'
      })
    }

    this.setData({ weekTrend: trend })
  },

  // 切换Tab筛选
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTab: index })
    this.filterRecords(this.data.allRecords)
  },

  // 切换图表显示/隐藏
  toggleCharts() {
    this.setData({ showCharts: !this.data.showCharts })
  },

  // 切换收藏状态（更新云数据库）
  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const collection = app.collection

    // 先找到当前记录
    const item = this.data.allRecords.find(r => r._id === id)
    if (!item) return

    const newFav = !item.favorited

    // 更新本地数据
    const updateRecords = (list) => list.map(r => {
      if (r._id === id) r.favorited = newFav
      return r
    })

    this.setData({
      allRecords: updateRecords(this.data.allRecords)
    })
    this.filterRecords(this.data.allRecords)

    // 更新云数据库
    if (collection) {
      collection.doc(id).update({
        data: { favorited: newFav }
      }).catch(err => {
        console.error('更新收藏失败:', err)
      })
    }
  },

  // 清空所有记录
  onClear() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有分类记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          this.clearAllRecords()
        }
      }
    })
  },

  clearAllRecords() {
    const collection = app.collection
    if (!collection) {
      wx.showToast({ title: '数据库未初始化', icon: 'none' })
      return
    }

    wx.showLoading({ title: '清空中...' })

    // 由于云数据库一次只能删除一条，需要遍历
    const records = this.data.allRecords
    const promises = records.map(r => collection.doc(r._id).remove())

    Promise.all(promises).then(() => {
      wx.hideLoading()
      this.setData({
        allRecords: [],
        records: [],
        dateGroups: [],
        stats: { total: 0, today: 0, week: 0, accuracy: 96.5 },
        categoryDist: [
          { name: '可回收物', count: 0, pct: 0, color: '#1677ff' },
          { name: '厨余垃圾', count: 0, pct: 0, color: '#52c41a' },
          { name: '有害垃圾', count: 0, pct: 0, color: '#f53f3f' },
          { name: '其他垃圾', count: 0, pct: 0, color: '#8c8c8c' }
        ],
        weekTrend: []
      })
      wx.showToast({ title: '已清空', icon: 'success' })
    }).catch(err => {
      wx.hideLoading()
      console.error('清空失败:', err)
      wx.showToast({ title: '清空失败', icon: 'none' })
    })
  },

  // 导出记录
  onExport() {
    const records = this.data.allRecords
    if (records.length === 0) {
      wx.showToast({ title: '暂无记录可导出', icon: 'none' })
      return
    }

    let text = '分类记录导出\n\n'
    const groups = this.buildDateGroups(records, new Date())

    groups.forEach(group => {
      text += `【${group.label}】\n`
      group.items.forEach(item => {
        text += `  ${item.content} - ${item.category} - ${item.timestamp}\n`
      })
      text += '\n'
    })

    // 复制到剪贴板
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  }
})
