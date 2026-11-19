package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.*;
import com.securebank.exception.ApiException;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.RoleRepository;
import com.securebank.repository.UserRepository;
import com.securebank.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.Period;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository users;
    private final RoleRepository roles;
    private final AccountRepository accounts;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    public AuthService(UserRepository users, RoleRepository roles, AccountRepository accounts,
                       PasswordEncoder encoder, AuthenticationManager authManager, JwtService jwt) {
        this.users = users;
        this.roles = roles;
        this.accounts = accounts;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwt = jwt;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest r) {
        if (!r.password().equals(r.confirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
        if (Period.between(r.dateOfBirth(), LocalDate.now()).getYears() < 18) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You must be at least 18 years old to open an account");
        }
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        User u = new User();
        u.setFullName(r.fullName().trim());
        u.setEmail(email);
        u.setMobile(r.mobile());
        u.setDateOfBirth(r.dateOfBirth());
        u.setAddress(r.address().trim());
        u.setPasswordHash(encoder.encode(r.password()));
        u.getRoles().add(role("ROLE_USER"));
        u = users.save(u);

        Account a = new Account();
        a.setUser(u);
        a.setAccountNumber(newAccountNumber());
        a.setAccountType(r.accountType() == null ? AccountType.SAVINGS : r.accountType());
        a.setBalance(BigDecimal.ZERO);
        a.setStatus(AccountStatus.ACTIVE);
        a = accounts.save(a);

        return new RegisterResponse("Registration successful. Your account has been created.", a.getAccountNumber());
    }

    /** @param adminLogin true for /api/auth/admin/login, false for the customer login. */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest r, boolean adminLogin) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(r.email().trim().toLowerCase(), r.password()));
        Set<String> roleNames = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
        // A customer cannot use the admin door and vice versa; same generic message for both.
        if (roleNames.contains("ROLE_ADMIN") != adminLogin) {
            throw new BadCredentialsException("Invalid email or password");
        }
        User u = users.findByEmailIgnoreCase(r.email().trim()).orElseThrow(() -> new BadCredentialsException("Invalid"));
        return new AuthResponse(jwt.generate(u.getEmail(), roleNames), "Bearer", u.getEmail(), u.getFullName(), roleNames);
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest r) {
        // Demo: no email infrastructure. Always the same answer so account existence is not revealed.
        return new MessageResponse("If an account exists for that email, reset instructions would be sent. "
                + "(Demo build: no email is actually sent.)");
    }

    public Role role(String name) {
        return roles.findByName(name).orElseGet(() -> roles.save(new Role(name)));
    }

    private String newAccountNumber() {
        for (int i = 0; i < 20; i++) {
            long n = 100_000_000_000L + Math.floorMod(RANDOM.nextLong(), 900_000_000_000L); // 12 digits
            String candidate = Long.toString(n);
            if (!accounts.existsByAccountNumber(candidate)) return candidate;
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate an account number, please retry");
    }
}
