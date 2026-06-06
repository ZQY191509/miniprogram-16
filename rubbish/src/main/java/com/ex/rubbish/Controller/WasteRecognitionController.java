package com.ex.rubbish.Controller;

import com.ex.rubbish.Entity.Re.WasteRecognitionRequest;
import com.ex.rubbish.Entity.Re.WasteRecognitionResponse;
import com.ex.rubbish.Service.BaiduAIService;
import com.ex.rubbish.Service.WasteRecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/waste")
public class WasteRecognitionController {

    @Autowired
    private WasteRecognitionService wasteRecognitionService;

    @Autowired
    private BaiduAIService baiduAIService;

    /**
     * 垃圾识别接口
     * 接收文字和图片，返回识别出的物品列表及分类
     */
    @PostMapping("/recognize")
    public ResponseEntity<WasteRecognitionResponse> recognizeWaste(@RequestBody WasteRecognitionRequest request) {
        WasteRecognitionResponse response = wasteRecognitionService.recognizeWaste(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 语音识别接口
     * 接收音频文件，返回识别出的文字
     */
    @PostMapping("/recognize-voice")
    public ResponseEntity<?> recognizeVoice(@RequestParam("file") MultipartFile file) {
        try {
            // 将音频文件转换为Base64
            byte[] audioBytes = file.getBytes();
            String audioBase64 = Base64.getEncoder().encodeToString(audioBytes);

            // 调用百度语音识别
            String recognizedText = baiduAIService.recognizeSpeech(audioBase64);

            if (recognizedText.isEmpty()) {
                return ResponseEntity.badRequest().body("语音识别失败");
            }

            // 返回识别的文字，前端可以用这个文字去调用垃圾分类接口
            return ResponseEntity.ok(recognizedText);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("服务器错误");
        }
    }

    /**
     * 保存用户反馈的垃圾分类
     * 当前端识别结果为-1时，用户手动选择分类后调用此接口
     */
    @PostMapping("/save-feedback")
    public ResponseEntity<?> saveFeedback(@RequestBody Map<String, Object> request) {
        try {
            String itemName = (String) request.get("itemName");
            Integer category = (Integer) request.get("category");
            
            if (itemName == null || category == null) {
                return ResponseEntity.badRequest().body("参数错误");
            }
            
            wasteRecognitionService.saveUserFeedback(itemName, category);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "反馈已保存");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("保存失败");
        }
    }

}
