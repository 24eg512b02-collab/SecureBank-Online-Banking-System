package com.securebank.dto;

import com.securebank.entity.AccountType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** All request/response payloads. Validation here mirrors the frontend rules. */
public final class Dtos {
    private Dtos() {}

    public static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,64}$";
    public static final String PASSWORD_MSG =
            "Password must be 8-64 characters and include upper case, lower case, a digit and a special character";

    // ---------- requests ----------
    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 100) String fullName,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be 10 digits") String mobile,
            @NotNull @Past LocalDate dateOfBirth,
            @NotBlank @Size(max = 255) String address,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MSG) String password,
            @NotBlank String confirmPassword,
            AccountType accountType) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    public record MoneyRequest(
            @NotNull @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
            @DecimalMax(value = "10000000.00", message = "Amount exceeds the per-transaction limit")
            @Digits(integer = 12, fraction = 2, message = "Amount can have at most 2 decimal places") BigDecimal amount,
            @Size(max = 255) String description,
            @Size(max = 64) String idempotencyKey) {}

    public record TransferRequest(
            @NotBlank @Pattern(regexp = "^\\d{12}$", message = "Account number must be 12 digits") String toAccountNumber,
            @NotNull @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
            @DecimalMax(value = "10000000.00", message = "Amount exceeds the per-transaction limit")
            @Digits(integer = 12, fraction = 2, message = "Amount can have at most 2 decimal places") BigDecimal amount,
            @Size(max = 255) String description,
            @Size(max = 64) String idempotencyKey) {}

    public record UpdateProfileRequest(
            @NotBlank @Size(min = 2, max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be 10 digits") String mobile,
            @NotBlank @Size(max = 255) String address) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Pattern(regexp = PASSWORD_REGEX, message = PASSWORD_MSG) String newPassword,
            @NotBlank String confirmPassword) {}

    public record BeneficiaryRequest(
            @NotBlank @Pattern(regexp = "^\\d{12}$", message = "Account number must be 12 digits") String accountNumber,
            @Size(max = 60) String nickname) {}

    public record StatusUpdateRequest(@NotNull Boolean active) {}

    // ---------- responses ----------
    public record MessageResponse(String message) {}

    public record ErrorResponse(LocalDateTime timestamp, int status, String message, Map<String, String> fieldErrors) {}

    public record AuthResponse(String token, String tokenType, String email, String fullName, Set<String> roles) {}

    public record RegisterResponse(String message, String accountNumber) {}

    public record ProfileResponse(String fullName, String email, String mobile, LocalDate dateOfBirth, String address,
                                  LocalDateTime memberSince, String accountNumber, String accountType, String accountStatus) {}

    public record AccountResponse(String accountNumber, String accountType, String status, BigDecimal balance,
                                  LocalDateTime openedOn, String customerName, String email, String mobile) {}

    public record LookupResponse(String accountNumber, String maskedHolderName) {}

    public record TransactionResponse(String transactionId, String accountNumber, String type, String direction,
                                      BigDecimal amount, BigDecimal balanceAfter, String counterpartyAccount,
                                      String description, String status, LocalDateTime createdAt) {}

    public record MonthlyPoint(String label, BigDecimal income, BigDecimal spending) {}

    public record DashboardResponse(String fullName, String accountNumber, String accountType, String accountStatus,
                                    BigDecimal balance, BigDecimal totalDeposits, BigDecimal totalWithdrawals,
                                    List<TransactionResponse> recentTransactions, List<MonthlyPoint> monthly) {}

    public record BeneficiaryResponse(Long id, String accountNumber, String holderName, String nickname) {}

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}

    public record CustomerRow(Long id, String fullName, String email, String mobile, String accountNumber,
                              String accountType, BigDecimal balance, String accountStatus, boolean enabled,
                              LocalDateTime createdAt) {}

    public record AdminSummary(long totalCustomers, long totalAccounts, long totalTransactions,
                               BigDecimal totalDeposits, BigDecimal totalWithdrawals, BigDecimal totalBalance,
                               List<TransactionResponse> recentTransactions, List<MonthlyPoint> monthly) {}
}
