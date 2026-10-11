package com.etap.voltagedrop.service;

import com.etap.voltagedrop.dto.admin.CreateUserRequest;
import com.etap.voltagedrop.dto.admin.UserSummaryDto;
import com.etap.voltagedrop.persistence.entity.UserEntity;
import com.etap.voltagedrop.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserSummaryDto> listAllUsers() {
        return userRepository.findAll().stream()
                .map(UserSummaryDto::fromEntity)
                .toList();
    }

    public Optional<UserEntity> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByRole(UserEntity.Role role) {
        return userRepository.existsByRole(role);
    }

    public UserSummaryDto createUser(CreateUserRequest request) {
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserEntity.Role.valueOf(request.getRole().toUpperCase()));
        return UserSummaryDto.fromEntity(userRepository.save(user));
    }

    public UserSummaryDto createUser(String username, String email, String rawPassword, UserEntity.Role role) {
        UserEntity user = new UserEntity();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        return UserSummaryDto.fromEntity(userRepository.save(user));
    }

    public Optional<UserSummaryDto> updateRole(Long id, String role) {
        return userRepository.findById(id).map(user -> {
            user.setRole(UserEntity.Role.valueOf(role.toUpperCase()));
            return UserSummaryDto.fromEntity(userRepository.save(user));
        });
    }

    public boolean deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            return false;
        }
        userRepository.deleteById(id);
        return true;
    }

    public UserSummaryDto updateProfile(Long id, String username, String email) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!user.getUsername().equals(username) && existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (!user.getEmail().equals(email) && existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setUsername(username);
        user.setEmail(email);
        return UserSummaryDto.fromEntity(userRepository.save(user));
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
