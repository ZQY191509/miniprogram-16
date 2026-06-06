Component({
  options: {
    multipleSlots: true // 在组件定义时的选项中启用多slot支持
  },
  /**
   * 组件的属性列表
   */
  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false,
    },
    animated: {
      // 显示隐藏的时候opacity动画效果
      type: Boolean,
      value: true
    },
    show: {
      // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    // back为true的时候，返回的页面深度
    delta: {
      type: Number,
      value: 1
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    displayStyle: ''
  },
  lifetimes: {
    attached() {
      try {
        const rect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : { left: 0, width: 87 }
        let sysInfo = {}
        try {
          sysInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync()
        } catch (e) {
          sysInfo = wx.getSystemInfoSync()
        }
        const platform = sysInfo.platform || 'ios'
        const isAndroid = platform === 'android'
        const isDevtools = platform === 'devtools'

        let windowInfo = {}
        try {
          windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
        } catch (e) {
          windowInfo = wx.getSystemInfoSync()
        }
        const windowWidth = windowInfo.windowWidth || 375
        const safeTop = (windowInfo.safeArea && windowInfo.safeArea.top) || 0

        const left = rect.left || 0
        this.setData({
          ios: !isAndroid,
          innerPaddingRight: `padding-right: ${windowWidth - left}px`,
          leftWidth: `width: ${windowWidth - left}px`,
          safeAreaTop: isDevtools || isAndroid ? `height: calc(var(--height) + ${safeTop}px); padding-top: ${safeTop}px` : ``
        })
      } catch (e) {
        console.warn('navigation-bar init error:', e)
        this.setData({
          ios: true,
          innerPaddingRight: 'padding-right: 87px',
          leftWidth: 'width: 87px',
          safeAreaTop: ''
        })
      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _showChange(show) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'
          };transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({
        displayStyle
      })
    },
    back() {
      const data = this.data
      if (data.delta) {
        wx.navigateBack({
          delta: data.delta
        })
      }
      this.triggerEvent('back', { delta: data.delta }, {})
    }
  },
})
