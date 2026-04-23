package com.securetaskflow.service;

import com.securetaskflow.config.JwtProperties;
import com.securetaskflow.domain.RefreshToken;
import com.securetaskflow.domain.User;
import com.securetaskflow.dto.request.LoginRequest;
import com.securetaskflow.dto.request.RefreshTokenRequest;
import com.securetaskflow.dto.request.RegisterRequest;
import com.securetaskflow.dto.response.AuthResponse;
import com.securetaskflow.dto.response.UserResponse;
import com.securetaskflow.exception.DuplicateResourceException;
import com.securetaskflow.exception.ResourceNotFoundException;
import com.securetaskflow.repository.RefreshTokenRepository;
import com.securetaskflow.repository.UserRepository;
import com.securetaskflow.security.CustomUserDetails;
import com.securetaskflow.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new DuplicateResourceException(
                    "An account with this email already exists"
            );
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .systemRole(User.SystemRole.USER)
                .isActive(true)
                .isSuspended(false)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        auditService.log(
                user.getId(), user.getEmail(),
                "USER_REGISTERED", "User", user.getId(),
                null, user.getEmail(), null
        );

        CustomUserDetails userDetails = new CustomUserDetails(user);
        return buildAuthResponse(userDetails);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase(),
                        request.getPassword()
                )
        );

        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();

        userRepository.resetLoginAttempts(userDetails.getUserId());

        auditService.log(
                userDetails.getUserId(), userDetails.getEmail(),
                "USER_LOGIN", "User", userDetails.getUserId(),
                null, null, null
        );

        log.info("User logged in: {}", userDetails.getEmail());
        return buildAuthResponse(userDetails);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String incomingToken = request.getRefreshToken();
        String tokenHash = hashToken(incomingToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Invalid or expired refresh token")
                );

        if (!stored.isValid()) {
            refreshTokenRepository.revokeAllUserTokens(stored.getUser().getId());
            log.warn("Invalid refresh token used for user: {}",
                    stored.getUser().getEmail());
            throw new ResourceNotFoundException("Invalid or expired refresh token");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        CustomUserDetails userDetails = new CustomUserDetails(stored.getUser());
        return buildAuthResponse(userDetails);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllUserTokens(userId);
        log.info("User logged out, all tokens revoked for userId: {}", userId);
    }

    private AuthResponse buildAuthResponse(CustomUserDetails userDetails) {
        String accessToken  = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        saveRefreshToken(userDetails, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenExpiryMs() / 1000)
                .user(toUserResponse(userDetails))
                .build();
    }

    private void saveRefreshToken(CustomUserDetails userDetails, String rawToken) {
        RefreshToken token = RefreshToken.builder()
                .user(userRepository.getReferenceById(userDetails.getUserId()))
                .tokenHash(hashToken(rawToken))
                .expiresAt(Instant.now().plusMillis(
                        jwtProperties.getRefreshTokenExpiryMs()
                ))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(token);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    rawToken.getBytes(StandardCharsets.UTF_8)
            );
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "SHA-256 not available — JVM configuration error", e
            );
        }
    }

    private UserResponse toUserResponse(CustomUserDetails userDetails) {
        return UserResponse.builder()
                .id(userDetails.getUserId())
                .email(userDetails.getEmail())
                .build();
    }
}