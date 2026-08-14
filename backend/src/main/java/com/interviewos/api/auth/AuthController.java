package com.interviewos.api.auth;

import com.interviewos.api.auth.AuthDtos.LoginRequest;
import com.interviewos.api.auth.AuthDtos.ForgotPasswordRequest;
import com.interviewos.api.auth.AuthDtos.LogoutRequest;
import com.interviewos.api.auth.AuthDtos.RefreshRequest;
import com.interviewos.api.auth.AuthDtos.RegisterRequest;
import com.interviewos.api.auth.AuthDtos.ResetPasswordRequest;
import com.interviewos.api.auth.AuthDtos.MessageResponse;
import com.interviewos.api.auth.AuthDtos.TokenResponse;
import com.interviewos.api.auth.AuthDtos.UserResponse;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        TokenResponse response = authService.register(request);
        return ResponseEntity.created(URI.create("/api/users/" + response.user().id())).body(response);
    }

    @PostMapping("/login")
    TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    TokenResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/forgot-password")
    ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.accepted().body(new MessageResponse(
                "If an account exists for that email, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
        return new MessageResponse("Password updated. You can now sign in.");
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    UserResponse me(Authentication authentication) {
        return authService.currentUser(authentication.getName());
    }
}
