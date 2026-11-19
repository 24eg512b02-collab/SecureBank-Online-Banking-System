package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.*;
import com.securebank.exception.ApiException;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.TransactionRepository;
import com.securebank.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class AdminService {
    private final UserRepository users;
    private final AccountRepository accounts;
    private final TransactionRepository txs;

    public AdminService(UserRepository users, AccountRepository accounts, TransactionRepository txs) {
        this.users = users;
        this.accounts = accounts;
        this.txs = txs;
    }

    @Transactional(readOnly = true)
    public AdminSummary summary() {
        List<TransactionResponse> recent = txs.findAll(
                PageRequest.of(0, 10, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .getContent().stream().map(Mappers::tx).toList();
        // Only DEPOSIT / WITHDRAWAL rows for the bank-wide chart (transfers just move money between customers).
        List<Transaction> external = txs.findByCreatedAtGreaterThanEqual(Mappers.sixMonthsAgoStart().atStartOfDay())
                .stream().filter(t -> t.getType() == TransactionType.DEPOSIT || t.getType() == TransactionType.WITHDRAWAL)
                .toList();
        return new AdminSummary(users.countCustomers(), accounts.count(), txs.count(),
                Mappers.orZero(txs.sumByType(TransactionType.DEPOSIT)),
                Mappers.orZero(txs.sumByType(TransactionType.WITHDRAWAL)),
                Mappers.orZero(accounts.sumBalances()), recent, Mappers.monthly(external));
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerRow> customers(String q, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return Mappers.page(users.searchCustomers(q == null ? "" : q.trim(), pr), Mappers::customer);
    }

    @Transactional
    public CustomerRow setStatus(Long userId, boolean active) {
        User u = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Customer not found"));
        if (!u.hasRole("ROLE_USER") || u.hasRole("ROLE_ADMIN")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only customer accounts can be changed here");
        }
        u.setEnabled(active);
        if (u.getAccount() != null) {
            u.getAccount().setStatus(active ? AccountStatus.ACTIVE : AccountStatus.INACTIVE);
        }
        return Mappers.customer(u);
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> transactions(TransactionType type, LocalDate from, LocalDate to,
                                                          String q, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return Mappers.page(txs.findAll(TransactionSpecs.filter(null, type, from, to, q), pr), Mappers::tx);
    }
}
