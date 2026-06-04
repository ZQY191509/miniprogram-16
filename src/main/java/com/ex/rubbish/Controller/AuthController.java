package com.ex.rubbish.Controller;
// AuthController.java

import com.ex.rubbish.Entity.Authy.IdentityResponse;
import com.ex.rubbish.Entity.Authy.LoginRequest;
import com.ex.rubbish.Entity.Authy.TokenResponse;
import com.ex.rubbish.Service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * 1. 注册临时token，返回token
     */
    @PostMapping("/temp-token")
    public ResponseEntity<TokenResponse> registerTempToken() {
        String tempToken = authService.generateTempToken();
        return ResponseEntity.ok(new TokenResponse(tempToken));
    }

    /**
     * 2. 根据注册的账号和密码分配一个永久用户身份，返回身份
     */
    @PostMapping("/permanent-identity")
    public ResponseEntity<IdentityResponse> assignPermanentIdentity(@RequestBody LoginRequest loginRequest) {
        String identity = authService.assignPermanentIdentity(loginRequest.getUsername(), loginRequest.getPassword());
        return ResponseEntity.ok(new IdentityResponse(identity));
    }
}