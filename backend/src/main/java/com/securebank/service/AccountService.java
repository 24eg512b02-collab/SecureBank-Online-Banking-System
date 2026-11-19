package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.Account;
import com.securebank.entity.AccountStatus;
import com.securebank.entity.User;
import com.securebank.exception.ApiException;
import com.securebank.repository.AccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final AccountRepository accounts;

    public AccountService(AccountRepository accounts) { this.accounts = accounts; }

    @Transactional(readOnly = true)
    public AccountResponse get(String email) {
        Account a = accounts.findByUserEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found"));
        User u = a.getUser();
        return new AccountResponse(a.getAccountNumber(), a.getAccountType().name(), a.getStatus().name(),
                a.getBalance(), a.getCreatedAt(), u.getFullName(), u.getEmail(), u.getMobile());
    }

    /** Lets a customer confirm a beneficiary before sending money. Reveals only a masked name - never balance/contact data. */
    @Transactional(readOnly = true)
    public LookupResponse lookup(String accountNumber) {
        if (accountNumber == null || !accountNumber.matches("^\\d{12}$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Account number must be 12 digits");
        }
        Account a = accounts.findByAccountNumber(accountNumber)
                .filter(acc -> acc.getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found or not active"));
        return new LookupResponse(a.getAccountNumber(), Mappers.maskName(a.getUser().getFullName()));
    }
}
