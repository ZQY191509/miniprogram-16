// pages/guide/guide.js
Page({
  data: {
    activeIndex: -1,
    categories: [
      {
        id: 1,
        name: '可回收物',
        icon: '♻️',
        color: '#1677ff',
        desc: '适宜回收和资源化利用的废弃物',
        rules: [
          { item: '废纸', note: '报纸、书本、纸箱、包装纸等，需保持干燥清洁' },
          { item: '塑料瓶', note: '矿泉水瓶、饮料瓶、洗发水瓶等，倒空洗净压扁' },
          { item: '玻璃', note: '玻璃瓶、玻璃杯、窗玻璃等，去盖洗净' },
          { item: '金属', note: '易拉罐、金属餐具、铁钉、废铁丝等' },
          { item: '旧衣物', note: '干净的旧衣服、床单、书包等织物类' },
          { item: '电子产品', note: '手机、电脑、平板等小型电子废弃物' }
        ]
      },
      {
        id: 2,
        name: '有害垃圾',
        icon: '☣️',
        color: '#f53f3f',
        desc: '对人体健康或自然环境造成直接或潜在危害的废弃物',
        rules: [
          { item: '废电池', note: '充电电池、纽扣电池、铅酸蓄电池等，不含普通干电池' },
          { item: '过期药品', note: '过期或变质的药品及包装，需密封后投放' },
          { item: '废灯管', note: '荧光灯管、节能灯、汞温度计等含汞物品' },
          { item: '废油漆', note: '油漆桶、废涂料、废杀虫剂罐等有机溶剂类' },
          { item: '废胶片', note: 'X光片、相纸、废胶卷等感光材料' },
          { item: '废化妆品', note: '指甲油、染发剂、过期化妆品等个人护理品' }
        ]
      },
      {
        id: 3,
        name: '厨余垃圾',
        icon: '🍃',
        color: '#52c41a',
        desc: '易腐烂的、含有有机质的生活垃圾',
        rules: [
          { item: '剩饭剩菜', note: '米饭、面条、菜肴等餐后剩余食物' },
          { item: '果皮果核', note: '水果皮、果核、瓜子壳、花生壳等' },
          { item: '蔬菜残余', note: '菜叶、菜根、烂叶等摘除的蔬菜废弃部分' },
          { item: '茶叶渣', note: '泡过的茶叶、中药渣等植物残渣' },
          { item: '过期食品', note: '过期的面包、牛奶、零食等一般食品' },
          { item: '花卉绿植', note: '家养盆栽、枯枝落叶、花卉等植物性废弃物' }
        ]
      },
      {
        id: 4,
        name: '其他垃圾',
        icon: '🗑️',
        color: '#8c8c8c',
        desc: '除可回收物、有害垃圾、厨余垃圾以外的其他生活废弃物',
        rules: [
          { item: '纸巾湿巾', note: '用过的餐巾纸、湿纸巾、卫生纸等受污染的纸类' },
          { item: '一次性餐具', note: '一次性筷子、餐盒、塑料杯等受污染物品' },
          { item: '陶瓷碎片', note: '破碎的碗碟、花盆、瓷砖等难以回收的碎片' },
          { item: '烟蒂烟灰', note: '烟头、烟灰、香灰等燃烧残余物' },
          { item: '毛发灰尘', note: '头发、动物毛发、灰尘等细小难以回收物' },
          { item: '大骨头', note: '猪骨、牛骨等质地坚硬不易腐烂的大型骨头' }
        ]
      }
    ]
  },
  toggleCard(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      activeIndex: this.data.activeIndex === index ? -1 : index
    })
  }
})
