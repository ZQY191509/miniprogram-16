package com.ex.rubbish.Service;

import com.ex.rubbish.Entity.Re.WasteItem;
import com.ex.rubbish.Entity.Re.WasteRecognitionRequest;
import com.ex.rubbish.Entity.Re.WasteRecognitionResponse;
import com.ex.rubbish.Entity.UserCategory;
import com.ex.rubbish.Repository.UserCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Base64;


/**
 * 垃圾识别服务（百度AI版）
 */
@Service
public class WasteRecognitionService {

    private final BaiduAIService baiduAIService;
    
    @Autowired
    private UserCategoryRepository userCategoryRepository;

    // 构造器注入（Spring推荐的方式）
    public WasteRecognitionService(BaiduAIService baiduAIService) {
        this.baiduAIService = baiduAIService;
    }

    // 垃圾分类映射表
    private static final Map<String, Integer> CATEGORY_MAP = new HashMap<>();

    static {
        // ===========================================
        // 0 - 可回收物（蓝色桶）
        // 原则：具体名称放前面，模糊单字放最后
        // ===========================================

        // ---- 塑料类（具体名称优先）----
        CATEGORY_MAP.put("矿泉水瓶", 0);
        CATEGORY_MAP.put("饮料瓶", 0);
        CATEGORY_MAP.put("塑料瓶", 0);
        CATEGORY_MAP.put("奶瓶", 0);
        CATEGORY_MAP.put("洗发水瓶", 0);
        CATEGORY_MAP.put("沐浴露瓶", 0);
        CATEGORY_MAP.put("洗洁精瓶", 0);
        CATEGORY_MAP.put("化妆品瓶", 0);
        CATEGORY_MAP.put("油桶", 0);
        CATEGORY_MAP.put("塑料盒", 0);
        CATEGORY_MAP.put("塑料杯", 0);
        CATEGORY_MAP.put("塑料碗", 0);
        CATEGORY_MAP.put("塑料盆", 0);
        CATEGORY_MAP.put("塑料桶", 0);
        CATEGORY_MAP.put("塑料玩具", 0);
        CATEGORY_MAP.put("塑料衣架", 0);
        CATEGORY_MAP.put("泡沫塑料", 0);
        CATEGORY_MAP.put("泡沫盒", 0);
        CATEGORY_MAP.put("保丽龙", 0);
        CATEGORY_MAP.put("吸管", 0);
        CATEGORY_MAP.put("塑料管", 0);
        CATEGORY_MAP.put("塑料袋", 0);
        CATEGORY_MAP.put("塑料膜", 0);
        CATEGORY_MAP.put("塑料盖", 0);
        // 模糊词放本类最后
        CATEGORY_MAP.put("塑料", 0);

        // ---- 纸张类（具体名称优先）----
        CATEGORY_MAP.put("纸箱", 0);
        CATEGORY_MAP.put("纸板", 0);
        CATEGORY_MAP.put("纸盒", 0);
        CATEGORY_MAP.put("纸袋", 0);
        CATEGORY_MAP.put("纸杯", 0);
        CATEGORY_MAP.put("报纸", 0);
        CATEGORY_MAP.put("杂志", 0);
        CATEGORY_MAP.put("书本", 0);
        CATEGORY_MAP.put("书籍", 0);
        CATEGORY_MAP.put("笔记本", 0);
        CATEGORY_MAP.put("打印纸", 0);
        CATEGORY_MAP.put("复印纸", 0);
        CATEGORY_MAP.put("包装纸", 0);
        CATEGORY_MAP.put("信封", 0);
        CATEGORY_MAP.put("明信片", 0);
        CATEGORY_MAP.put("快递盒", 0);
        CATEGORY_MAP.put("牛奶盒", 0);
        CATEGORY_MAP.put("利乐包", 0);
        CATEGORY_MAP.put("纸壳", 0);
        CATEGORY_MAP.put("硬纸板", 0);
        CATEGORY_MAP.put("废纸板", 0);
        // 模糊词放本类最后
        CATEGORY_MAP.put("纸", 0);

        // ---- 金属类（具体名称优先）----
        CATEGORY_MAP.put("易拉罐", 0);
        CATEGORY_MAP.put("铝罐", 0);
        CATEGORY_MAP.put("金属罐", 0);
        CATEGORY_MAP.put("铁皮罐", 0);
        CATEGORY_MAP.put("罐头盒", 0);
        CATEGORY_MAP.put("铁丝", 0);
        CATEGORY_MAP.put("铁钉", 0);
        CATEGORY_MAP.put("金属盒", 0);
        CATEGORY_MAP.put("金属瓶盖", 0);
        CATEGORY_MAP.put("金属餐具", 0);
        CATEGORY_MAP.put("不锈钢", 0);
        CATEGORY_MAP.put("铝合金", 0);
        CATEGORY_MAP.put("金属玩具", 0);
        CATEGORY_MAP.put("金属衣架", 0);
        CATEGORY_MAP.put("钥匙", 0);
        CATEGORY_MAP.put("锁", 0);
        CATEGORY_MAP.put("铁锅", 0);
        CATEGORY_MAP.put("铁铲", 0);
        // 模糊词放本类最后
        CATEGORY_MAP.put("金属", 0);
        CATEGORY_MAP.put("铁", 0);
        CATEGORY_MAP.put("铝", 0);
        CATEGORY_MAP.put("铜", 0);

        // ---- 玻璃类（具体名称优先）----
        CATEGORY_MAP.put("玻璃瓶", 0);
        CATEGORY_MAP.put("玻璃杯", 0);
        CATEGORY_MAP.put("玻璃碗", 0);
        CATEGORY_MAP.put("玻璃罐", 0);
        CATEGORY_MAP.put("酒瓶", 0);
        CATEGORY_MAP.put("酱油瓶", 0);
        CATEGORY_MAP.put("醋瓶", 0);
        CATEGORY_MAP.put("香水瓶", 0);
        CATEGORY_MAP.put("玻璃窗", 0);
        CATEGORY_MAP.put("镜子", 0);
        CATEGORY_MAP.put("花瓶", 0);
        // 模糊词放本类最后
        CATEGORY_MAP.put("玻璃", 0);

        // ---- 布料/衣物类（具体名称优先）----
        CATEGORY_MAP.put("衣服", 0);
        CATEGORY_MAP.put("衣物", 0);
        CATEGORY_MAP.put("废旧衣物", 0);
        CATEGORY_MAP.put("废布料", 0);
        CATEGORY_MAP.put("棉被", 0);
        CATEGORY_MAP.put("被子", 0);
        CATEGORY_MAP.put("床单", 0);
        CATEGORY_MAP.put("被套", 0);
        CATEGORY_MAP.put("枕套", 0);
        CATEGORY_MAP.put("毛巾", 0);
        CATEGORY_MAP.put("毛毯", 0);
        CATEGORY_MAP.put("窗帘", 0);
        CATEGORY_MAP.put("鞋子", 0);
        CATEGORY_MAP.put("鞋", 0);
        CATEGORY_MAP.put("包", 0);
        CATEGORY_MAP.put("书包", 0);
        CATEGORY_MAP.put("皮包", 0);
        CATEGORY_MAP.put("皮带", 0);
        CATEGORY_MAP.put("袜子", 0);
        CATEGORY_MAP.put("帽子", 0);
        CATEGORY_MAP.put("围巾", 0);
        CATEGORY_MAP.put("布料", 0);

        // ---- 电子废弃物（可回收部分）----
        CATEGORY_MAP.put("电线", 0);
        CATEGORY_MAP.put("充电线", 0);
        CATEGORY_MAP.put("数据线", 0);
        CATEGORY_MAP.put("插头", 0);
        CATEGORY_MAP.put("插座", 0);
        CATEGORY_MAP.put("排插", 0);
        CATEGORY_MAP.put("电风扇", 0);
        CATEGORY_MAP.put("电饭煲", 0);
        CATEGORY_MAP.put("微波炉", 0);
        CATEGORY_MAP.put("电磁炉", 0);
        CATEGORY_MAP.put("电水壶", 0);
        CATEGORY_MAP.put("豆浆机", 0);
        CATEGORY_MAP.put("榨汁机", 0);
        CATEGORY_MAP.put("吹风机", 0);
        CATEGORY_MAP.put("熨斗", 0);
        CATEGORY_MAP.put("电吹风", 0);
        CATEGORY_MAP.put("电烫斗", 0);


        // ===========================================
        // 1 - 厨余垃圾 / 湿垃圾（绿色桶）
        // 注意：避免"苹果手机"被误判，把"苹果"等词放在后面
        // ===========================================

        // ---- 水果类 ----
        CATEGORY_MAP.put("苹果核", 1);
        CATEGORY_MAP.put("香蕉皮", 1);
        CATEGORY_MAP.put("橘子皮", 1);
        CATEGORY_MAP.put("橙子皮", 1);
        CATEGORY_MAP.put("柚子皮", 1);
        CATEGORY_MAP.put("西瓜皮", 1);
        CATEGORY_MAP.put("哈密瓜皮", 1);
        CATEGORY_MAP.put("葡萄皮", 1);
        CATEGORY_MAP.put("草莓蒂", 1);
        CATEGORY_MAP.put("芒果核", 1);
        CATEGORY_MAP.put("猕猴桃皮", 1);
        CATEGORY_MAP.put("火龙果皮", 1);
        CATEGORY_MAP.put("榴莲壳", 1);
        CATEGORY_MAP.put("菠萝皮", 1);
        CATEGORY_MAP.put("荔枝壳", 1);
        CATEGORY_MAP.put("龙眼壳", 1);
        CATEGORY_MAP.put("樱桃核", 1);
        CATEGORY_MAP.put("桃子核", 1);
        CATEGORY_MAP.put("枣核", 1);
        CATEGORY_MAP.put("柿子皮", 1);
        CATEGORY_MAP.put("石榴皮", 1);
        CATEGORY_MAP.put("柠檬皮", 1);
        CATEGORY_MAP.put("蓝莓蒂", 1);
        CATEGORY_MAP.put("山竹皮", 1);
        CATEGORY_MAP.put("甘蔗渣", 1);
        CATEGORY_MAP.put("椰子壳", 1);
        CATEGORY_MAP.put("果核", 1);
        CATEGORY_MAP.put("果壳", 1);
        CATEGORY_MAP.put("果皮", 1);
        CATEGORY_MAP.put("瓜皮", 1);
        // 水果名称（放后面，减少误判）
        CATEGORY_MAP.put("苹果", 1);
        CATEGORY_MAP.put("梨", 1);
        CATEGORY_MAP.put("香蕉", 1);
        CATEGORY_MAP.put("橘子", 1);
        CATEGORY_MAP.put("桔子", 1);
        CATEGORY_MAP.put("橙子", 1);
        CATEGORY_MAP.put("柚子", 1);
        CATEGORY_MAP.put("西瓜", 1);
        CATEGORY_MAP.put("哈密瓜", 1);
        CATEGORY_MAP.put("葡萄", 1);
        CATEGORY_MAP.put("草莓", 1);
        CATEGORY_MAP.put("芒果", 1);
        CATEGORY_MAP.put("猕猴桃", 1);
        CATEGORY_MAP.put("火龙果", 1);
        CATEGORY_MAP.put("榴莲", 1);
        CATEGORY_MAP.put("菠萝", 1);
        CATEGORY_MAP.put("荔枝", 1);
        CATEGORY_MAP.put("龙眼", 1);
        CATEGORY_MAP.put("樱桃", 1);
        CATEGORY_MAP.put("桃子", 1);
        CATEGORY_MAP.put("李子", 1);
        CATEGORY_MAP.put("枣", 1);
        CATEGORY_MAP.put("柿子", 1);
        CATEGORY_MAP.put("石榴", 1);
        CATEGORY_MAP.put("柠檬", 1);
        CATEGORY_MAP.put("蓝莓", 1);
        CATEGORY_MAP.put("山竹", 1);
        CATEGORY_MAP.put("杨梅", 1);
        CATEGORY_MAP.put("枇杷", 1);
        CATEGORY_MAP.put("无花果", 1);
        CATEGORY_MAP.put("百香果", 1);
        CATEGORY_MAP.put("圣女果", 1);
        CATEGORY_MAP.put("小番茄", 1);

        // ---- 蔬菜类 ----
        CATEGORY_MAP.put("菜叶", 1);
        CATEGORY_MAP.put("菜根", 1);
        CATEGORY_MAP.put("花生壳", 1);
        CATEGORY_MAP.put("瓜子壳", 1);
        CATEGORY_MAP.put("青菜", 1);
        CATEGORY_MAP.put("白菜", 1);
        CATEGORY_MAP.put("菠菜", 1);
        CATEGORY_MAP.put("生菜", 1);
        CATEGORY_MAP.put("芹菜", 1);
        CATEGORY_MAP.put("韭菜", 1);
        CATEGORY_MAP.put("香菜", 1);
        CATEGORY_MAP.put("葱", 1);
        CATEGORY_MAP.put("姜", 1);
        CATEGORY_MAP.put("蒜", 1);
        CATEGORY_MAP.put("辣椒", 1);
        CATEGORY_MAP.put("西红柿", 1);
        CATEGORY_MAP.put("番茄", 1);
        CATEGORY_MAP.put("黄瓜", 1);
        CATEGORY_MAP.put("茄子", 1);
        CATEGORY_MAP.put("土豆", 1);
        CATEGORY_MAP.put("马铃薯", 1);
        CATEGORY_MAP.put("萝卜", 1);
        CATEGORY_MAP.put("胡萝卜", 1);
        CATEGORY_MAP.put("莲藕", 1);
        CATEGORY_MAP.put("山药", 1);
        CATEGORY_MAP.put("豆芽", 1);
        CATEGORY_MAP.put("豆腐", 1);
        CATEGORY_MAP.put("豆角", 1);
        CATEGORY_MAP.put("四季豆", 1);
        CATEGORY_MAP.put("西兰花", 1);
        CATEGORY_MAP.put("花菜", 1);
        CATEGORY_MAP.put("包菜", 1);
        CATEGORY_MAP.put("卷心菜", 1);
        CATEGORY_MAP.put("洋葱", 1);
        CATEGORY_MAP.put("玉米", 1);
        CATEGORY_MAP.put("茭白", 1);
        CATEGORY_MAP.put("竹笋", 1);
        CATEGORY_MAP.put("芦笋", 1);
        CATEGORY_MAP.put("秋葵", 1);
        CATEGORY_MAP.put("南瓜", 1);
        CATEGORY_MAP.put("冬瓜", 1);
        CATEGORY_MAP.put("丝瓜", 1);
        CATEGORY_MAP.put("苦瓜", 1);
        CATEGORY_MAP.put("蘑菇", 1);
        CATEGORY_MAP.put("香菇", 1);
        CATEGORY_MAP.put("金针菇", 1);
        // 模糊词放最后
        CATEGORY_MAP.put("蔬", 1);
        CATEGORY_MAP.put("菜", 1);

        // ---- 肉类/水产类 ----
        CATEGORY_MAP.put("猪肉", 1);
        CATEGORY_MAP.put("牛肉", 1);
        CATEGORY_MAP.put("羊肉", 1);
        CATEGORY_MAP.put("鸡肉", 1);
        CATEGORY_MAP.put("鸭肉", 1);
        CATEGORY_MAP.put("鹅肉", 1);
        CATEGORY_MAP.put("鱼", 1);
        CATEGORY_MAP.put("虾", 1);
        CATEGORY_MAP.put("蟹", 1);
        CATEGORY_MAP.put("贝壳", 1);
        CATEGORY_MAP.put("骨头", 1);
        CATEGORY_MAP.put("鱼骨", 1);
        CATEGORY_MAP.put("鸡骨", 1);
        CATEGORY_MAP.put("排骨", 1);
        CATEGORY_MAP.put("内脏", 1);
        CATEGORY_MAP.put("鸡翅", 1);
        CATEGORY_MAP.put("鸡腿", 1);
        CATEGORY_MAP.put("猪蹄", 1);
        CATEGORY_MAP.put("鸭脖", 1);
        CATEGORY_MAP.put("蛋壳", 1);
        // 模糊词放最后
        CATEGORY_MAP.put("肉", 1);
        CATEGORY_MAP.put("蛋", 1);

        // ---- 主食/零食类 ----
        CATEGORY_MAP.put("米饭", 1);
        CATEGORY_MAP.put("面条", 1);
        CATEGORY_MAP.put("面包", 1);
        CATEGORY_MAP.put("馒头", 1);
        CATEGORY_MAP.put("蛋糕", 1);
        CATEGORY_MAP.put("饼干", 1);
        CATEGORY_MAP.put("巧克力", 1);
        CATEGORY_MAP.put("剩饭", 1);
        CATEGORY_MAP.put("剩菜", 1);
        CATEGORY_MAP.put("过期食品", 1);
        CATEGORY_MAP.put("茶叶渣", 1);
        CATEGORY_MAP.put("茶渣", 1);
        CATEGORY_MAP.put("咖啡渣", 1);
        CATEGORY_MAP.put("中药渣", 1);
        CATEGORY_MAP.put("月饼", 1);
        CATEGORY_MAP.put("粽子", 1);
        CATEGORY_MAP.put("汤圆", 1);
        CATEGORY_MAP.put("饺子", 1);
        CATEGORY_MAP.put("包子", 1);
        CATEGORY_MAP.put("烧饼", 1);
        CATEGORY_MAP.put("油条", 1);
        CATEGORY_MAP.put("年糕", 1);

        // ---- 其他厨余 ----
        CATEGORY_MAP.put("花瓣", 1);
        CATEGORY_MAP.put("盆栽落叶", 1);
        CATEGORY_MAP.put("枯枝", 1);
        CATEGORY_MAP.put("树叶", 1);
        CATEGORY_MAP.put("草本", 1);


        // ===========================================
        // 2 - 有害垃圾（红色桶）
        // ===========================================

        // ---- 电池类（具体优先）----
        CATEGORY_MAP.put("充电电池", 2);
        CATEGORY_MAP.put("蓄电池", 2);
        CATEGORY_MAP.put("锂电池", 2);
        CATEGORY_MAP.put("纽扣电池", 2);
        CATEGORY_MAP.put("干电池", 2);
        CATEGORY_MAP.put("手机电池", 2);
        CATEGORY_MAP.put("电动车电池", 2);
        CATEGORY_MAP.put("镍镉电池", 2);
        CATEGORY_MAP.put("铅酸电池", 2);
        // 模糊词放最后
        CATEGORY_MAP.put("电池", 2);

        // ---- 灯管类 ----
        CATEGORY_MAP.put("灯泡", 2);
        CATEGORY_MAP.put("荧光灯", 2);
        CATEGORY_MAP.put("节能灯", 2);
        CATEGORY_MAP.put("日光灯", 2);
        CATEGORY_MAP.put("卤素灯", 2);
        CATEGORY_MAP.put("灯管", 2);
        CATEGORY_MAP.put("LED灯", 2);
        // 模糊词放最后
        CATEGORY_MAP.put("灯", 2);

        // ---- 药品类 ----
        CATEGORY_MAP.put("过期药品", 2);
        CATEGORY_MAP.put("过期药", 2);
        CATEGORY_MAP.put("药瓶", 2);
        CATEGORY_MAP.put("药板", 2);
        CATEGORY_MAP.put("药片", 2);
        CATEGORY_MAP.put("胶囊", 2);
        CATEGORY_MAP.put("药膏", 2);
        CATEGORY_MAP.put("药水", 2);
        CATEGORY_MAP.put("注射器", 2);
        CATEGORY_MAP.put("针头", 2);
        // 模糊词放最后
        CATEGORY_MAP.put("药", 2);
        CATEGORY_MAP.put("药品", 2);

        // ---- 化学品类 ----
        CATEGORY_MAP.put("油漆桶", 2);
        CATEGORY_MAP.put("杀虫剂瓶", 2);
        CATEGORY_MAP.put("指甲油", 2);
        CATEGORY_MAP.put("洗甲水", 2);
        CATEGORY_MAP.put("染发剂", 2);
        CATEGORY_MAP.put("墨盒", 2);
        CATEGORY_MAP.put("硒鼓", 2);
        CATEGORY_MAP.put("油漆", 2);
        CATEGORY_MAP.put("涂料", 2);
        CATEGORY_MAP.put("杀虫剂", 2);
        CATEGORY_MAP.put("消毒液", 2);
        CATEGORY_MAP.put("漂白剂", 2);
        CATEGORY_MAP.put("清洁剂", 2);
        CATEGORY_MAP.put("香水", 2);
        CATEGORY_MAP.put("化妆品", 2);

        // ---- 电子产品（有害部分）----
        CATEGORY_MAP.put("手机", 2);
        CATEGORY_MAP.put("电脑", 2);
        CATEGORY_MAP.put("平板", 2);
        CATEGORY_MAP.put("充电宝", 2);
        CATEGORY_MAP.put("电路板", 2);
        CATEGORY_MAP.put("芯片", 2);


        // ===========================================
        // 3 - 其他垃圾 / 干垃圾（灰色桶）
        // ===========================================

        // ---- 卫生用品类 ----
        CATEGORY_MAP.put("餐巾纸", 3);
        CATEGORY_MAP.put("卫生纸", 3);
        CATEGORY_MAP.put("湿纸巾", 3);
        CATEGORY_MAP.put("纸尿裤", 3);
        CATEGORY_MAP.put("尿不湿", 3);
        CATEGORY_MAP.put("卫生巾", 3);
        CATEGORY_MAP.put("护垫", 3);
        CATEGORY_MAP.put("棉签", 3);
        CATEGORY_MAP.put("棉球", 3);
        CATEGORY_MAP.put("口罩", 3);
        CATEGORY_MAP.put("手套", 3);
        CATEGORY_MAP.put("避孕套", 3);
        CATEGORY_MAP.put("牙膏皮", 3);
        CATEGORY_MAP.put("牙刷", 3);
        CATEGORY_MAP.put("牙线", 3);
        CATEGORY_MAP.put("脏纸巾", 3);
        CATEGORY_MAP.put("用过的纸巾", 3);
        CATEGORY_MAP.put("脏塑料袋", 3);

        // ---- 陶瓷类 ----
        CATEGORY_MAP.put("陶瓷碗", 3);
        CATEGORY_MAP.put("陶瓷盘", 3);
        CATEGORY_MAP.put("陶瓷杯", 3);
        CATEGORY_MAP.put("陶瓷盆", 3);
        CATEGORY_MAP.put("瓦片", 3);
        CATEGORY_MAP.put("砖头", 3);
        CATEGORY_MAP.put("砖块", 3);
        // 模糊词放最后
        CATEGORY_MAP.put("陶瓷", 3);

        // ---- 土/石类 ----
        CATEGORY_MAP.put("沙子", 3);
        CATEGORY_MAP.put("石头", 3);
        CATEGORY_MAP.put("花盆", 3);
        CATEGORY_MAP.put("水泥", 3);
        CATEGORY_MAP.put("土", 3);

        // ---- 一次性用品 ----
        CATEGORY_MAP.put("一次性餐具", 3);
        CATEGORY_MAP.put("一次性筷子", 3);
        CATEGORY_MAP.put("一次性饭盒", 3);
        CATEGORY_MAP.put("一次性杯子", 3);
        CATEGORY_MAP.put("方便面盒", 3);
        CATEGORY_MAP.put("外卖盒", 3);
        CATEGORY_MAP.put("塑料袋", 3);

        // ---- 烟/宠物类 ----
        CATEGORY_MAP.put("烟头", 3);
        CATEGORY_MAP.put("烟灰", 3);
        CATEGORY_MAP.put("宠物粪便", 3);
        CATEGORY_MAP.put("猫砂", 3);
        CATEGORY_MAP.put("狗屎", 3);

        // ---- 其他 ----
        CATEGORY_MAP.put("打火机", 3);
        CATEGORY_MAP.put("火柴", 3);
        CATEGORY_MAP.put("橡皮泥", 3);
        CATEGORY_MAP.put("胶带", 3);
        CATEGORY_MAP.put("贴纸", 3);
        CATEGORY_MAP.put("照片", 3);
        CATEGORY_MAP.put("相纸", 3);
        CATEGORY_MAP.put("复写纸", 3);
        CATEGORY_MAP.put("口香糖", 3);
        CATEGORY_MAP.put("坚果壳", 3);
        CATEGORY_MAP.put("大骨头", 3);
        CATEGORY_MAP.put("玉米芯", 3);
        CATEGORY_MAP.put("粽子叶", 3);
        CATEGORY_MAP.put("竹笋壳", 3);
    }


