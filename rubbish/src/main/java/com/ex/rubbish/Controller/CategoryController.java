package com.ex.rubbish.Controller;

import com.ex.rubbish.Entity.Re.CategoryResponse;
import com.ex.rubbish.Entity.Re.TextRequest;
import com.ex.rubbish.Service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/category")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * 1. 接收图片内容，返回整形数字，超时返回-1
     */
    @PostMapping("/image")
    public ResponseEntity<CategoryResponse> processImage(@RequestParam("image") MultipartFile image) {
        int result = categoryService.processImage(image);
        return ResponseEntity.ok(new CategoryResponse(result));
    }

    /**
     * 2. 接收文字内容，返回整形数字
     */
    @PostMapping("/text")
    public ResponseEntity<CategoryResponse> processText(@RequestBody TextRequest textRequest) {
        int result = categoryService.processText(textRequest.getContent());
        return ResponseEntity.ok(new CategoryResponse(result));
    }

    /**
     * 3. 接收语音内容，返回整形数字
     */
    @PostMapping("/voice")
    public ResponseEntity<CategoryResponse> processVoice(@RequestParam("voice") MultipartFile voice) {
        int result = categoryService.processVoice(voice);
        return ResponseEntity.ok(new CategoryResponse(result));
    }
}