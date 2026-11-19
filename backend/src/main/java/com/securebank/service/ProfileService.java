package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.Account;
import com.securebank.entity.User;
import com.securebank.exception.ApiException;
import com.securebank.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public ProfileService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(String email) {
        return toResponse(find(email));
    }

    @Transactional
    public ProfileResponse update(String email, UpdateProfileRequest r) {
        User u = find(email);
        u.setFullName(r.fullName().trim());
        u.setMobile(r.mobile());
        u.setAddress(r.address().trim());
        return toResponse(u);
    }

    @Transactional
    public MessageResponse changePassword(String email, ChangePasswordRequest r) {
        User u = find(email);
        if (!encoder.matches(r.currentPassword(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (!r.newPassword().equals(r.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New passwords do not match");
        }
        if (encoder.matches(r.newPassword(), u.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
        }
        u.setPasswordHash(encoder.encode(r.newPassword()));
        return new MessageResponse("Password changed successfully");
    }

    private User find(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private ProfileResponse toResponse(User u) {
        Account a = u.getAccount();
        return new ProfileResponse(u.getFullName(), u.getEmail(), u.getMobile(), u.getDateOfBirth(), u.getAddress(),
                u.getCreatedAt(), a == null ? null : a.getAccountNumber(),
                a == null ? null : a.getAccountType().name(), a == null ? null : a.getStatus().name());
    }
}
