package com.ex.rubbish.Entity.Re;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoryResponse {
    private int code;
    private String message;

    public CategoryResponse(int code) {
        this.code = code;
        this.message = code >= 0 ? "Success" : "Timeout or Error";
    }
}
