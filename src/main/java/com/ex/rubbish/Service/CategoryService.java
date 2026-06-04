package com.ex.rubbish.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CategoryService {

    /**
     * 处理图片，返回数字（模拟）
     * 实际超时逻辑可在调用层或配置层处理
     */
    public int processImage(MultipartFile image) {
        // TODO: 后续实现业务逻辑
        return 100; // 模拟返回整型数字
    }

    /**
     * 处理文字，返回数字（模拟）
     */
    public int processText(String text) {
        // TODO: 后续实现业务逻辑
        return 200; // 模拟返回整型数字
    }

    /**
     * 处理语音，返回数字（模拟）
     */
    public int processVoice(MultipartFile voice) {
        // TODO: 后续实现业务逻辑
        return 300; // 模拟返回整型数字
    }
}