    public WasteRecognitionResponse recognizeWaste(WasteRecognitionRequest request) {
        List<WasteItem> resultList = new ArrayList<>();

        // ========== 处理图片 ==========
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            for (String imageBase64 : request.getImages()) {
                // 调用百度AI识别图片
                String itemName = baiduAIService.recognizeImage(imageBase64);
                int category = mapToCategory(itemName);
                resultList.add(new WasteItem(itemName, category));
            }
        }

        // ========== 处理文字 ==========
        if (request.getText() != null && !request.getText().isEmpty()) {
            String[] items = request.getText().split("[\\s,，、]+");
            for (String item : items) {
                item = item.trim();
                if (!item.isEmpty()) {
                    int category = mapToCategory(item);
                    resultList.add(new WasteItem(item, category));
                }
            }
        }

        return new WasteRecognitionResponse(resultList);
    }



    /**
     * 将识别出的物品名称，映射为垃圾分类
     * 优先级：1. CATEGORY_MAP映射表  2. H2数据库  3. 返回-1（未找到）
     */
    private int mapToCategory(String itemName) {
        // 1. 先查本地映射表
        for (Map.Entry<String, Integer> entry : CATEGORY_MAP.entrySet()) {
            if (itemName.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        // 2. 再查H2数据库（用户反馈数据）
        try {
            UserCategory userCategory = userCategoryRepository.findByItemName(itemName);
            if (userCategory != null) {
                return userCategory.getCategory();
            }
        } catch (Exception e) {
            // 数据库查询失败，记录日志但不中断流程
            System.err.println("查询H2数据库失败: " + e.getMessage());
        }
        
        // 3. 都未找到，返回-1
        return -1;
    }
    
    /**
     * 保存用户反馈的分类到H2数据库
     */
    public void saveUserFeedback(String itemName, Integer category) {
        try {
            // 检查是否已存在
            if (!userCategoryRepository.existsByItemName(itemName)) {
                UserCategory userCategory = new UserCategory(itemName, category);
                userCategoryRepository.save(userCategory);
                System.out.println("用户反馈已保存到H2数据库: " + itemName + " -> " + category);
            }
        } catch (Exception e) {
            System.err.println("保存用户反馈失败: " + e.getMessage());
        }
    }
}
