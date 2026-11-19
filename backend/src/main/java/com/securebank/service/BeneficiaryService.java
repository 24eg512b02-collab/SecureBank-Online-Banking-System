package com.securebank.service;

import com.securebank.dto.Dtos.*;
import com.securebank.entity.Account;
import com.securebank.entity.AccountStatus;
import com.securebank.entity.Beneficiary;
import com.securebank.entity.User;
import com.securebank.exception.ApiException;
import com.securebank.repository.AccountRepository;
import com.securebank.repository.BeneficiaryRepository;
import com.securebank.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BeneficiaryService {
    private final BeneficiaryRepository beneficiaries;
    private final AccountRepository accounts;
    private final UserRepository users;

    public BeneficiaryService(BeneficiaryRepository beneficiaries, AccountRepository accounts, UserRepository users) {
        this.beneficiaries = beneficiaries;
        this.accounts = accounts;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<BeneficiaryResponse> list(String email) {
        User u = user(email);
        return beneficiaries.findByUserIdOrderByCreatedAtDesc(u.getId()).stream().map(this::map).toList();
    }

    @Transactional
    public BeneficiaryResponse add(String email, BeneficiaryRequest r) {
        User u = user(email);
        Account target = accounts.findByAccountNumber(r.accountNumber())
                .filter(a -> a.getStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account not found or not active"));
        if (target.getUser().getId().equals(u.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot add your own account as a beneficiary");
        }
        if (beneficiaries.existsByUserIdAndAccountNumber(u.getId(), r.accountNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "Beneficiary already saved");
        }
        Beneficiary b = new Beneficiary();
        b.setUser(u);
        b.setAccountNumber(target.getAccountNumber());
        b.setHolderName(Mappers.maskName(target.getUser().getFullName()));
        b.setNickname(r.nickname() == null || r.nickname().isBlank() ? null : r.nickname().trim());
        return map(beneficiaries.save(b));
    }

    @Transactional
    public void delete(String email, Long id) {
        User u = user(email);
        Beneficiary b = beneficiaries.findByIdAndUserId(id, u.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Beneficiary not found"));
        beneficiaries.delete(b);
    }

    private User user(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private BeneficiaryResponse map(Beneficiary b) {
        return new BeneficiaryResponse(b.getId(), b.getAccountNumber(), b.getHolderName(), b.getNickname());
    }
}
