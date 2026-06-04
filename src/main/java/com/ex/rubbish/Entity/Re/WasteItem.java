package com.ex.rubbish.Entity.Re;

//输出实体 "items": [
//    { "content": "塑料瓶", "category": 0 },
//    { "content": "苹果核", "category": 1 },
//    { "content": "废电池", "category": 2 },
//    { "content": "纸巾", "category": 3 }
//  ]
//}
// WasteItem.java - 单个物品识别结果

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WasteItem {
    private String content;   // 物品名称
    private Integer category; // 分类：0-可回收物，1-厨余垃圾，2-有害垃圾，3-其他垃圾
}