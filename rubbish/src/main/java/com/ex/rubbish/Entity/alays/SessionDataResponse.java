package com.ex.rubbish.Entity.alays;
// SessionDataResponse.java - session数据返回实体

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SessionDataResponse {
    private Object data;
    private String timestamp;

    public SessionDataResponse(Object data) {
        this.data = data;
        this.timestamp = String.valueOf(System.currentTimeMillis());
    }
}