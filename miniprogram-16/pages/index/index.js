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

// 功能词映射（用于搜索框锚点定位）
const FUNCTION_KEYWORDS = {
  '语音录入': 'voice',
  '语音': 'voice',
  '小贴士': 'tip',
  '提示': 'tip',
  '指南': 'guide',
  '分类指南': 'guide',
  '帮助': 'guide'
}

Page({
  data: {
    inputText: '',
    searchText: '',        // 搜索框文本
    imageList: [],          // 上传的图片临时路径列表
    resultData: null,       // 分类结果 [{content, category, categoryIndex}]
    classifying: false,     // 正在分类中
    isRecording: false,
    inputFocus: false,      // 输入框是否聚焦
    scrollToView: '',       // 滚动锚点
    // 热门分类
    hotCategories: [
      { name: '可回收物', icon: '♻️', color: '#1677ff', key: 'recycle' },
      { name: '厨余垃圾', icon: '🍃', color: '#52c41a', key: 'kitchen' },
      { name: '有害垃圾', icon: '☣️', color: '#f53f3f', key: 'harmful' },
      { name: '其他垃圾', icon: '🗑️', color: '#8c8c8c', key: 'other' }
    ],
    // 每日小贴士
    tip: '废旧电池属于有害垃圾，需投入红色垃圾桶，切勿随意丢弃以免污染环境。',
    tipTags: ['有害垃圾', '废电池', '环保知识'],
    // 搜索结果弹窗
    showSearchResult: false,
    searchResultList: [],
    // 拍照识别弹窗
    showCameraModal: false,
    cameraPreview: '',
    cameraImagePath: '',
    // 语音录入弹窗
    showVoiceModal: false,
    voiceText: '',
    // 上传进度相关
    uploadProgress: 0,
    uploadStage: '',
    pendingTasks: [],
    isOfflineMode: false,
  },
// ========== 录音相关实例变量 ==========
recorderManager: null,
innerAudioContext: null,
// ========== 全局运行状态变量 ==========
_networkListener: null,
_progressInterval: null,
_retryTimer: null,
  onLoad() {
     // ========== 初始化录音管理器 ==========
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

     // ========== 网络状态监听 ==========
     if (!this._networkListener) {
       this._networkListener = (res) => {
         console.log('网络状态变化:', res.isConnected, res.networkType)
         if (res.isConnected) {
           this.setData({ isOfflineMode: false })
           const tasks = wx.getStorageSync('pendingTasks') || []
           if (tasks.length > 0) {
             // 网络恢复了，但后端不一定恢复，先探测
             this.probeBackend().then(reachable => {
               if (reachable) {
                 this.retryPendingTasks()
               } else {
                 this.startBackendPolling()
               }
             })
           }
         } else {
           this.setData({ isOfflineMode: true })
         }
       }
       wx.onNetworkStatusChange(this._networkListener)
     }

     // ========== 首次进入检查网络状态 ==========
     wx.getNetworkType({
       success: (res) => {
         if (res.networkType === 'none') {
           this.setData({ isOfflineMode: true })
           const tasks = wx.getStorageSync('pendingTasks') || []
           if (tasks.length > 0) {
             wx.showToast({ title: `${tasks.length}个任务等待网络恢复`, icon: 'none' })
           }
         } else {
           this.retryPendingTasks()
         }
       }
     })
  },

  onUnload() {
    // ========== 释放音频资源 ==========
    if (this.innerAudioContext) {
      this.innerAudioContext.destroy()
    }
    // ========== 取消网络监听 ==========
    if (this._networkListener) {
      wx.offNetworkStatusChange(this._networkListener)
      this._networkListener = null
    }
    // ========== 清除进度模拟 ==========
    if (this._progressInterval) {
      clearInterval(this._progressInterval)
      this._progressInterval = null
    }
    // ========== 清除后端轮询定时器 ==========
    if (this._retryTimer) {
      clearTimeout(this._retryTimer)
      this._retryTimer = null
    }
  },

  // ===== 搜索框输入 =====
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
  },

  // ===== 搜索确认（双功能）=====
  onSearchConfirm() {
    const keyword = this.data.searchText.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }

    // 检查是否为功能词（锚点定位）
    // 直接匹配或去除常见修饰词后匹配
    let funcKey = FUNCTION_KEYWORDS[keyword]
    if (!funcKey) {
      // 尝试去除"我的"、"我要"等前缀
      const cleanKeyword = keyword.replace(/^我的|^我要|^我要看|^打开|^查看/g, '').trim()
      funcKey = FUNCTION_KEYWORDS[cleanKeyword]
    }
    
    if (funcKey === 'voice') {
      // 打开语音录入弹窗
      this.setData({ showVoiceModal: true, searchText: '' })
      return
    } else if (funcKey === 'tip' || funcKey === 'tips') {
      // 滚动到小贴士区域
      this.setData({ scrollToView: 'tipArea', searchText: '' })
      setTimeout(() => this.setData({ scrollToView: '' }), 500)
      return
    } else if (funcKey === 'guide') {
      // 切换到指南tab
      wx.switchTab({ url: '/pages/guide/guide' })
      return
    }

    // 否则搜索物品分类（使用本地搜索，后端暂无搜索接口）
    this.localSearch(keyword)
  },

  // ===== 搜索物品（本地搜索）=====
  searchItem(keyword) {
    this.localSearch(keyword)
  },

  // 本地搜索（备用）
  localSearch(keyword) {
    const localDB = [
      { name: '电池', category: '有害垃圾' },
      { name: '纸箱', category: '可回收物' },
      { name: '剩饭', category: '厨余垃圾' },
      { name: '纸巾', category: '其他垃圾' }
    ]
    const resultList = localDB.filter(item => item.name.includes(keyword))
      .map(item => ({
        name: item.name,
        category: item.category,
        color: CATEGORY_COLOR[item.category]
      }))
    this.setData({
      showSearchResult: true,
      searchResultList: resultList
    })
  },

  // 关闭搜索结果弹窗
  closeSearchResult() {
    this.setData({ showSearchResult: false, searchResultList: [], searchText: '' })
  },

  // 阻止冒泡
  preventBubble() {},

  // 填入输入框（手动点击）
  onFillInput(e) {
    const name = e.currentTarget.dataset.name
    this.setData({
      inputText: name,
      showSearchResult: false,
      searchResultList: [],
      searchText: ''
    })
    wx.showToast({ title: '已填入输入框', icon: 'success' })
  },

  // ===== 快捷功能栏 =====
  onAction(e) {
    const key = e.currentTarget.dataset.key
    if (key === 'camera') {
      // 打开拍照识别弹窗
      this.setData({ showCameraModal: true })
    } else if (key === 'history') {
      // 直接跳转历史页面
      wx.switchTab({ url: '/pages/record/record' })
    } else if (key === 'text') {
      // 定位到主输入框并唤起键盘
      this.setData({ 
        scrollToView: 'inputArea',
        inputFocus: true 
      })
      setTimeout(() => this.setData({ scrollToView: '' }), 500)
    } else if (key === 'voice') {
      // 打开语音录入弹窗
      this.setData({ showVoiceModal: true })
    }
  },
  // ========== 拍照识别弹窗功能 ==========
  onTakePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          cameraPreview: tempFilePath,
          cameraImagePath: tempFilePath
        })
      }
    })
  },

  onChooseAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          cameraPreview: tempFilePath,
          cameraImagePath: tempFilePath
        })
      }
    })
  },

  onRetake() {
    this.setData({ cameraPreview: '', cameraImagePath: '' })
  },

  onConfirmPhoto() {
    if (this.data.cameraImagePath) {
      // 将图片填入主输入框（通过imageList）
      this.setData({
        imageList: [this.data.cameraImagePath],
        showCameraModal: false,
        cameraPreview: '',
        cameraImagePath: ''
      })
      wx.showToast({ title: '已填入输入框', icon: 'success' })
    }
  },

  closeCameraModal() {
    this.setData({ 
      showCameraModal: false, 
      cameraPreview: '', 
      cameraImagePath: '' 
    })
  },

  // ========== 语音录入弹窗功能 ==========
  onStartRecord() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.setData({ isRecording: true, voiceText: '' })
        this.recorderManager.start({
          duration: 60000,
          sampleRate: 16000,
          numberOfChannels: 1,
          format: 'wav',
          audioSource: 'auto'
        })
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '需要录音权限才能使用语音功能',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) { wx.openSetting() }
          }
        })
      }
    })
  },

  onStopRecord() {
    this.recorderManager.stop()
    this.setData({ isRecording: false })
  },

  onConfirmVoice() {
    if (this.data.voiceText) {
      this.setData({
        inputText: this.data.voiceText,
        showVoiceModal: false,
        voiceText: ''
      })
      wx.showToast({ title: '已填入输入框', icon: 'success' })
    }
  },

  onRetryVoice() {
    this.setData({ voiceText: '' })
    this.onStartRecord()
  },

  closeVoiceModal() {
    this.setData({ 
      showVoiceModal: false, 
      voiceText: '',
      isRecording: false 
    })
  },

  // ========== 上传语音文件到后端 ==========
  uploadVoice(tempFilePath) {
    this.setData({ uploadStage: '上传语音中...', uploadProgress: 5 })
    const uploadTask = wx.uploadFile({
      url: config.voiceApiUrl,
      filePath: tempFilePath,
      name: 'file',
      success: (res) => {
        this.setData({ uploadProgress: 100, uploadStage: '识别完成' })
        setTimeout(() => {
          this.setData({ uploadProgress: 0, uploadStage: '' })
        }, 300)
        let recognizedText = ''
        try {
          const data = JSON.parse(res.data)
          recognizedText = data.text || data.result || res.data
        } catch (e) {
          recognizedText = res.data
        }

        if (recognizedText && recognizedText !== '语音识别失败') {
          this.setData({ voiceText: recognizedText })
          wx.showToast({ title: '识别成功', icon: 'success' })
        } else {
          wx.showToast({ title: '识别失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        this.setData({ uploadProgress: 0, uploadStage: '' })
        console.error('上传失败:', err)
        const errMsg = err.errMsg || ''
        // 断网 → 存入本地缓存（语音转 base64 避免临时路径过期）
        if (errMsg.indexOf('request:fail') !== -1 ||
            errMsg.indexOf('ECONNREFUSED') !== -1 || 
            errMsg.indexOf('timeout') !== -1 ||
            errMsg.indexOf('ENETUNREACH') !== -1 ||
            errMsg.indexOf('net::ERR_NETWORK') !== -1) {
          try {
            const fs = wx.getFileSystemManager()
            const voiceBase64 = fs.readFileSync(tempFilePath, 'base64')
            this.saveTaskToCache({ voiceBase64, type: 'voice', id: Date.now() })
            // 有网说明是后端问题，启动定时探测等后端恢复
            wx.getNetworkType({
              success: (netRes) => {
                if (netRes.networkType !== 'none') {
                  this.startBackendPolling()
                }
              }
            })
          } catch (e) {
            wx.showToast({ title: '网络错误', icon: 'none' })
          }
          return
        }
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })

    // 语音上传进度回调
    uploadTask.onProgressUpdate((res) => {
      this.setData({ 
        uploadProgress: res.progress,
        uploadStage: res.progress < 100 ? '上传语音中...' : '语音识别中...'
      })
    })
  },

  // ========== 热门分类点击 ======
  onHotCategoryTap(e) {
    const key = e.currentTarget.dataset.key
    // 切换到指南页并传递锚点参数
    wx.switchTab({ 
      url: '/pages/guide/guide',
      success: () => {
        // 通过全局变量传递锚点信息
        app.globalData.guideAnchor = key
      }
    })
  },

  // 输入框内容变化
  onInputText(e) {
    this.setData({ inputText: e.detail.value })
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
    this.setData({ 
      classifying: true, 
      uploadProgress: 0, 
      uploadStage: '准备中...',
      isOfflineMode: false 
    })
    try {
      const text = this.data.inputText.trim()
      const imageList = this.data.imageList

      // 先压缩图片再编码（确保缓存中的数据是 base64 而非临时路径）
      this.compressAndEncodeImages(imageList, async (base64Images) => {
        if (!base64Images && imageList.length > 0) {
          this.setData({ classifying: false, uploadProgress: 0, uploadStage: '' })
          wx.showToast({ title: '图片处理失败，请重试', icon: 'none' })
          return
        }

        // 直接发送请求，网络错误由 fail 回调统一处理
        this.sendClassifyRequestWithProgress(text, base64Images || [])
      })
    } catch (err) {
      console.error('分类流程异常:', err)
      this.setData({ classifying: false, uploadProgress: 0, uploadStage: '' })
      wx.showToast({ title: '分类失败，请重试', icon: 'none' })
    }
  },

  // 压缩图片后转为 Base64（替代原 imagesToBase64）
  compressAndEncodeImages(filePaths, callback) {
    if (!filePaths || filePaths.length === 0) {
      callback([])
      return
    }

    this.setData({ uploadStage: '压缩图片中...', uploadProgress: 5 })

    const tasks = filePaths.map((filePath) => {
      return new Promise((resolve, reject) => {
        // 先压缩图片
        wx.compressImage({
          src: filePath,
          quality: 60,
          success: (compressRes) => {
            // 压缩后再转 Base64
            const fs = wx.getFileSystemManager()
            fs.readFile({
              filePath: compressRes.tempFilePath,
              encoding: 'base64',
              success: (readRes) => resolve(readRes.data),
              fail: (err) => reject(err)
            })
          },
          fail: () => {
            // 压缩失败，降级为原图转 Base64
            console.warn('图片压缩失败，使用原图')
            const fs = wx.getFileSystemManager()
            fs.readFile({
              filePath: filePath,
              encoding: 'base64',
              success: (readRes) => resolve(readRes.data),
              fail: (readErr) => reject(readErr)
            })
          }
        })
      })
    })

    Promise.all(tasks)
      .then((base64List) => {
        this.setData({ uploadStage: '图片处理完成', uploadProgress: 20 })
        callback(base64List)
      })
      .catch(() => {
        this.setData({ classifying: false, uploadProgress: 0, uploadStage: '' })
        wx.showToast({ title: '图片读取失败', icon: 'none' })
      })
  },

  // 带进度的分类请求（替代原 sendClassifyRequest）
  sendClassifyRequestWithProgress(text, images) {
    const requestData = { text, images }

    wx.request({
      url: config.classifyApiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: requestData,
      success: (res) => {
        clearInterval(this._progressInterval)
        this.setData({ uploadProgress: 100, uploadStage: '分类完成' })
        setTimeout(() => {
          this.setData({ classifying: false, uploadProgress: 0, uploadStage: '' })
        }, 300)
        if (res.statusCode === 200 && res.data) {
          this.handleClassifyResult(res.data)
        } else {
          wx.showToast({ title: '分类失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        clearInterval(this._progressInterval)
        this.setData({ uploadProgress: 0, uploadStage: '' })
        const errMsg = err.errMsg || ''

        // 判断是否是网络/连接问题 → 存入缓存
        if (errMsg.indexOf('request:fail') !== -1 ||
            errMsg.indexOf('ECONNREFUSED') !== -1 || 
            errMsg.indexOf('timeout') !== -1 ||
            errMsg.indexOf('ENETUNREACH') !== -1 ||
            errMsg.indexOf('net::ERR_NETWORK') !== -1 ||
            errMsg.indexOf('fail to connect') !== -1) {
          this.saveTaskToCache({ text, images, type: 'classify-api' })
          // 有网说明是后端问题，启动定时探测等后端恢复；没网则等 onNetworkStatusChange 触发
          wx.getNetworkType({
            success: (netRes) => {
              if (netRes.networkType !== 'none') {
                this.startBackendPolling()
              }
            }
          })
          return
        }

        // 其他错误 → 显示提示
        this.setData({ classifying: false })
        let tipMsg = '网络请求失败'
        if (errMsg.indexOf('timeout') !== -1) {
          tipMsg = '请求超时，请检查网络后重试'
        } else if (errMsg.indexOf('ECONNREFUSED') !== -1) {
          tipMsg = '无法连接服务器，请稍后重试'
        } else if (errMsg.indexOf('ECONNRESET') !== -1) {
          tipMsg = '连接被重置，请检查网络稳定性'
        } else if (errMsg.indexOf('ENETUNREACH') !== -1 || errMsg.indexOf('net::ERR_NETWORK') !== -1) {
          tipMsg = '网络不可用，请检查网络设置'
        } else if (errMsg.indexOf('ENOTFOUND') !== -1) {
          tipMsg = 'DNS解析失败，请检查网络连接'
        } else if (errMsg.indexOf('SSL') !== -1 || errMsg.indexOf('certificate') !== -1) {
          tipMsg = '安全连接失败，请检查系统时间'
        } else if (errMsg.indexOf('request:fail') !== -1) {
          tipMsg = '请求发送失败，请检查网络'
        }
        wx.showToast({ title: tipMsg, icon: 'none', duration: 2500 })
      }
    })

    // 模拟进度动画（wx.request 不支持 onProgressUpdate）
    this.simulateProgress()
  },

  // ========== 获取网络状态（Promise 封装）==========
  getNetworkType() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          resolve(res.networkType !== 'none' ? res.networkType : null)
        },
        fail: () => resolve(null)
      })
    })
  },

  // ========== 探测后端是否可达（轻量 HEAD 请求）==========
  probeBackend() {
    return new Promise((resolve) => {
      // 先查网络，没网直接返回不可达，不发请求
      wx.getNetworkType({
        success: (netRes) => {
          if (netRes.networkType === 'none') {
            resolve(false)
            return
          }
          // 网络在，发 HEAD 请求探测后端
          wx.request({
            url: config.classifyApiUrl,
            method: 'HEAD',
            timeout: 5000,
            success: (res) => {
              // 有响应（哪怕是404/405）都说明后端启动了
              resolve(res.statusCode > 0)
            },
            fail: () => resolve(false)
          })
        },
        fail: () => resolve(false)
      })
    })
  },

  // ========== 停止后端轮询 ==========
  stopBackendPolling() {
    if (this._retryTimer) {
      clearTimeout(this._retryTimer)
      this._retryTimer = null
    }
  },

  // ========== 启动后端可达性轮询（网络前置检查 + 指数退避）==========
  startBackendPolling() {
    // 防止重复启动
    if (this._retryTimer) return

    let retryDelay = 2000   // 初始15秒
    let retryRound = 0       // 轮询轮次
    const MAX_ROUNDS = 6     // 最多6轮（15s+30s+60s+60s+60s+60s ≈ 5分钟）

    const doProbe = () => {
      const pending = wx.getStorageSync('pendingTasks') || []
      if (pending.length === 0) {
        // 没有缓存任务了，停止轮询
        this.stopBackendPolling()
        this.setData({ isOfflineMode: false })
        return
      }

      // 先检查网络，没网就停止轮询，等 onNetworkStatusChange 触发
      wx.getNetworkType({
        success: (netRes) => {
          if (netRes.networkType === 'none') {
            this.stopBackendPolling()
            return
          }

          // 网络在，探测后端
          this.probeBackend().then(reachable => {
            if (reachable) {
              console.log('后端已恢复，开始重传缓存任务')
              this.stopBackendPolling()
              this.retryPendingTasks()
            } else {
              // 后端仍不可达，继续轮询（退避策略）
              retryRound++
              if (retryRound >= MAX_ROUNDS) {
                console.log('后端轮询已达上限，停止轮询')
                this.stopBackendPolling()
                return
              }
              retryDelay = Math.min(retryDelay * 2, 60000)  // 退避，最长60秒
              this._retryTimer = setTimeout(doProbe, retryDelay)
            }
          })
        },
        fail: () => {
          this.stopBackendPolling()
        }
      })
    }

    // 首次延迟探测
    this._retryTimer = setTimeout(doProbe, retryDelay)
  },

  // ========== 模拟进度动画 ==========
  simulateProgress() {
    let progress = 20
    this._progressInterval = setInterval(() => {
      if (progress < 85) {
        progress += Math.random() * 8
        if (progress > 85) progress = 85
        this.setData({ 
          uploadProgress: Math.round(progress),
          uploadStage: 'AI智能识别中...' 
        })
      } else {
        clearInterval(this._progressInterval)
      }
    }, 500)
  },

  // ========== 断网时存任务到本地缓存 ==========
  saveTaskToCache(task) {
    try {
      const pending = wx.getStorageSync('pendingTasks') || []
      task.id = Date.now()
      task.createdAt = new Date().toISOString()
      task.retryCount = 0
      pending.push(task)
      wx.setStorageSync('pendingTasks', pending)
      this.setData({ classifying: false, uploadProgress: 0, uploadStage: '', isOfflineMode: true, pendingTasks: pending })

      wx.showModal({
        title: '网络不可用',
        content: '当前无网络连接，任务已保存到本地。网络恢复后将自动上传。',
        showCancel: false,
        confirmText: '知道了'
      })
    } catch (e) {
      console.error('保存待上传任务失败:', e)
      this.setData({ classifying: false, uploadProgress: 0, uploadStage: '' })
    }
  },

  // ========== 网络恢复时自动重试缓存任务 ==========
  retryPendingTasks() {
    let pending = []
    try {
      pending = wx.getStorageSync('pendingTasks') || []
    } catch (e) { return }

    if (pending.length === 0) return

    // 先探测后端是否可达，不通就不浪费请求，改为轮询等恢复
    this.probeBackend().then(reachable => {
      if (!reachable) {
        this.startBackendPolling()
        return
      }
      this.doRetry(pending)
    })
  },

  // ========== 实际执行重传（从 retryPendingTasks 拆出）==========
  doRetry(pending) {
    wx.showToast({ title: `正在重传${pending.length}个任务...`, icon: 'none' })

    const retryPromises = pending.map((task) => {
      if (task.retryCount >= 3) return Promise.resolve(false)

      task.retryCount++

      if (task.type === 'classify-api') {
        return new Promise((resolve) => {
          wx.request({
            url: config.classifyApiUrl,
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            data: { text: task.text, images: task.images || [] },
            success: (res) => {
              if (res.statusCode === 200 && res.data) {
                this.handleClassifyResult(res.data)
              }
              resolve(true)
            },
            fail: () => resolve(false)
          })
        })
      } else if (task.type === 'voice') {
        // 从 base64 还原为临时文件再上传
        return new Promise((resolve) => {
          try {
            const fs = wx.getFileSystemManager()
            const tempPath = `${wx.env.USER_DATA_PATH}/retry_voice_${task.id}.wav`
            fs.writeFileSync(tempPath, task.voiceBase64, 'base64')
            wx.uploadFile({
              url: config.voiceApiUrl,
              filePath: tempPath,
              name: 'file',
              success: (res) => {
                try {
                  const data = JSON.parse(res.data)
                  const recognizedText = data.text || data.result || ''
                  if (recognizedText && recognizedText !== '语音识别失败') {
                    this.setData({ voiceText: recognizedText })
                  }
                } catch (e) {}
                resolve(true)
              },
              fail: () => resolve(false)
            })
          } catch (e) {
            resolve(false)
          }
        })
      }
      return Promise.resolve(true)
    })

    Promise.all(retryPromises).then((results) => {
      const remaining = pending.filter((_, i) => !results[i])
      try {
        wx.setStorageSync('pendingTasks', remaining)
        this.setData({ isOfflineMode: remaining.length > 0, pendingTasks: remaining })
      } catch (e) {}
      
      // 全部重传成功，停止轮询
      if (remaining.length === 0) {
        this.stopBackendPolling()
      }

      const successCount = results.filter(r => r).length
      if (successCount > 0) {
        wx.showToast({ title: `${successCount}个任务重传成功`, icon: 'success' })
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
      success: () => {
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
