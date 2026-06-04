package com.ex.rubbish.Controller;

import com.ex.rubbish.Entity.Re.WasteRecognitionRequest;
import com.ex.rubbish.Entity.Re.WasteRecognitionResponse;
import com.ex.rubbish.Service.WasteRecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/waste")
public class WasteRecognitionController {

    @Autowired
    private WasteRecognitionService wasteRecognitionService;

    /**
     * 垃圾识别接口
     * 接收文字和图片，返回识别出的物品列表及分类
     */
    @PostMapping("/recognize")
    public ResponseEntity<WasteRecognitionResponse> recognizeWaste(@RequestBody WasteRecognitionRequest request) {
        WasteRecognitionResponse response = wasteRecognitionService.recognizeWaste(request);
        return ResponseEntity.ok(response);
    }
}
