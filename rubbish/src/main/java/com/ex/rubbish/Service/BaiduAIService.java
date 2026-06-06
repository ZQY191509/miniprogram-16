package com.ex.rubbish.Service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;

/**
 * 百度AI接口调用服务
 * 作用：封装百度AI的所有接口调用
 */
@Service
public class BaiduAIService {

    // ========== 填写你自己的百度AI密钥 ==========
    // ========== 图像识别密钥（图片识别 + OCR）==========
    private static final String IMAGE_API_KEY = "wrRORjsP3cTTBtxyNWdRGOpk";
    private static final String IMAGE_SECRET_KEY = "zZAkHtcJTTm5Vx9AJSxkbk8g6Iu6XumI";

    // ============================================
// ========== 语音识别密钥 ==========
    @Value("${baidu.api.key}")
    private String SPEECH_API_KEY;

    @Value("${baidu.api.secret}")
    private String SPEECH_SECRET_KEY;

    // ========== Token缓存 ==========
    private String imageAccessToken = null;
    private String speechAccessToken = null;

    /**
     * 获取图像识别的Access Token
     */
    private String getImageAccessToken() throws IOException {
        if (imageAccessToken != null) {
            return imageAccessToken;
        }

        String url = "https://aip.baidubce.com/oauth/2.0/token"
                + "?grant_type=client_credentials"
                + "&client_id=" + IMAGE_API_KEY
                + "&client_secret=" + IMAGE_SECRET_KEY;

        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(url);
        String response = EntityUtils.toString(client.execute(post).getEntity());
        JSONObject json = JSON.parseObject(response);
        imageAccessToken = json.getString("access_token");
        return imageAccessToken;
    }

    /**
     * 获取语音识别的Access Token
     */
    private String getSpeechAccessToken() throws IOException {
        if (speechAccessToken != null) {
            return speechAccessToken;
        }

        String url = "https://aip.baidubce.com/oauth/2.0/token"
                + "?grant_type=client_credentials"
                + "&client_id=" + SPEECH_API_KEY
                + "&client_secret=" + SPEECH_SECRET_KEY;

        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(url);
        String response = EntityUtils.toString(client.execute(post).getEntity());
        JSONObject json = JSON.parseObject(response);
        speechAccessToken = json.getString("access_token");
        return speechAccessToken;
    }


    /**
     * 调用百度「通用物体识别」API（图片识别）
     * @param imageBase64 图片的Base64编码
     * @return 识别出的物体名称（取置信度最高的）
     */
    public String recognizeImage(String imageBase64) {
        try {
            String url = "https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general"
                    + "?access_token=" + getImageAccessToken();

            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/x-www-form-urlencoded");

            // 构建请求参数
            String body = "image=" + URLEncoder.encode(imageBase64, "UTF-8");
            post.setEntity(new StringEntity(body, "UTF-8"));

            CloseableHttpClient client = HttpClients.createDefault();
            String response = EntityUtils.toString(client.execute(post).getEntity());

            // 解析响应
            JSONObject json = JSON.parseObject(response);
            JSONArray results = json.getJSONArray("result");

            if (results != null && results.size() > 0) {
                // 取第一个结果（置信度最高）
                return results.getJSONObject(0).getString("keyword");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "未知物品";
    }

    /**
     * 调用百度「通用文字识别」API（OCR）
     * @param imageBase64 图片的Base64编码
     * @return 识别出的文字
     */
    public String recognizeText(String imageBase64) {
        try {
            String url = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic"
                    + "?access_token=" + getImageAccessToken();

            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/x-www-form-urlencoded");

            String body = "image=" + URLEncoder.encode(imageBase64, "UTF-8");
            post.setEntity(new StringEntity(body, "UTF-8"));

            CloseableHttpClient client = HttpClients.createDefault();
            String response = EntityUtils.toString(client.execute(post).getEntity());

            JSONObject json = JSON.parseObject(response);
            JSONArray words = json.getJSONArray("words_result");

            if (words != null && words.size() > 0) {
                return words.getJSONObject(0).getString("words");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
    /**
     * 调用百度「语音识别」API
     * @param audioBase64 音频的Base64编码
     * @return 识别出的文字
     */
    public String recognizeSpeech(String audioBase64) {
        try {
            System.out.println("========== 开始语音识别 ==========");
            System.out.println("音频Base64长度: " + audioBase64.length());

            // 解码Base64获取原始字节数
            byte[] audioBytes = Base64.getDecoder().decode(audioBase64);
            System.out.println("原始音频字节数: " + audioBytes.length);

            String token = getSpeechAccessToken();
            System.out.println("Access Token获取成功: " + token.substring(0, 20) + "...");

            String url = "https://vop.baidu.com/server_api";

            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");

            // 构建请求体
            JSONObject body = new JSONObject();
            body.put("format", "wav");  // 百度API不支持mp3，改为wav
            body.put("rate", 16000);
            body.put("channel", 1);
            body.put("cuid", "rubbish-app");
            body.put("token", token);
            body.put("dev_pid", 1537);
            body.put("speech", audioBase64);
            // ✅ 修复：len必须是原始音频字节数
            body.put("len", audioBytes.length);

            System.out.println("请求参数: format=mp3, rate=16000, len=" + audioBytes.length);

            post.setEntity(new StringEntity(body.toJSONString(), "UTF-8"));

            CloseableHttpClient client = HttpClients.createDefault();
            String response = EntityUtils.toString(client.execute(post).getEntity());

            System.out.println("百度API返回结果: " + response);

            JSONObject json = JSON.parseObject(response);

            // 检查是否有错误
            if (json.containsKey("err_no") && json.getIntValue("err_no") != 0) {
                System.out.println("百度API错误码: " + json.getIntValue("err_no"));
                System.out.println("百度API错误信息: " + json.getString("err_msg"));
                return "";
            }

            JSONArray result = json.getJSONArray("result");

            if (result != null && result.size() > 0) {
                String text = result.getString(0);
                System.out.println("识别成功: " + text);
                return text;
            } else {
                System.out.println("识别结果为空");
            }
        } catch (Exception e) {
            System.out.println("语音识别异常: ");
            e.printStackTrace();
        }
        return "";
    }



}
