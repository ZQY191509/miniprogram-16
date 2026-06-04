package com.ex.rubbish.Service;
// WasteRecognitionService.java

import com.ex.rubbish.Entity.Re.WasteItem;
import com.ex.rubbish.Entity.Re.WasteRecognitionRequest;
import com.ex.rubbish.Entity.Re.WasteRecognitionResponse;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service
public class WasteRecognitionService {

    /**
     * 垃圾识别服务
     * 当前为硬编码测试数据，后续替换为实际识别逻辑
     */
    public WasteRecognitionResponse recognizeWaste(WasteRecognitionRequest request) {

        // TODO: 后续实现真实的识别逻辑
        // 1. 处理 request.getText() 中的文字
        // 2. 处理 request.getImages() 中的图片文件
        // 3. 调用识别算法返回实际结果

        // 硬编码测试数据 - 测试接口连通性
        List<WasteItem> testItems = Arrays.asList(
                new WasteItem("塑料瓶", 0),
                new WasteItem("苹果核", 1),
                new WasteItem("废电池", 2),
                new WasteItem("纸巾", 3)
        );

        return new WasteRecognitionResponse(testItems);
    }
}