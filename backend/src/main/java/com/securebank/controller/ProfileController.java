package com.securebank.controller;

import com.securebank.dto.Dtos.*;
import com.securebank.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profile;

    public ProfileController(ProfileService profile) { this.profile = profile; }

    @GetMapping
    public ProfileResponse get(Authentication auth) { return profile.get(auth.getName()); }

    @PutMapping
    public ProfileResponse update(Authentication auth, @Valid @RequestBody UpdateProfileRequest req) {
        return profile.update(auth.getName(), req);
    }

    @PutMapping("/password")
    public MessageResponse changePassword(Authentication auth, @Valid @RequestBody ChangePasswordRequest req) {
        return profile.changePassword(auth.getName(), req);
    }
}
