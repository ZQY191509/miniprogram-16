package com.ex.rubbish.Entity.Authy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class IdentityResponse {
    private String userId;
    private String role;
    private String message;

    public IdentityResponse(String identity) {
        this.userId = identity;
        this.role = "PERMANENT_USER";
        this.message = "Permanent identity assigned successfully";
    }
}
