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

/**
 * 百度AI接口调用服务
 * 作用：封装百度AI的所有接口调用
 */
@Service
public class BaiduAIService {

    // ========== 填写你自己的百度AI密钥 ==========
    private static final String API_KEY = "wrRORjsP3cTTBtxyNWdRGOpk";
    private static final String SECRET_KEY = "zZAkHtcJTTm5Vx9AJSxkbk8g6Iu6XumI";
    // ============================================

    private String accessToken = null;

    /**
     * 获取Access Token（调用百度API需要先获取token）
     */
    private String getAccessToken() throws IOException {
        if (accessToken != null) {
            return accessToken;
        }

        String url = "https://aip.baidubce.com/oauth/2.0/token"
                + "?grant_type=client_credentials"
                + "&client_id=" + API_KEY
                + "&client_secret=" + SECRET_KEY;

        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost post = new HttpPost(url);
        String response = EntityUtils.toString(client.execute(post).getEntity());
        JSONObject json = JSON.parseObject(response);
        accessToken = json.getString("access_token");
        return accessToken;
    }

    /**
     * 调用百度「通用物体识别」API（图片识别）
     * @param imageBase64 图片的Base64编码
     * @return 识别出的物体名称（取置信度最高的）
     */
    public String recognizeImage(String imageBase64) {
        try {
            String url = "https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general"
                    + "?access_token=" + getAccessToken();

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
                    + "?access_token=" + getAccessToken();

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
}
