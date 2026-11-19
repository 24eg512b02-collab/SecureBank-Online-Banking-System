package com.securebank.controller;

import com.securebank.dto.Dtos.*;
import com.securebank.service.AccountService;
import com.securebank.service.TransactionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AccountController {
    private final AccountService accounts;
    private final TransactionService transactions;

    public AccountController(AccountService accounts, TransactionService transactions) {
        this.accounts = accounts;
        this.transactions = transactions;
    }

    @GetMapping("/account")
    public AccountResponse account(Authentication auth) { return accounts.get(auth.getName()); }

    @GetMapping("/account/lookup/{accountNumber}")
    public LookupResponse lookup(@PathVariable String accountNumber) { return accounts.lookup(accountNumber); }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(Authentication auth) { return transactions.dashboard(auth.getName()); }
}
