// pages/record/record.js
Page({
  data: {
    // 统计数据
    stats: {
      total: 334,
      today: 12,
      week: 48,
      accuracy: 96.5
    },
    // 分类分布
    categoryDist: [
      { name: '可回收物', count: 128, pct: 38, color: '#1677ff' },
      { name: '厨余垃圾', count: 96, pct: 29, color: '#52c41a' },
      { name: '有害垃圾', count: 43, pct: 13, color: '#f53f3f' },
      { name: '其他垃圾', count: 67, pct: 20, color: '#8c8c8c' }
    ],
    // 近7天趋势
    weekTrend: [
      { date: '05/26', count: 5, color: '#91caff' },
      { date: '05/27', count: 9, color: '#1677ff' },
      { date: '05/28', count: 6, color: '#91caff' },
      { date: '05/29', count: 11, color: '#1677ff' },
      { date: '05/30', count: 8, color: '#91caff' },
      { date: '05/31', count: 11, color: '#1677ff' },
      { date: '06/01', count: 12, color: '#52c41a' }
    ],
    // 筛选tab
    tabs: ['全部', '可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'],
    activeTab: 0,
    // 是否显示图表区域
    showCharts: true,
    // 记录列表
    records: [
      {
        id: 1,
        time: '2026-06-01 10:20',
        content: '手机充电器',
        category: '可回收物',
        confidence: 98.2,
        favorited: true
      },
      {
        id: 2,
        time: '2026-06-01 09:15',
        content: '纯牛奶',
        category: '厨余垃圾',
        confidence: 97.5,
        favorited: false
      },
      {
        id: 3,
        time: '2026-06-01 08:02',
        content: '废电池',
        category: '有害垃圾',
        confidence: 99.1,
        favorited: false
      },
      {
        id: 4,
        time: '2026-05-31 18:30',
        content: '运动跑鞋',
        category: '可回收物',
        confidence: 95.1,
        favorited: false
      },
      {
        id: 5,
        time: '2026-05-31 14:10',
        content: '纸巾',
        category: '其他垃圾',
        confidence: 93.7,
        favorited: false
      },
      {
        id: 6,
        time: '2026-05-31 11:05',
        content: '过期药品',
        category: '有害垃圾',
        confidence: 97.8,
        favorited: false
      }
    ],
    // 日期分组
    dateGroups: ['今天', '昨天', '05/31']
  },
  switchTab(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTab: index })
  },
  toggleCharts() {
    this.setData({ showCharts: !this.data.showCharts })
  },
  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    const records = this.data.records.map(r => {
      if (r.id === id) r.favorited = !r.favorited
      return r
    })
    this.setData({ records })
  },
  onExport() {
    console.log('导出记录')
  }
})
