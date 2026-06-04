package com.ex.rubbish.Entity.Authy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TokenResponse {
    private String token;
    private long expireTime;
    private String message;

    public TokenResponse(String token) {
        this.token = token;
        this.expireTime = System.currentTimeMillis() + 3600000;
        this.message = "Temporary token generated successfully";
    }
}