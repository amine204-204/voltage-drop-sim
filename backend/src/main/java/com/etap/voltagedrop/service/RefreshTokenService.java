package com.etap.voltagedrop.service;

import com.etap.voltagedrop.persistence.entity.RefreshTokenEntity;
import com.etap.voltagedrop.persistence.entity.UserEntity;
import com.etap.voltagedrop.repository.jpa.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    public String generateRefreshToken(UserDetails userDetails, UserEntity user) {
        RefreshTokenEntity entity = new RefreshTokenEntity();
        entity.setToken(UUID.randomUUID().toString());
        entity.setUser(user);
        entity.setExpiryDate(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000));
        entity.setRevoked(false);
        refreshTokenRepository.save(entity);
        return entity.getToken();
    }

    public boolean validateRefreshToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .filter(t -> !t.isRevoked())
                .filter(t -> t.getExpiryDate().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    public void revokeToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    public RefreshTokenEntity findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
    }
}
