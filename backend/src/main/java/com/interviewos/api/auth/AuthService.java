package com.interviewos.api.auth;

import com.interviewos.api.auth.AuthDtos.LoginRequest;
import com.interviewos.api.auth.AuthDtos.RegisterRequest;
import com.interviewos.api.auth.AuthDtos.TokenResponse;
import com.interviewos.api.auth.AuthDtos.UserResponse;
import com.interviewos.api.config.JwtProperties;
import com.interviewos.api.security.JwtService;
import com.interviewos.api.user.User;
import com.interviewos.api.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetMailService passwordResetMailService;
    private final PasswordEncoder passwordEncoder;
    private final String dummyPasswordHash;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final long passwordResetTokenMinutes;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordResetMailService passwordResetMailService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            @org.springframework.beans.factory.annotation.Value("${interviewos.password-reset.token-minutes}")
            long passwordResetTokenMinutes
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetMailService = passwordResetMailService;
        this.passwordEncoder = passwordEncoder;
        this.dummyPasswordHash = passwordEncoder.encode("interviewos-invalid-login");
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.passwordResetTokenMinutes = passwordResetTokenMinutes;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists for this email");
        }
        User user = userRepository.save(new User(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim()));
        return issueTokens(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        Optional<User> matchingUser = userRepository.findByEmailIgnoreCase(email);
        String passwordHash = matchingUser.map(User::getPasswordHash).orElse(dummyPasswordHash);
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);
        if (matchingUser.isEmpty() || !matchingUser.get().isEnabled() || !passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return issueTokens(matchingUser.get());
    }

    @Transactional
    public TokenResponse refresh(String rawToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is invalid"));
        if (refreshToken.getRevokedAt() != null || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is expired or revoked");
        }
        if (!refreshToken.getUser().isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is disabled");
        }
        refreshToken.revoke();
        return issueTokens(refreshToken.getUser());
    }

    @Transactional
    public void requestPasswordReset(String requestedEmail) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(requestedEmail)).ifPresent(user -> {
            boolean requestedRecently = passwordResetTokenRepository.findTopByUserOrderByCreatedAtDesc(user)
                    .map(token -> token.getCreatedAt().isAfter(Instant.now().minus(Duration.ofMinutes(1))))
                    .orElse(false);
            if (requestedRecently) {
                return;
            }
            passwordResetTokenRepository.deleteByUser(user);
            byte[] tokenBytes = new byte[48];
            secureRandom.nextBytes(tokenBytes);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            passwordResetTokenRepository.save(new PasswordResetToken(
                    user, hash(rawToken), Instant.now().plus(Duration.ofMinutes(passwordResetTokenMinutes))));
            passwordResetMailService.send(user, rawToken);
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> invalidResetToken());
        if (resetToken.getUsedAt() != null || !resetToken.getExpiresAt().isAfter(Instant.now())) {
            throw invalidResetToken();
        }
        User user = resetToken.getUser();
        user.changePassword(passwordEncoder.encode(newPassword));
        resetToken.markUsed();
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> {
            if (token.getRevokedAt() == null) {
                token.revoke();
            }
        });
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private TokenResponse issueTokens(User user) {
        byte[] tokenBytes = new byte[48];
        secureRandom.nextBytes(tokenBytes);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        Instant expiresAt = Instant.now().plus(Duration.ofDays(jwtProperties.refreshTokenDays()));
        refreshTokenRepository.save(new RefreshToken(user, hash(rawRefreshToken), expiresAt));
        return new TokenResponse(
                jwtService.createAccessToken(user),
                rawRefreshToken,
                "Bearer",
                jwtService.accessTokenSeconds(),
                UserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException invalidResetToken() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "This password reset link is invalid or has expired");
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
