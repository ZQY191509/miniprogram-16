package com.ex.rubbish.Controller;
// AnalysisController.java

import com.ex.rubbish.Entity.alays.SessionDataResponse;
import com.ex.rubbish.Service.AnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    /**
     * 1. 无接收内容，当被请求的时候返回一张图片
     */
    @GetMapping(value = "/image", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getAnalysisImage() {
        byte[] imageData = analysisService.generateAnalysisImage();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        headers.setContentLength(imageData.length);

        return new ResponseEntity<>(imageData, headers, HttpStatus.OK);
    }

    /**
     * 2. 返回session临时存储数据
     */
    @GetMapping("/session-data")
    public ResponseEntity<SessionDataResponse> getSessionData(HttpSession session) {
        Object sessionData = analysisService.getSessionData(session);
        return ResponseEntity.ok(new SessionDataResponse(sessionData));
    }
}