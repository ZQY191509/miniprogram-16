package com.ex.rubbish.Service;

import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AuthService {

    /**
     * 生成临时token（模拟）
     */
    public String generateTempToken() {
        // TODO: 后续实现业务逻辑
        return "temp_token_" + UUID.randomUUID().toString();
    }

    /**
     * 分配永久用户身份（模拟）
     */
    public String assignPermanentIdentity(String username, String password) {
        // TODO: 后续实现业务逻辑
        return "user_" + username + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
}