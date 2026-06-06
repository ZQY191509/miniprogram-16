package com.ex.rubbish.Service;


import org.springframework.stereotype.Service;
import javax.servlet.http.HttpSession;
import java.awt.image.BufferedImage;
import java.awt.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class AnalysisService {

    /**
     * 生成图片（模拟）
     */
    public byte[] generateAnalysisImage() {
        // TODO: 后续实现业务逻辑
        // 这里返回一个简单的1x1像素的红色图片作为占位
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, Color.RED.getRGB());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "jpg", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            return new byte[0];
        }
    }

    /**
     * 获取session数据（模拟）
     */
    public Object getSessionData(HttpSession session) {
        // TODO: 后续实现业务逻辑
        String sessionKey = "temp_data";
        Object data = session.getAttribute(sessionKey);

        if (data == null) {
            // 模拟session数据
            data = "Session temporary data: " + System.currentTimeMillis();
            session.setAttribute(sessionKey, data);
        }

        return data;
    }
}